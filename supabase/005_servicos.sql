-- Mercadog · serviços de banho e tosa editáveis pelo painel
-- Rodar depois do 004: SQL Editor → New query → colar → Run. Idempotente.
--
-- Consulta veterinária não entra aqui: é uma só, genérica, e o valor é
-- definido na hora pelo veterinário.

create table if not exists public.servicos (
  id         text primary key,          -- slug: 'banho', 'banho-tosa'…
  nome       text not null,
  descricao  text,
  duracao    int  not null default 60 check (duracao between 5 and 600), -- minutos
  icon       text not null default 'Sparkles',
  -- preço por porte; null = "valor na hora" para aquele porte
  precos     jsonb not null default '{"pequeno": null, "medio": null, "grande": null}',
  ordem      int  not null default 0,
  ativo      boolean not null default true,  -- false = some do site, continua no painel
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists servicos_touch on public.servicos;
create trigger servicos_touch before update on public.servicos
  for each row execute function public.touch_updated_at();

alter table public.servicos enable row level security;

drop policy if exists "servicos leitura publica" on public.servicos;
create policy "servicos leitura publica" on public.servicos
  for select using (ativo or public.is_equipe());

drop policy if exists "servicos escrita equipe" on public.servicos;
create policy "servicos escrita equipe" on public.servicos
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

-- Valores de EXEMPLO que estavam em src/data/services.js — troque pelo painel.
-- (on conflict do nothing: rodar de novo não apaga o que a equipe editou)
insert into public.servicos (id, nome, descricao, duracao, icon, precos, ordem) values
  ('banho', 'Banho',
   'Banho completo com produtos hipoalergênicos, secagem, escovação e perfume suave.',
   60, 'Droplets', '{"pequeno": 55, "medio": 75, "grande": 95}', 1),
  ('tosa', 'Tosa',
   'Tosa higiênica ou completa, na máquina ou tesoura, com acabamento cuidadoso.',
   75, 'Scissors', '{"pequeno": 65, "medio": 85, "grande": 110}', 2),
  ('banho-tosa', 'Banho e Tosa',
   'Combo completo: banho, tosa, corte de unhas e limpeza de ouvidos. O dia de spa do seu pet.',
   120, 'Sparkles', '{"pequeno": 100, "medio": 135, "grande": 170}', 3)
on conflict (id) do nothing;
