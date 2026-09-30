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

/** Junta as linhas da mensagem; `false`/`null` somem, '' vira linha em branco. */
const lista = (linhas) => linhas.filter((l) => l !== false && l != null).join('\n')

export const WHATSAPP_MESSAGES = {
  geral: 'Olá! Vim pelo site do Mercadog e gostaria de tirar uma dúvida.',

  produto: (nomeProduto) =>
    `Olá! Vi o produto "${nomeProduto}" no site do Mercadog e gostaria de saber mais.`,

  /* Pedidos gravados no site. Quem envia é o cliente, então tudo aqui ele
     lê: vai só o que a equipe precisa para achar e atender o pedido — o
     número leva ao pedido no painel (/admin), sem link nenhum na mensagem. */

  agendamento: ({ numero, servico, data, horario, pet }) =>
    lista([
      `Olá! Quero agendar pelo site (pedido nº ${numero}):`,
      '',
      pet ? `${pet}: ${servico}` : servico,
      `Data: ${data}, às ${horario}`,
      '',
      'Podem confirmar?',
    ]),

  consulta: ({ numero, data, horario, pet, porte, motivo }) =>
    lista([
      `Olá! Quero marcar uma consulta pelo site (pedido nº ${numero}):`,
      '',
      pet ? `Pet: ${pet}${porte ? ` (porte ${porte.toLowerCase()})` : ''}` : null,
      motivo?.trim() ? `Motivo: ${motivo.trim()}` : null,
      `Data: ${data}, às ${horario}`,
      '',
      'Podem confirmar?',
    ]),

  pedidoLoja: ({ numero, itens, total, sobConsulta, entrega, endereco }) =>
    lista([
      `Olá! Fiz um pedido pelo site (nº ${numero}):`,
      '',
      ...itens.map(
        (i) =>
          `${i.quantidade}x ${i.nome}${i.detalhes ? ` (${i.detalhes})` : ''}${i.exige_receita ? ' - exige receita' : ''}`,
      ),
      '',
      `Total: ${total}${sobConsulta ? ' + itens sob consulta' : ''}`,
      entrega === 'entrega' ? `Entregar em: ${endereco}` : 'Vou retirar na loja',
      itens.some((i) => i.exige_receita) ? 'Vou enviar a foto da receita aqui.' : null,
      '',
      'Podem confirmar?',
    ]),

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
