/** Rótulos, cores e mensagens de retorno dos pedidos no painel. */
import { formatPrice, toWhatsAppNumber } from '../utils/format'
import { buildWhatsAppUrl } from '../config/whatsapp'
import { SITE } from '../config/site'

export const TIPO_LABEL = {
  loja: 'Loja',
  banho_tosa: 'Banho e tosa',
  consulta: 'Consulta',
}

export const STATUS = {
  pendente: { label: 'Aguardando', className: 'bg-amber-100 text-amber-800' },
  confirmado: { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-800' },
  recusado: { label: 'Recusado', className: 'bg-red-100 text-red-700' },
  concluido: { label: 'Concluído', className: 'bg-sand text-clay' },
  cancelado: { label: 'Cancelado pelo cliente', className: 'bg-zinc-200 text-zinc-700' },
}

/** Link do cliente para acompanhar/cancelar (o painel roda no mesmo domínio do site). */
export const linkCliente = (p) => (p.codigo ? `${window.location.origin}/pedido/${p.codigo}` : null)

const DATA_FMT = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
const HORA_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** '2026-10-02' → 'sex., 02/10' — sem passar por UTC, que voltaria um dia. */
export const formatData = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return DATA_FMT.format(new Date(y, m - 1, d))
}

export const formatCriadoEm = (ts) => HORA_FMT.format(new Date(ts))

export { formatTelefone } from '../utils/format'

/** Uma linha que resume o pedido na lista. */
export const resumo = (p) => {
  if (p.tipo === 'loja') {
    const qtd = (p.itens ?? []).reduce((s, i) => s + i.quantidade, 0)
    return `${qtd} ${qtd === 1 ? 'item' : 'itens'} · ${formatPrice(p.total ?? 0)}${p.sob_consulta ? ' +' : ''}`
  }
  return `${p.servico} · ${formatData(p.data)} às ${p.horario}`
}

const DATA_LONGA_FMT = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })

/** '2026-10-02' → 'sexta-feira, 02/10' — para a mensagem ao cliente. */
const formatDataLonga = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return DATA_LONGA_FMT.format(new Date(y, m - 1, d))
}

/**
 * Mensagem pronta para a equipe mandar de volta ao cliente.
 * Só o que o cliente precisa para agir: o que foi confirmado, quando, onde e
 * como mudar. Número do pedido e CEP ficam de fora — são controle interno.
 * A equipe ainda pode editar o texto no WhatsApp antes de enviar.
 */
export function mensagemCliente(p, status) {
  const nome = p.cliente_nome.split(' ')[0]
  const oi = `Oi, ${nome}! Aqui é do Mercadog.`

  if (p.tipo === 'loja') {
    if (status !== 'confirmado') {
      return `${oi} Infelizmente não vamos conseguir atender o seu pedido agora. Quer que a gente veja outra opção para você?`
    }
    const semPreco = (p.itens ?? []).filter((i) => i.preco == null).map((i) => i.nome)
    return [
      `${oi} Seu pedido está confirmado!`,
      '',
      p.entrega === 'entrega'
        ? `Vamos entregar em: ${p.endereco}`
        : `Já pode retirar na loja: ${SITE.addressShort}`,
      `Valor: ${formatPrice(p.total ?? 0)}`,
      semPreco.length > 0 &&
        `Sem preço no site: ${semPreco.join(', ')}. Te passamos o valor antes de fechar.`,
      '',
      'Qualquer dúvida, é só responder aqui.',
      linkCliente(p) && `Caso queira cancelar, é só cancelar pelo link: ${linkCliente(p)}`,
    ]
      .filter((linha) => linha !== false && linha != null)
      .join('\n')
  }

  const quando = `${formatDataLonga(p.data)}, às ${p.horario}`
  if (status !== 'confirmado') {
    return `${oi} Infelizmente o horário de ${quando} não vai dar certo. Qual outro dia e horário fica bom para você?`
  }
  return [
    `${oi} Seu horário está confirmado!`,
    '',
    p.pet_nome ? `${p.pet_nome}: ${p.servico}` : p.servico,
    `Data: ${quando}`,
    `Endereço: ${SITE.addressShort}`,
    '',
    'Se precisar remarcar, é só responder aqui.',
    linkCliente(p) && `Caso queira cancelar (até 2 horas antes), é só cancelar pelo link: ${linkCliente(p)}`,
  ]
    .filter((linha) => linha != null)
    .join('\n')
}

export const whatsCliente = (p, message) =>
  buildWhatsAppUrl(toWhatsAppNumber(p.cliente_telefone), message)
