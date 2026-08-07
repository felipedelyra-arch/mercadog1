/**
 * Configuração central de WhatsApp.
 * Troque os números aqui quando os oficiais estiverem definidos —
 * nenhum componente guarda número ou mensagem hardcoded.
 */
export const WHATSAPP_NUMBERS = {
  /** Atendentes: dúvidas gerais, produtos, loja — (14) 99629-6210 */
  atendimento: '5514996296210',
  /** Médicos veterinários: consultas e urgências (mesmo número por enquanto) */
  veterinario: '5514997377299',
  /** Banho e tosa: agendamentos do spa */
  banhoTosa: '5514996296210',
}

/**
 * Bloco final das mensagens de agendamento: é por este link que a equipe
 * confirma o horário (a página pede o PIN da clínica, então o tutor não
 * confirma o próprio pedido).
 */
const confirmLine = (link) =>
  link ? `\n\n— Equipe Mercadog, confirmar ou remarcar aqui:\n${link}` : ''

export const WHATSAPP_MESSAGES = {
  geral: 'Olá! Vim pelo site do Mercadog e gostaria de tirar uma dúvida.',

  produto: (nomeProduto) =>
    `Olá! Vi o produto "${nomeProduto}" no site do Mercadog e gostaria de saber mais.`,

  agendamento: ({ servico, data, horario, pet, protocolo, link }) =>
    `Olá! Acabei de pedir um horário pelo site do Mercadog:\n` +
    `• Serviço: ${servico}\n` +
    `• Data: ${data} às ${horario}\n` +
    (pet ? `• Pet: ${pet}\n` : '') +
    (protocolo ? `• Protocolo: ${protocolo}\n` : '') +
    `Podem confirmar, por favor?` +
    confirmLine(link),

  consulta: ({ tipo, data, horario, pet, porte, protocolo, link }) =>
    `Olá! Gostaria de marcar uma consulta veterinária:\n` +
    `• Tipo: ${tipo}\n` +
    (data ? `• Data: ${data} às ${horario}\n` : '') +
    (pet ? `• Pet: ${pet}\n` : '') +
    (porte ? `• Porte: ${porte}\n` : '') +
    (protocolo ? `• Protocolo: ${protocolo}\n` : '') +
    `Aguardo retorno!` +
    confirmLine(link),

  veterinarioDireto:
    'Olá! Gostaria de falar com um veterinário do Mercadog sobre o meu pet.',

  clinica24h:
    'Olá, Dr. Wilson! Preciso de atendimento na clínica 24h do Mercadog para o meu pet.',

  atendimentoLoja:
    'Olá! Vim pelo site do Mercadog e gostaria de um atendimento da loja.',

  banhoTosa:
    'Olá! Vim pelo site do Mercadog e gostaria de agendar banho e tosa para o meu pet.',
}

/**
 * Monta a URL do WhatsApp com mensagem pré-preenchida.
 * @param {string} number - número no formato internacional, só dígitos
 * @param {string} message - mensagem já pronta (sem encode)
 */
export function buildWhatsAppUrl(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
