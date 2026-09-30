-- Mercadog · reforço de segurança contra spam e abuso
-- Rodar depois do 008: SQL Editor → New query → colar → Run. Idempotente.
--
-- O freio do criar_pedido era só "5 pedidos por telefone por hora" — trocando
-- o telefone a cada envio, um robô enchia o painel. Agora há também limite
-- por aparelho (IP), um teto geral por hora e tamanho máximo do pedido.

-- ===========================================================================
-- Registro de envios por IP. Guarda só um hash do IP (não dá para saber quem
-- é) e é apagado sozinho depois de 1 dia. Ninguém de fora lê nem escreve.
-- ===========================================================================
create table if not exists public.pedidos_envios (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index if not exists pedidos_envios_ip_idx on public.pedidos_envios (ip_hash, created_at desc);

alter table public.pedidos_envios enable row level security;
revoke all on public.pedidos_envios from anon, authenticated;

-- IP de quem chamou a API (o Supabase repassa os cabeçalhos da requisição)
create or replace function public.ip_requisicao()
returns text
language plpgsql stable
as $$
declare
  v_h json;
begin
  v_h := nullif(current_setting('request.headers', true), '')::json;
  return coalesce(
    nullif(btrim(v_h->>'cf-connecting-ip'), ''),
    nullif(btrim(split_part(v_h->>'x-forwarded-for', ',', 1)), ''),
    'desconhecido');
exception when others then
  return 'desconhecido';
end $$;

revoke all on function public.ip_requisicao() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- criar_pedido — igual ao do 008, com os freios novos no começo
-- ---------------------------------------------------------------------------
create or replace function public.criar_pedido(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_tipo      text := p->>'tipo';
  v_nome      text := btrim(left(coalesce(p->>'cliente_nome', ''), 100));
  v_tel       text := regexp_replace(left(coalesce(p->>'cliente_telefone', ''), 40), '\D', '', 'g');
  v_obs       text := nullif(btrim(left(coalesce(p->>'observacoes', ''), 1000)), '');
  v_ip        text := md5('mercadog:' || public.ip_requisicao());
  v_itens     jsonb := '[]'::jsonb;
  v_total     numeric(10, 2) := 0;
  v_sob       boolean := false;
  v_item      jsonb;
  v_qtd       int;
  v_prod      public.produtos;
  v_data      date;
  v_horario   text := p->>'horario';
  v_entrega   text := p->>'entrega';
  v_motivo    text;
  v_pedido    public.pedidos;
begin
  -- pedido de verdade tem poucos KB; recusa carga gigante antes de qualquer coisa
  if octet_length(p::text) > 30000 then raise exception 'pedido_grande'; end if;

  if coalesce(v_tipo, '') not in ('loja', 'banho_tosa', 'consulta') then
    raise exception 'tipo_invalido';
  end if;
  if length(v_nome) < 3 then raise exception 'nome_invalido'; end if;
  if length(v_tel) < 10 or length(v_tel) > 13 then raise exception 'telefone_invalido'; end if;

  -- freios contra robô/spam
  -- 1) no máximo 5 pedidos pendentes por telefone na última hora
  if (select count(*) from public.pedidos
       where cliente_telefone = v_tel and status = 'pendente'
         and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'muitos_pedidos';
  end if;
  -- 2) no máximo 8 pedidos por aparelho (IP) na última hora
  if (select count(*) from public.pedidos_envios
       where ip_hash = v_ip and created_at > now() - interval '1 hour') >= 8 then
    raise exception 'limite_pedidos';
  end if;
  -- 3) teto geral: mais de 60 pedidos pendentes na última hora é ataque, não cliente
  if (select count(*) from public.pedidos
       where status = 'pendente' and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'limite_pedidos';
  end if;

  if v_tipo = 'loja' then
    if coalesce(jsonb_typeof(p->'itens'), '') <> 'array'
       or jsonb_array_length(p->'itens') not between 1 and 60 then
      raise exception 'carrinho_invalido';
    end if;
    if coalesce(v_entrega, '') not in ('retirada', 'entrega') then raise exception 'entrega_invalida'; end if;
    if v_entrega = 'entrega' and length(btrim(coalesce(p->>'endereco', ''))) < 8 then
      raise exception 'endereco_invalido';
    end if;

    for v_item in select * from jsonb_array_elements(p->'itens') loop
      begin
        v_qtd := least(greatest(coalesce((v_item->>'quantidade')::int, 1), 1), 99);
        select * into v_prod from public.produtos where id = (v_item->>'produto_id')::uuid;
      exception when invalid_text_representation or numeric_value_out_of_range then
        raise exception 'carrinho_invalido';
      end;
      if not found then raise exception 'produto_inexistente'; end if;
      if not v_prod.disponivel then raise exception 'produto_sem_estoque:%', v_prod.nome; end if;

      v_itens := v_itens || jsonb_build_object(
        'produto_id', v_prod.id, 'nome', v_prod.nome, 'detalhes', v_prod.detalhes,
        'preco', v_prod.preco, 'quantidade', v_qtd, 'exige_receita', v_prod.exige_receita);
      if v_prod.preco is null then v_sob := true;
      else v_total := v_total + v_prod.preco * v_qtd;
      end if;
    end loop;

    insert into public.pedidos
      (tipo, cliente_nome, cliente_telefone, observacoes, itens, total, sob_consulta, entrega, endereco)
    values
      (v_tipo, v_nome, v_tel, v_obs, v_itens, v_total, v_sob, v_entrega,
       case when v_entrega = 'entrega' then btrim(left(p->>'endereco', 300)) end)
    returning * into v_pedido;
  else
    if length(btrim(coalesce(p->>'servico', ''))) = 0 then raise exception 'servico_invalido'; end if;
    if length(btrim(coalesce(p->>'pet_nome', ''))) = 0 then raise exception 'pet_invalido'; end if;

    begin
      v_data := (p->>'data')::date;
    exception when others then
      raise exception 'data_invalida';
    end;
    v_motivo := public.motivo_horario_invalido(v_tipo, v_data, v_horario);
    if v_motivo is not null then raise exception '%', v_motivo; end if;

    insert into public.pedidos
      (tipo, cliente_nome, cliente_telefone, observacoes, servico, data, horario, pet_nome, pet_porte)
    values
      (v_tipo, v_nome, v_tel, v_obs, btrim(left(p->>'servico', 200)), v_data, v_horario,
       btrim(left(p->>'pet_nome', 80)), nullif(btrim(left(coalesce(p->>'pet_porte', ''), 30)), ''))
    returning * into v_pedido;
  end if;

  -- conta o envio e aproveita para limpar registros com mais de 1 dia
  insert into public.pedidos_envios (ip_hash) values (v_ip);
  delete from public.pedidos_envios where created_at < now() - interval '1 day';

  return jsonb_build_object('id', v_pedido.id, 'numero', v_pedido.numero);
end $$;

revoke all on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;

-- ===========================================================================
-- Fotos: só imagem, até 5 MB (mesmo alguém da equipe não sobe outra coisa)
-- ===========================================================================
update storage.buckets
   set file_size_limit = 5 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
 where id = 'produtos';
