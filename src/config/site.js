/** Informações institucionais exibidas no header, footer e página de contato. */
export const SITE = {
  name: 'Mercadog',
  tagline: 'Seu pet em boas mãos, 24h por dia',
  description:
    'Consultas, vacinas, cirurgias, loja, banho e ortopedia veterinária especializada.',
  address: 'R. Caingangs, 223 · Centro · Tupã/SP · 17600-070',
  /** Endereço curto para mensagens de WhatsApp, sem CEP */
  addressShort: 'R. Caingangs, 223, Centro',
  /** Número principal do Mercadog (fixo) */
  phone: '(14) 3491-1244',
  /** WhatsApp exclusivo do banho e tosa */
  phoneBanhoTosa: '(14) 99629-6210',
  email: 'contato@mercadog.com.br',
  hours: [{ label: 'Todos os dias', value: 'Atendimento 24 horas' }],
  instagram: 'https://instagram.com/mercadogpetshop',
  facebook: 'https://facebook.com/mercadogpetshop',
  linktree: 'https://linktr.ee/mercadogpetshop',
  /**
   * Perfil no Google. `nota` e `total` ficam null até a equipe preencher em
   * Ajustes (o número vem do painel do Google Meu Negócio) — o site nunca
   * mostra nota que não foi informada.
   */
  google: {
    link: 'https://www.google.com/maps/search/?api=1&query=Mercadog+Cl%C3%ADnica+Veterin%C3%A1ria+e+Pet+Shop+Tup%C3%A3',
    nota: null,
    total: null,
  },
}
