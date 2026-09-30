/** Formatação compartilhada. */
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatPrice = (value) => BRL.format(value)

/** "39,50" / "39.50" / "R$ 1.234,50" → número; vazio → null (sob consulta). */
export const parsePreco = (text) => {
  const clean = text.replace(/[R$\s]/g, '')
  if (!clean) return null
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN
}

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

/** "5514996296210" ou "14996296210" → "(14) 99629-6210". */
export const formatTelefone = (digits) => {
  const d = String(digits ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return String(digits ?? '')
}
