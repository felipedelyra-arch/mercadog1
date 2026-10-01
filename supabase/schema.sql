-- Mercadog · schema do catálogo da loja
-- Rodar uma vez no Supabase: Dashboard → SQL Editor → New query → colar → Run.
-- É idempotente: pode rodar de novo sem quebrar nada.

-- ---------------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------------
create table if not exists public.categorias (
  id     text primary key,                 -- slug usado na URL: /loja?categoria=antibioticos
  label  text not null,                    -- nome exibido no filtro e no card
  icon   text not null default 'PawPrint', -- nome do ícone do lucide (src/components/ui/icons.js)
  ordem  int  not null default 0           -- ordem dos filtros na loja
);

-- ---------------------------------------------------------------------------
-- Produtos
-- ---------------------------------------------------------------------------
create table if not exists public.produtos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  detalhes    text,                                   -- apresentação: "c/ 10 comp", "30 ml"…
  categoria   text not null references public.categorias (id) on update cascade,
  preco       numeric(10, 2) check (preco is null or preco >= 0), -- null = "sob consulta"
  destaque    boolean not null default false,         -- selo "Popular" e vitrine da Home
  disponivel  boolean not null default true,          -- false = "Sem estoque"
  image       text,                                   -- caminho no bucket "produtos" ou URL externa
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists produtos_categoria_idx on public.produtos (categoria);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists produtos_touch on public.produtos;
create trigger produtos_touch before update on public.produtos
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Segurança (RLS)
-- Qualquer visitante lê o catálogo; só usuário logado (equipe da loja) escreve.
-- Usuários são criados à mão em Authentication → Users — o site não tem cadastro.
-- ---------------------------------------------------------------------------
alter table public.categorias enable row level security;
alter table public.produtos   enable row level security;

drop policy if exists "categorias leitura publica" on public.categorias;
create policy "categorias leitura publica" on public.categorias
  for select using (true);


drop policy if exists "produtos leitura publica" on public.produtos;
create policy "produtos leitura publica" on public.produtos
  for select using (true);

-- Escrita: provisória (qualquer logado) só na primeira instalação; o 002
-- troca por "só a equipe". Se já existe, não mexe — rodar este arquivo de
-- novo não pode afrouxar a regra do 002.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categorias'
                   and policyname = 'categorias escrita equipe') then
    create policy "categorias escrita equipe" on public.categorias
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'produtos'
                   and policyname = 'produtos escrita equipe') then
    create policy "produtos escrita equipe" on public.produtos
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Fotos: bucket público "produtos"
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos leitura publica" on storage.objects;
create policy "fotos leitura publica" on storage.objects
  for select using (bucket_id = 'produtos');

-- mesma ideia: não sobrescreve a regra "só a equipe" criada no 002
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                   and policyname = 'fotos escrita equipe') then
    create policy "fotos escrita equipe" on storage.objects
      for all to authenticated
      using (bucket_id = 'produtos') with check (bucket_id = 'produtos');
  end if;
end $$;
