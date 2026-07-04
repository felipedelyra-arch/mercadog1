/**
 * Configuração central de WhatsApp.
 * Troque os números aqui quando os oficiais estiverem definidos —
 * nenhum componente guarda número ou mensagem hardcoded.
 */
export const WHATSAPP_NUMBERS = {
  /** Atendentes: dúvidas gerais, produtos, agendamento */
  atendimento: '5514997377299',
  /** Médicos veterinários: consultas e urgências (mesmo número por enquanto) */
  veterinario: '5514997377299',
}

export const WHATSAPP_MESSAGES = {
  geral: 'Olá! Vim pelo site do Mercadog e gostaria de tirar uma dúvida. 🐾',

  produto: (nomeProduto) =>
    `Olá! Vi o produto "${nomeProduto}" no site do Mercadog e gostaria de saber mais.`,

  agendamento: ({ servico, data, horario, pet }) =>
    `Olá! Acabei de agendar pelo site do Mercadog:\n` +
    `• Serviço: ${servico}\n` +
    `• Data: ${data} às ${horario}\n` +
    (pet ? `• Pet: ${pet}\n` : '') +
    `Podem confirmar, por favor?`,

  consulta: ({ tipo, data, horario, pet }) =>
    `Olá! Gostaria de confirmar uma consulta veterinária:\n` +
    `• Tipo: ${tipo}\n` +
    (data ? `• Data: ${data} às ${horario}\n` : '') +
    (pet ? `• Pet: ${pet}\n` : '') +
    `Aguardo retorno!`,

  veterinarioDireto:
    'Olá! Gostaria de falar com um veterinário do Mercadog sobre o meu pet.',

  clinica24h:
    'Olá, Dr. Wilson! Preciso de atendimento na clínica 24h do Mercadog para o meu pet.',

  atendimentoLoja:
    'Olá! Vim pelo site do Mercadog e gostaria de um atendimento da loja.',
}

/**
 * Monta a URL do WhatsApp com mensagem pré-preenchida.
 * @param {string} number - número no formato internacional, só dígitos
 * @param {string} message - mensagem já pronta (sem encode)
 */
export function buildWhatsAppUrl(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
