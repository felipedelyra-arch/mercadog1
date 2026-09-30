-- Mercadog · cadastrar quem usa o painel (/admin)
--
-- 1. Supabase → Authentication → Users → "Add user" → "Create new user"
--    Preencha e-mail e senha e marque "Auto Confirm User". Faça isso para cada pessoa.
-- 2. Troque os e-mails abaixo pelos que você acabou de criar e rode no SQL Editor.
--
-- Criar o usuário no Authentication não dá acesso sozinho: só quem também
-- está na tabela `equipe` entra no painel.

insert into public.equipe (user_id, nome, papel)
select id, 'Dr. Wilson', 'dono' from auth.users where email = 'EMAIL-DO-DOUTOR@exemplo.com'
on conflict (user_id) do update set nome = excluded.nome, papel = excluded.papel;

insert into public.equipe (user_id, nome, papel)
select id, 'NOME DA ESPOSA', 'atendimento' from auth.users where email = 'EMAIL-DA-ESPOSA@exemplo.com'
on conflict (user_id) do update set nome = excluded.nome, papel = excluded.papel;

-- Conferir quem tem acesso:
select e.nome, e.papel, u.email from public.equipe e join auth.users u on u.id = e.user_id;

-- Tirar o acesso de alguém (a conta continua existindo, só perde o painel):
-- delete from public.equipe where user_id = (select id from auth.users where email = '...');
