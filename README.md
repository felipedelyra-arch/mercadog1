# Mercadog — Frontend

Plataforma web do petshop Mercadog: agendamento de banho/tosa, consultas veterinárias e loja de produtos. Frontend puro nesta fase — todos os dados são mockados.

## Rodar

```bash
npm install
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
  data/         mocks (serviços, consultas, produtos, agenda)
  services/     api.js — camada de dados assíncrona
  config/       whatsapp.js (números/mensagens), site.js (endereço, horários)
  hooks/        useFetch
```

## Preparado para o backend (Python)

- `src/services/api.js` é a única porta de dados das páginas. Troque o corpo de cada função por `fetch` na API — assinaturas já prontas, nenhuma página muda.
- Números e mensagens de WhatsApp centralizados em `src/config/whatsapp.js`.
- Ícones de produto referenciados por nome (string) em `src/components/ui/icons.js`, como a API devolverá.
- Logo: coloque o arquivo oficial em `public/logo.svg` e ajuste `src/components/ui/Logo.jsx` (instrução no comentário).

## Acessibilidade

`prefers-reduced-motion` respeitado globalmente (`MotionConfig reducedMotion="user"`), foco visível, aria-labels, skip link, navegação por teclado.
