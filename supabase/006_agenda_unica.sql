-- Mercadog · uma grade de horários para banho/tosa e consultas
-- Rodar depois do 005: SQL Editor → New query → colar → Run. Idempotente.
--
-- Banho e tosa (atendentes) e consulta (veterinário) usam os MESMOS horários,
-- mas cada um tem a sua ocupação: uma consulta às 09:00 não tira o banho das
-- 09:00. Dias fechados e bloqueios podem valer para os dois ou só para um.

alter table public.agenda_config drop constraint if exists agenda_config_tipo_check;

-- Grade única a partir da do banho e tosa, em passos de 30 min
insert into public.agenda_config (tipo, slot_minutos, antecedencia_minutos, dias_exibidos, semana)
select 'geral', 30, antecedencia_minutos, dias_exibidos, semana
  from public.agenda_config where tipo = 'banho_tosa'
on conflict (tipo) do nothing;

-- Se nem a do banho existia (banco novo), cria a padrão
insert into public.agenda_config (tipo, slot_minutos, antecedencia_minutos, dias_exibidos, semana) values
  ('geral', 30, 90, 10, '{
     "0": null,
     "1": [["08:00","12:00"],["13:30","18:00"]],
     "2": [["08:00","12:00"],["13:30","18:00"]],
     "3": [["08:00","12:00"],["13:30","18:00"]],
     "4": [["08:00","12:00"],["13:30","18:00"]],
     "5": [["08:00","12:00"],["13:30","18:00"]],
     "6": [["08:00","12:00"]]
   }')
on conflict (tipo) do nothing;

delete from public.agenda_config where tipo <> 'geral';
alter table public.agenda_config add constraint agenda_config_tipo_check check (tipo = 'geral');

-- ---------------------------------------------------------------------------
-- agenda_publica(tipo) — grade única; ocupados e bloqueios do tipo pedido
-- ---------------------------------------------------------------------------
create or replace function public.agenda_publica(p_tipo text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'agora', to_char(public.agora_loja(), 'YYYY-MM-DD"T"HH24:MI'),
    'config', (select to_jsonb(c) - 'updated_at' from public.agenda_config c where c.tipo = 'geral'),
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
-- motivo_horario_invalido — mesma regra do 004, lendo a grade única
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
  if coalesce(p_tipo, '') not in ('banho_tosa', 'consulta') then return 'tipo_invalido'; end if;
  if p_horario is null or p_horario !~ '^\d{2}:\d{2}$' then return 'horario_invalido'; end if;
  select * into v_cfg from public.agenda_config where tipo = 'geral';
  if not found then return 'agenda_indisponivel'; end if;

  if p_data is null or p_data < public.agora_loja()::date or p_data > public.agora_loja()::date + 90 then
    return 'data_invalida';
  end if;

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
