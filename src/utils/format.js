/** Formatação compartilhada. */
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatPrice = (value) => BRL.format(value)

/**
 * Telefone digitado pelo tutor → formato internacional do wa.me.
 * Aceita "(14) 99629-6210" e devolve "5514996296210".
 */
export const toWhatsAppNumber = (telefone) => {
  const digits = String(telefone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

export const formatDuration = (minutes) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ''}`
    : `${minutes}min`
