-- Mercadog · equipe (login do painel) e pedidos (carrinho + agendamentos)
-- Rodar depois do schema.sql: SQL Editor → New query → colar → Run.
-- Idempotente: pode rodar de novo sem quebrar nada.

-- ===========================================================================
-- Equipe
-- Só quem está nesta tabela mexe no painel. Estar logado não basta: se o
-- cadastro público do Supabase Auth ficar ligado por engano, um estranho que
-- crie conta continua sem acesso a nada.
-- ===========================================================================
create table if not exists public.equipe (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  papel      text not null default 'dono' check (papel in ('dono', 'atendimento')),
  created_at timestamptz not null default now()
);

alter table public.equipe enable row level security;

create or replace function public.is_equipe()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.equipe where user_id = auth.uid())
$$;

drop policy if exists "equipe ve a equipe" on public.equipe;
create policy "equipe ve a equipe" on public.equipe
  for select to authenticated using (public.is_equipe());

-- Catálogo e fotos: troca "qualquer logado" por "membro da equipe"
drop policy if exists "categorias escrita equipe" on public.categorias;
create policy "categorias escrita equipe" on public.categorias
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

drop policy if exists "produtos escrita equipe" on public.produtos;
create policy "produtos escrita equipe" on public.produtos
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

drop policy if exists "fotos escrita equipe" on storage.objects;
create policy "fotos escrita equipe" on storage.objects
  for all to authenticated
  using (bucket_id = 'produtos' and public.is_equipe())
  with check (bucket_id = 'produtos' and public.is_equipe());

-- ===========================================================================
-- Pedidos
-- Um pedido é um carrinho da loja ou um agendamento (banho/tosa ou consulta).
-- O cliente nunca lê nem altera a tabela: cria pelo criar_pedido() e o resto
-- acontece no painel.
-- ===========================================================================
create table if not exists public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint generated always as identity unique,  -- "#42" na conversa
  tipo             text not null check (tipo in ('loja', 'banho_tosa', 'consulta')),
  status           text not null default 'pendente'
                     check (status in ('pendente', 'confirmado', 'recusado', 'concluido')),

  cliente_nome     text not null,
  cliente_telefone text not null,  -- só dígitos, com DDD
  observacoes      text,

  -- loja
  itens            jsonb,          -- [{ produto_id, nome, detalhes, preco, quantidade }]
  total            numeric(10, 2), -- soma dos itens com preço
  sob_consulta     boolean not null default false, -- algum item sem preço
  entrega          text check (entrega in ('retirada', 'entrega')),
  endereco         text,

  -- agendamento
  servico          text,           -- "Banho (porte médio, R$ 75,00)"
  data             date,
  horario          text check (horario ~ '^\d{2}:\d{2}$'),
  pet_nome         text,
  pet_porte        text,

  -- resposta da equipe
  nota_interna     text,
  respondido_por   uuid references auth.users (id) on delete set null,
  respondido_em    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists pedidos_status_idx on public.pedidos (status, created_at desc);
create index if not exists pedidos_agenda_idx on public.pedidos (tipo, data, horario)
  where status = 'confirmado';

drop trigger if exists pedidos_touch on public.pedidos;
create trigger pedidos_touch before update on public.pedidos
  for each row execute function public.touch_updated_at();

alter table public.pedidos enable row level security;
revoke all on public.pedidos from anon;

drop policy if exists "pedidos equipe" on public.pedidos;
create policy "pedidos equipe" on public.pedidos
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

-- Painel atualiza sozinho quando chega pedido novo
do $$
begin
  alter publication supabase_realtime add table public.pedidos;
exception when duplicate_object or undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- criar_pedido(p) — única porta de entrada do site para gravar pedido.
-- Preço de produto é sempre relido do banco: o carrinho do navegador manda só
-- id e quantidade, então ninguém forja valor.
-- Devolve { id, numero } para montar a mensagem do WhatsApp.
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
        'preco', v_prod.preco, 'quantidade', v_qtd);
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
    v_data := (p->>'data')::date;
    if v_data is null or v_data < current_date or v_data > current_date + 90 then
      raise exception 'data_invalida';
    end if;
    if v_horario is null or v_horario !~ '^\d{2}:\d{2}$' then raise exception 'horario_invalido'; end if;
    if length(btrim(coalesce(p->>'servico', ''))) = 0 then raise exception 'servico_invalido'; end if;
    if length(btrim(coalesce(p->>'pet_nome', ''))) = 0 then raise exception 'pet_invalido'; end if;

    -- horário já confirmado para outro cliente não pode ser pedido de novo
    if exists (select 1 from public.pedidos
                where tipo = v_tipo and data = v_data and horario = v_horario
                  and status = 'confirmado') then
      raise exception 'horario_ocupado';
    end if;

    insert into public.pedidos
      (tipo, cliente_nome, cliente_telefone, observacoes, servico, data, horario, pet_nome, pet_porte)
    values
      (v_tipo, v_nome, v_tel, v_obs, btrim(left(p->>'servico', 200)), v_data, v_horario,
       btrim(left(p->>'pet_nome', 80)), nullif(btrim(left(coalesce(p->>'pet_porte', ''), 30)), ''))
    returning * into v_pedido;
  end if;

  return jsonb_build_object('id', v_pedido.id, 'numero', v_pedido.numero);
end $$;

-- ---------------------------------------------------------------------------
-- horarios_ocupados — o que a agenda do site deve esconder.
-- Só data e horário: nenhum dado do cliente sai daqui.
-- ---------------------------------------------------------------------------
create or replace function public.horarios_ocupados(p_tipo text)
returns table (data date, horario text)
language sql stable security definer set search_path = public
as $$
  select data, horario from public.pedidos
   where tipo = p_tipo and status = 'confirmado' and data >= current_date
$$;

revoke all on function public.criar_pedido(jsonb) from public;
revoke all on function public.horarios_ocupados(text) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
grant execute on function public.horarios_ocupados(text) to anon, authenticated;
grant execute on function public.is_equipe() to anon, authenticated;
