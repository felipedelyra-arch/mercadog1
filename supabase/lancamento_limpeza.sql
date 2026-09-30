-- Mercadog · limpeza antes de abrir o site ao público
-- Rodar UMA vez, no dia do lançamento: SQL Editor → New query → colar → Run.
-- NÃO é migração: não rode de novo depois que o site estiver no ar.

-- 1) CONFIRA antes o que será apagado (rode só este bloco primeiro, se quiser):
-- select numero, tipo, status, cliente_nome, created_at from public.pedidos order by numero;
-- select data, horario, tipo, motivo from public.agenda_bloqueios order by data, horario;

begin;

-- 2) Pedidos de teste (todos criados com nome começando por "TESTE")
delete from public.pedidos where cliente_nome ilike 'teste%';

-- 3) Bloqueios de horário e dias fechados criados durante os testes.
--    Apaga TODOS. Se já tiver cadastrado feriados de verdade, comente a linha
--    abaixo e apague os de teste pela tela Agenda do painel.
delete from public.agenda_bloqueios;

-- 4) Numeração: se não sobrou nenhum pedido, o primeiro pedido real vira o nº 1
do $$
begin
  if not exists (select 1 from public.pedidos) then
    alter table public.pedidos alter column numero restart with 1;
  end if;
end $$;

commit;

-- 5) Confira: deve mostrar 0 e 0 (ou só o que você quis manter)
select
  (select count(*) from public.pedidos)          as pedidos,
  (select count(*) from public.agenda_bloqueios) as bloqueios;
