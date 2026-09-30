-- Mercadog · produtos que exigem receita veterinária
-- Rodar depois do 007: SQL Editor → New query → colar → Run. Idempotente.
--
-- Quem decide o que exige receita é o veterinário responsável — pelo painel
-- (Produtos → "Receita"). Nenhum produto vem marcado por padrão.

alter table public.produtos
  add column if not exists exige_receita boolean not null default false;

-- Para marcar uma categoria inteira de uma vez (ex.: antibióticos), descomente:
-- update public.produtos set exige_receita = true where categoria = 'antibioticos';

-- ---------------------------------------------------------------------------
-- criar_pedido — igual ao do 004/006, mas cada item do carrinho guarda se
-- exige receita, para o painel e a mensagem avisarem
-- ---------------------------------------------------------------------------
create or replace function public.criar_pedido(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_tipo      text := p->>'tipo';
  v_nome      text := btrim(coalesce(p->>'cliente_nome', ''));
  v_tel       text := regexp_replace(coalesce(p->>'cliente_telefone', ''), '\D', '', 'g');
  v_obs       text := nullif(btrim(left(coalesce(p->>'observacoes', ''), 1000)), '');
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
  if coalesce(v_tipo, '') not in ('loja', 'banho_tosa', 'consulta') then
    raise exception 'tipo_invalido';
  end if;
  if length(v_nome) < 3 then raise exception 'nome_invalido'; end if;
  if length(v_tel) < 10 or length(v_tel) > 13 then raise exception 'telefone_invalido'; end if;

  -- freio contra robô/spam: no máximo 5 pedidos pendentes por telefone na última hora
  if (select count(*) from public.pedidos
       where cliente_telefone = v_tel and status = 'pendente'
         and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'muitos_pedidos';
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
      v_qtd := least(greatest(coalesce((v_item->>'quantidade')::int, 1), 1), 99);
      select * into v_prod from public.produtos where id = (v_item->>'produto_id')::uuid;
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

  return jsonb_build_object('id', v_pedido.id, 'numero', v_pedido.numero);
end $$;

revoke all on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
