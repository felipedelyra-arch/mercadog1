import { motion } from 'framer-motion'
import { fadeUp, viewportProps } from '../../animations/variants'

/**
 * Cabeçalho de seção: eyebrow em terracota + título display + subtítulo.
 * Anima ao entrar na viewport.
 */
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left items-start' : 'text-center items-center'
  return (
    <motion.div variants={fadeUp} {...viewportProps} className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow && (
        <span className="rounded-full bg-terracotta-100 px-3 py-1 text-xs font-bold tracking-widest text-terracotta-600 uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="max-w-xl text-clay">{subtitle}</p>}
    </motion.div>
  )
}
