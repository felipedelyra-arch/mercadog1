# Mercadog — Frontend

Plataforma web do petshop Mercadog: agendamento de banho/tosa, consultas veterinárias e loja de produtos. A loja lê produtos e categorias do Supabase; serviços, consultas e agenda ainda são mockados em `src/data/`.

## Rodar

```bash
npm install
cp .env.example .env.local   # preencha URL e chave anon do Supabase
npm run dev     # http://localhost:5173
npm run build   # build de produção
```

## Stack

React + Vite · Tailwind CSS v4 (tokens em `src/index.css` via `@theme`) · Framer Motion · React Router · lucide-react.

## Estrutura

```
src/
  animations/   variantes reutilizáveis do Framer Motion
  components/   layout/ (Header, Footer...), ui/ (Button, Skeleton...), booking/ (fluxo de agendamento)
  pages/        Home, Agendamento, Consultas, Loja, NotFound
  admin/        painel da equipe (/admin)
  context/      carrinho
  data/         mocks (serviços, consultas, agenda) e helpers da loja
  lib/          cliente do Supabase
  services/     api.js — camada de dados assíncrona
  config/       whatsapp.js (números/mensagens), site.js (endereço, horários)
  hooks/        useFetch
```

## Backend (Supabase)

- `supabase/schema.sql` cria as tabelas `categorias` e `produtos`, as regras de acesso (RLS: leitura pública, escrita só para usuário logado) e o bucket público `produtos` para as fotos. Rode uma vez no SQL Editor do Supabase.
- `scripts/gerar-seed.mjs` transforma a planilha CSV em `supabase/seed.sql` (carga inicial — apaga e recria os produtos):
  `node scripts/gerar-seed.mjs tabela_produtos_veterinarios.csv`
- `supabase/002_equipe_pedidos.sql` cria a equipe (quem entra no painel) e os pedidos. Carrinho e agendamento gravam um pedido "pendente" pela função `criar_pedido` (o preço dos produtos é relido no banco) e abrem o WhatsApp com um link `/admin/pedidos/<id>` para a equipe confirmar.
- `supabase/003_cadastrar_equipe.sql` — passo a passo para dar acesso ao painel a uma pessoa.
- `supabase/004_agenda.sql` — horário de funcionamento, bloqueios e dias fechados, editados na aba Agenda do painel e validados no `criar_pedido`.
- `supabase/005_servicos.sql` — serviços de banho e tosa (preço por porte, duração), editados na aba Serviços. A consulta veterinária é uma só, genérica (`src/data/consultas.js`), com valor definido no atendimento.
- `supabase/006_agenda_unica.sql` — uma grade de horários para banho/tosa e consultas; cada um com a sua ocupação.
- `supabase/007_site_config.sql` — dados da loja (endereço, telefones, WhatsApp de cada setor, redes sociais) e equipe veterinária, editados na aba Ajustes. O site lê na abertura (`src/config/siteConfig.js`, com cópia no navegador); `src/config/site.js` e `whatsapp.js` ficam como reserva.
- `supabase/008_receita.sql` — marcação "exige receita" nos produtos (painel → Produtos); aparece no card, no carrinho, na mensagem e no pedido.
- `supabase/009_seguranca.sql` — freios contra spam no `criar_pedido` (por telefone, por IP e teto geral por hora; tamanho máximo do pedido) e bucket de fotos só com imagem até 5 MB.
- `supabase/010_cancelamento.sql` — cada pedido ganha um código secreto; pelo link `/pedido/<código>` o cliente acompanha e cancela (agendamento confirmado só até 2h antes). O painel avisa na hora quando alguém cancela.
- `supabase/lancamento_limpeza.sql` — rodar uma vez no dia do lançamento: apaga pedidos "TESTE…" e bloqueios de teste e recomeça a numeração.

## Publicação

- Na Vercel: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Settings → Environment Variables.
- Endereço do site (`https://mercadog-drab.vercel.app`) está em `index.html` (canonical, prévia de compartilhamento, dados da empresa), `public/robots.txt` e `public/sitemap.xml` — troque nos três ao ligar um domínio próprio.
- Política de privacidade em `/privacidade` (`src/pages/Privacidade.jsx`), com link no rodapé e nos formulários.
- Em Authentication → Sign In / Providers, desligue "Allow new users to sign up": as contas da equipe são criadas à mão.
- `src/services/api.js` é a única porta de dados das páginas; `src/lib/supabase.js` guarda o cliente.

## Painel da equipe (`/admin`)

- **Início** — pedidos aguardando (confirmar/recusar ali mesmo), agenda de hoje, produtos sem estoque; aviso com som e notificação quando chega pedido.
- **Pedidos** — aguardando / confirmados / todos, busca por número ou nome, ações rápidas, resposta ao cliente pronta no WhatsApp.
- **Agenda** — dia a dia com banho e tosa e consulta lado a lado, próximos agendamentos, horários de funcionamento, dias fechados.
- **Serviços** — banho e tosa: preço por porte, duração, ordem, mostrar/esconder.
- **Produtos** — preço editável na linha, estoque, destaque, foto e categorias.
- **Relatórios** — pedidos por dia, atendidos, vendas estimadas, mais pedidos.
- **Ajustes** — dados da loja, equipe veterinária, avisos do aparelho, quem acessa.

Toda ação mostra um aviso com "Desfazer". Código em `src/admin/`, carregado só quando alguém abre `/admin`.

## Acessibilidade

`prefers-reduced-motion` respeitado globalmente (`MotionConfig reducedMotion="user"`), foco visível, aria-labels, skip link, navegação por teclado.
