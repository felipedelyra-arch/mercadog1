import { motion } from 'framer-motion'
import { fadeUp, viewportProps } from '../../animations/variants'

/**
 * Cabeçalho de seção: eyebrow em terracota + título display + subtítulo.
 * Anima ao entrar na viewport.
 */
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left items-start' : 'text-center items-center'
  return (
    <motion.div
      variants={fadeUp}
      {...viewportProps}
      className={`flex flex-col gap-3 ${alignment}`}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-terracotta-200/70 bg-terracotta-50 px-3 py-1 text-[0.6875rem] font-bold tracking-[0.14em] text-terracotta-600 uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-terracotta-400" />
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-2xl font-display text-display-md font-semibold text-ink">{title}</h2>
      {subtitle && (
        <p className="max-w-xl text-sm leading-relaxed text-clay sm:text-base">{subtitle}</p>
      )}
    </motion.div>
  )
}
