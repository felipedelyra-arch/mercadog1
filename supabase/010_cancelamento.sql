-- Mercadog · cliente acompanha e cancela o próprio pedido
-- Rodar depois do 009: SQL Editor → New query → colar → Run. Idempotente.
--
-- Cada pedido ganha um código secreto (32 letras/números, impossível de
-- adivinhar). Quem tem o link /pedido/<código> vê o pedido e pode cancelar —
-- é o mesmo princípio de "quem tem o link": o cliente recebe na tela final e
-- na mensagem de confirmação da equipe. Nada além disso fica exposto.
--
-- Regras do cancelamento:
--   · aguardando confirmação → cancela sempre;
--   · loja confirmada → cancela (a equipe recebe o aviso na hora);
--   · agendamento confirmado → só até 2 horas antes do horário;
--   · recusado, concluído ou já cancelado → não cancela.
-- Horário cancelado volta a ficar livre na agenda sozinho (só "confirmado"
-- ocupa horário).

-- ===========================================================================
-- Colunas novas e status "cancelado"
-- ===========================================================================
alter table public.pedidos
  add column if not exists codigo text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  add column if not exists cancelado_em timestamptz,
  add column if not exists motivo_cancelamento text;

do $$
declare
  v_nome text;
begin
  for v_nome in
    select c.conname from pg_constraint c
     where c.conrelid = 'public.pedidos'::regclass and c.contype = 'c'
       and pg_get_constraintdef(c.oid) like '%status%'
  loop
    execute format('alter table public.pedidos drop constraint %I', v_nome);
  end loop;
end $$;

alter table public.pedidos add constraint pedidos_status_check
  check (status in ('pendente', 'confirmado', 'recusado', 'concluido', 'cancelado'));

-- ---------------------------------------------------------------------------
-- pode_cancelar — mesma regra para a página do cliente e para o cancelamento
-- ---------------------------------------------------------------------------
create or replace function public.pode_cancelar(p public.pedidos)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when p.status = 'pendente' then true
    when p.status = 'confirmado' and p.tipo = 'loja' then true
    when p.status = 'confirmado' then
      p.data + p.horario::time > public.agora_loja() + interval '2 hours'
    else false
  end
$$;

revoke all on function public.pode_cancelar(public.pedidos) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- ver_pedido(codigo) — o que o cliente vê na página do pedido. Sem telefone,
-- sem anotação da equipe: só o que ele mesmo mandou e o andamento.
-- ---------------------------------------------------------------------------
create or replace function public.ver_pedido(p_codigo text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v public.pedidos;
begin
  if p_codigo is null or p_codigo !~ '^[0-9a-f]{32}$' then return null; end if;
  select * into v from public.pedidos where codigo = p_codigo;
  if not found then return null; end if;

  return jsonb_build_object(
    'numero', v.numero,
    'tipo', v.tipo,
    'status', v.status,
    'created_at', v.created_at,
    'cliente_nome', split_part(v.cliente_nome, ' ', 1),
    'itens', (select jsonb_agg(el - 'produto_id') from jsonb_array_elements(v.itens) as t(el)),
    'total', v.total,
    'sob_consulta', v.sob_consulta,
    'entrega', v.entrega,
    'endereco', v.endereco,
    'servico', v.servico,
    'data', v.data,
    'horario', v.horario,
    'pet_nome', v.pet_nome,
    'cancelado_em', v.cancelado_em,
    'pode_cancelar', public.pode_cancelar(v)
  );
end $$;

-- ---------------------------------------------------------------------------
-- cancelar_pedido(codigo, motivo) — devolve o pedido já atualizado
-- ---------------------------------------------------------------------------
create or replace function public.cancelar_pedido(p_codigo text, p_motivo text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v public.pedidos;
begin
  if p_codigo is null or p_codigo !~ '^[0-9a-f]{32}$' then raise exception 'pedido_inexistente'; end if;
  select * into v from public.pedidos where codigo = p_codigo for update;
  if not found then raise exception 'pedido_inexistente'; end if;
  if not public.pode_cancelar(v) then raise exception 'nao_cancelavel'; end if;

  update public.pedidos
     set status = 'cancelado',
         cancelado_em = now(),
         motivo_cancelamento = nullif(btrim(left(coalesce(p_motivo, ''), 300)), '')
   where id = v.id;

  return public.ver_pedido(p_codigo);
end $$;

revoke all on function public.ver_pedido(text) from public;
revoke all on function public.cancelar_pedido(text, text) from public;
grant execute on function public.ver_pedido(text) to anon, authenticated;
grant execute on function public.cancelar_pedido(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- criar_pedido — igual ao do 009, mas devolve também o código do pedido
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

  return jsonb_build_object('id', v_pedido.id, 'numero', v_pedido.numero, 'codigo', v_pedido.codigo);
end $$;

revoke all on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
