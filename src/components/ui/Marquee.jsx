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
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {ITEMS.map((item) => (
        <span
          key={item}
          className="flex items-center gap-10 font-display text-lg font-semibold whitespace-nowrap text-terracotta-600"
        >
          {item}
          <PawPrint size={16} className="text-terracotta-300" aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="marquee border-y border-sand bg-cream py-4">
      <div className="marquee-track">
        {strip(false)}
        {strip(true)}
      </div>
    </div>
  )
}
