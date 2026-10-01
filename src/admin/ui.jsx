/** Peças pequenas compartilhadas pelas telas do painel. */
import { Store, Truck } from 'lucide-react'

/**
 * Selo Entrega/Retirada dos pedidos da loja. Cores próprias (azul e roxo),
 * diferentes das de status, para bater o olho e saber se sai de moto ou fica
 * no balcão. Agendamento não tem selo.
 */
export function EntregaTag({ pedido, grande = false }) {
  if (pedido.tipo !== 'loja' || !pedido.entrega) return null
  const entrega = pedido.entrega === 'entrega'
  const Icon = entrega ? Truck : Store
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap ${
        entrega ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'
      } ${grande ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-[11px]'}`}
    >
      <Icon size={grande ? 16 : 13} aria-hidden="true" />
      {entrega ? 'Entrega' : 'Retirada'}
    </span>
  )
}

/** Botão liga/desliga em forma de etiqueta (estoque, destaque, ativo…). */
export function Chip({ ativo, onClick, on, off, discreto = false }) {
  const cor = ativo
    ? discreto
      ? 'bg-amber-100 text-amber-800'
      : 'bg-emerald-100 text-emerald-800'
    : discreto
      ? 'bg-white text-clay border border-sand'
      : 'bg-red-100 text-red-700'
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`min-h-9 rounded-full px-2.5 text-xs font-bold whitespace-nowrap transition-colors sm:min-h-8 sm:px-3 ${cor}`}
    >
      {ativo ? on : off}
    </button>
  )
}
