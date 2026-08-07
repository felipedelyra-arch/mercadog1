import { PawPrint } from 'lucide-react'

const ITEMS = [
  'Banho',
  'Tosa',
  'Consultas',
  'Vacinas',
  'Cirurgias',
  'Ortopedia especializada',
  'Ração premium',
  'Clínica 24h',
]

/**
 * Faixa em loop contínuo com os serviços da casa (animação CSS em index.css).
 * Conteúdo duplicado para o loop ser perfeito; a cópia fica aria-hidden.
 */
export default function Marquee() {
  const strip = (hidden) => (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-7 pr-7 sm:gap-10 sm:pr-10"
    >
      {ITEMS.map((item) => (
        <span
          key={item}
          className="flex items-center gap-7 font-display text-sm font-semibold whitespace-nowrap text-terracotta-600 sm:gap-10 sm:text-lg"
        >
          {item}
          <PawPrint size={14} className="text-terracotta-300" aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="marquee fade-edges-x border-y border-sand bg-cream py-3 sm:py-4">
      <div className="marquee-track">
        {strip(false)}
        {strip(true)}
      </div>
    </div>
  )
}
