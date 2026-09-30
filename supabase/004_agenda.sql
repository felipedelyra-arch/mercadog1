-- Mercadog · agenda controlada pelo painel
-- Rodar depois do 002: SQL Editor → New query → colar → Run. Idempotente.
--
-- Horário de funcionamento, duração do atendimento, antecedência e dias
-- fechados saem do banco. O painel edita, o site lê a mesma fonte e o
-- criar_pedido recusa qualquer horário fora dessa grade.

-- ===========================================================================
-- Configuração de cada agenda
-- ===========================================================================
create table if not exists public.agenda_config (
  tipo                 text primary key check (tipo in ('banho_tosa', 'consulta')),
  slot_minutos         int  not null default 30 check (slot_minutos between 10 and 240),
  antecedencia_minutos int  not null default 90 check (antecedencia_minutos between 0 and 2880),
  dias_exibidos        int  not null default 10 check (dias_exibidos between 1 and 60),
  -- dia da semana ("0" = domingo … "6" = sábado) → faixas [["08:00","12:00"], …] ou null (fechado)
  semana               jsonb not null,
  updated_at           timestamptz not null default now()
);

drop trigger if exists agenda_config_touch on public.agenda_config;
create trigger agenda_config_touch before update on public.agenda_config
  for each row execute function public.touch_updated_at();

-- Valores iniciais = o que estava em src/config/hours.js (não sobrescreve edições)
insert into public.agenda_config (tipo, slot_minutos, antecedencia_minutos, dias_exibidos, semana) values
  ('banho_tosa', 45, 90, 10, '{
     "0": null,
     "1": [["08:00","12:00"],["13:30","18:00"]],
     "2": [["08:00","12:00"],["13:30","18:00"]],
     "3": [["08:00","12:00"],["13:30","18:00"]],
     "4": [["08:00","12:00"],["13:30","18:00"]],
     "5": [["08:00","12:00"],["13:30","18:00"]],
     "6": [["08:00","12:00"]]
   }'),
  ('consulta', 30, 90, 10, '{
     "0": null,
     "1": [["08:00","12:00"],["13:30","19:00"]],
     "2": [["08:00","12:00"],["13:30","19:00"]],
     "3": [["08:00","12:00"],["13:30","19:00"]],
     "4": [["08:00","12:00"],["13:30","19:00"]],
     "5": [["08:00","12:00"],["13:30","19:00"]],
     "6": [["08:00","12:00"]]
   }')
on conflict (tipo) do nothing;

-- ===========================================================================
-- Bloqueios: dia inteiro (feriado, folga) ou um horário específico
-- ===========================================================================
create table if not exists public.agenda_bloqueios (
  id         uuid primary key default gen_random_uuid(),
  tipo       text check (tipo in ('banho_tosa', 'consulta')), -- null = as duas agendas
  data       date not null,
  horario    text check (horario ~ '^\d{2}:\d{2}$'),          -- null = dia inteiro
  motivo     text,
  created_at timestamptz not null default now()
);

create index if not exists agenda_bloqueios_data_idx on public.agenda_bloqueios (data);

-- ===========================================================================
-- Acesso: o site lê pela função agenda_publica; só a equipe escreve
-- ===========================================================================
alter table public.agenda_config    enable row level security;
alter table public.agenda_bloqueios enable row level security;
revoke all on public.agenda_config, public.agenda_bloqueios from anon;

drop policy if exists "agenda config equipe" on public.agenda_config;
create policy "agenda config equipe" on public.agenda_config
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

drop policy if exists "agenda bloqueios equipe" on public.agenda_bloqueios;
create policy "agenda bloqueios equipe" on public.agenda_bloqueios
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

-- ---------------------------------------------------------------------------
-- Hora local da loja — o banco roda em UTC, e às 21h em Tupã já é "amanhã" lá.
-- ---------------------------------------------------------------------------
create or replace function public.agora_loja()
returns timestamp language sql stable
as $$ select (now() at time zone 'America/Sao_Paulo') $$;

create or replace function public.hhmm_minutos(h text)
returns int language sql immutable
as $$ select split_part(h, ':', 1)::int * 60 + split_part(h, ':', 2)::int $$;

-- ---------------------------------------------------------------------------
-- agenda_publica(tipo) — tudo o que o site precisa para montar a agenda,
-- numa chamada só. Nenhum dado de cliente: ocupados é só data + horário.
-- ---------------------------------------------------------------------------
create or replace function public.agenda_publica(p_tipo text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'agora', to_char(public.agora_loja(), 'YYYY-MM-DD"T"HH24:MI'),
    'config', (select to_jsonb(c) - 'updated_at' from public.agenda_config c where c.tipo = p_tipo),
    'bloqueios', coalesce((
      select jsonb_agg(jsonb_build_object('data', b.data, 'horario', b.horario))
        from public.agenda_bloqueios b
       where (b.tipo is null or b.tipo = p_tipo) and b.data >= public.agora_loja()::date
    ), '[]'::jsonb),
    'ocupados', coalesce((
      select jsonb_agg(jsonb_build_object('data', p.data, 'horario', p.horario))
        from public.pedidos p
       where p.tipo = p_tipo and p.status = 'confirmado' and p.data >= public.agora_loja()::date
    ), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- motivo_horario_invalido — null se o horário pode ser pedido; senão o código
-- do erro. Mesma regra que o site usa para desenhar a agenda.
-- ---------------------------------------------------------------------------
create or replace function public.motivo_horario_invalido(p_tipo text, p_data date, p_horario text)
returns text
language plpgsql stable security definer set search_path = public
as $$
declare
  v_cfg    public.agenda_config;
  v_faixas jsonb;
  v_faixa  jsonb;
  v_min    int;
  v_ini    int;
  v_fim    int;
  v_ok     boolean := false;
begin
  if p_horario is null or p_horario !~ '^\d{2}:\d{2}$' then return 'horario_invalido'; end if;
  select * into v_cfg from public.agenda_config where tipo = p_tipo;
  if not found then return 'agenda_indisponivel'; end if;

  if p_data is null or p_data < public.agora_loja()::date or p_data > public.agora_loja()::date + 90 then
    return 'data_invalida';
  end if;

  -- dentro de uma faixa de atendimento, alinhado ao passo, terminando antes de fechar
  v_faixas := v_cfg.semana -> extract(dow from p_data)::int::text;
  v_min := public.hhmm_minutos(p_horario);
  if v_faixas is not null and jsonb_typeof(v_faixas) = 'array' then
    for v_faixa in select * from jsonb_array_elements(v_faixas) loop
      v_ini := public.hhmm_minutos(v_faixa->>0);
      v_fim := public.hhmm_minutos(v_faixa->>1);
      if v_min >= v_ini and v_min + v_cfg.slot_minutos <= v_fim
         and (v_min - v_ini) % v_cfg.slot_minutos = 0 then
        v_ok := true;
      end if;
    end loop;
  end if;
  if not v_ok then return 'horario_fora_da_agenda'; end if;

  if p_data + p_horario::time < public.agora_loja() + make_interval(mins => v_cfg.antecedencia_minutos) then
    return 'horario_em_cima_da_hora';
  end if;

  if exists (select 1 from public.agenda_bloqueios b
              where (b.tipo is null or b.tipo = p_tipo) and b.data = p_data
                and (b.horario is null or b.horario = p_horario)) then
    return 'horario_bloqueado';
  end if;

  if exists (select 1 from public.pedidos
              where tipo = p_tipo and data = p_data and horario = p_horario
                and status = 'confirmado') then
    return 'horario_ocupado';
  end if;

  return null;
end $$;

-- ---------------------------------------------------------------------------
-- criar_pedido — igual ao do 002, mas o agendamento passa pela grade acima
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

-- O site agora usa agenda_publica; a função antiga sai
drop function if exists public.horarios_ocupados(text);

revoke all on function public.agenda_publica(text) from public;
revoke all on function public.motivo_horario_invalido(text, date, text) from public;
revoke all on function public.criar_pedido(jsonb) from public;
grant execute on function public.agenda_publica(text) to anon, authenticated;
grant execute on function public.motivo_horario_invalido(text, date, text) to authenticated;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
