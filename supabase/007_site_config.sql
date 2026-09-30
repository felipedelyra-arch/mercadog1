-- Mercadog · dados da loja e equipe veterinária editáveis pelo painel
-- Rodar depois do 006: SQL Editor → New query → colar → Run. Idempotente.

-- ===========================================================================
-- Dados da loja (uma linha só): endereço, telefones, WhatsApp, redes sociais
-- ===========================================================================
create table if not exists public.site_config (
  id         int primary key default 1 check (id = 1),
  dados      jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_config_touch on public.site_config;
create trigger site_config_touch before update on public.site_config
  for each row execute function public.touch_updated_at();

alter table public.site_config enable row level security;

drop policy if exists "site config leitura publica" on public.site_config;
create policy "site config leitura publica" on public.site_config
  for select using (true);

drop policy if exists "site config escrita equipe" on public.site_config;
create policy "site config escrita equipe" on public.site_config
  for update to authenticated using (public.is_equipe()) with check (public.is_equipe());

-- Valores que estavam em src/config/site.js e src/config/whatsapp.js
insert into public.site_config (id, dados) values (1, '{
  "tagline": "Seu pet em boas mãos, 24h por dia",
  "address": "R. Caingangs, 223 · Centro · Tupã/SP · 17600-070",
  "addressShort": "R. Caingangs, 223, Centro",
  "phone": "(14) 3491-1244",
  "email": "Wilsonguiari@hotmail.com",
  "hours": [{"label": "Todos os dias", "value": "Atendimento 24 horas"}],
  "instagram": "https://instagram.com/mercadogpetshop",
  "facebook": "https://facebook.com/mercadogpetshop",
  "linktree": "https://linktr.ee/mercadogpetshop",
  "whatsapp": {
    "atendimento": "5514996296210",
    "veterinario": "5514997377299",
    "banhoTosa": "5514996296210"
  }
}')
on conflict (id) do nothing;

-- ===========================================================================
-- Equipe veterinária (página de consultas)
-- ===========================================================================
create table if not exists public.veterinarios (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  crmv          text,
  especialidade text,
  ordem         int not null default 0,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.veterinarios enable row level security;

drop policy if exists "veterinarios leitura publica" on public.veterinarios;
create policy "veterinarios leitura publica" on public.veterinarios
  for select using (ativo or public.is_equipe());

drop policy if exists "veterinarios escrita equipe" on public.veterinarios;
create policy "veterinarios escrita equipe" on public.veterinarios
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

insert into public.veterinarios (nome, crmv, especialidade, ordem)
select 'Dr. Wilson', 'CRMV-SP', 'Clínica 24h · Ortopedia veterinária especializada', 1
where not exists (select 1 from public.veterinarios);
