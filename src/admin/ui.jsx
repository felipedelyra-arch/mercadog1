/** Peças pequenas compartilhadas pelas telas do painel. */

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
