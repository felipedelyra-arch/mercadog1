import { motion } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import { fadeUp, SPRING_SNAP } from '../animations/variants'
import { useTilt } from '../hooks/useTilt'
import { formatDuration, formatPrice } from '../utils/format'
import { getIcon } from './ui/icons'

/**
 * Card de serviço/consulta com tilt 3D e spotlight que seguem o cursor.
 * `price` pode ser número (preço fixo), { from: n } para "a partir de"
 * ou null/undefined para "Sob consulta".
 * Com `onSelect` vira um card selecionável (usado nos fluxos de agendamento).
 */
export default function ServiceCard({ item, price, selected = false, onSelect }) {
  const Icon = getIcon(item.icon)
  const interactive = Boolean(onSelect)
  const tilt = useTilt()

  const Tagname = interactive ? motion.button : motion.div

  return (
    <Tagname
      variants={fadeUp}
      {...tilt.handlers}
      style={tilt.style}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={SPRING_SNAP}
      type={interactive ? 'button' : undefined}
      onClick={interactive ? () => onSelect(item) : undefined}
      aria-pressed={interactive ? selected : undefined}
      className={`group relative flex h-full flex-col gap-3 overflow-hidden rounded-card border-2 bg-white p-6 text-left shadow-warm transition-colors ${
        selected
          ? 'border-terracotta-500'
          : 'border-transparent hover:border-terracotta-200'
      } ${interactive ? 'cursor-pointer' : ''}`}
    >
      {/* Spotlight quente seguindo o cursor */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: tilt.spotlight }}
      />

      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="absolute top-4 right-4 grid size-7 place-items-center rounded-full bg-terracotta-500 text-white"
        >
          <Check size={16} aria-hidden="true" />
        </motion.span>
      )}

      <span className="grid size-12 place-items-center rounded-arch bg-terracotta-100 text-terracotta-600 transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-108 motion-reduce:transition-none">
        <Icon size={24} aria-hidden="true" />
      </span>

      <h3 className="font-display text-xl font-semibold text-ink">{item.nome}</h3>
      <p className="flex-1 text-sm leading-relaxed text-clay">{item.descricao}</p>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-display text-lg font-semibold text-terracotta-600">
          {typeof price === 'number' ? (
            formatPrice(price)
          ) : price?.from != null ? (
            <>
              <span className="text-xs font-sans font-normal text-clay">a partir de </span>
              {formatPrice(price.from)}
            </>
          ) : (
            /* Sem valor de tabela: depende da avaliação do veterinário */
            <span className="text-base">Sob consulta</span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-clay">
          <Clock size={13} aria-hidden="true" />
          {formatDuration(item.duracao)}
        </span>
      </div>
    </Tagname>
  )
}
