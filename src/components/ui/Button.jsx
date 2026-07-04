import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const MotionLink = motion.create(Link)

/** Efeito magnético: o botão desliza alguns px em direção ao cursor. */
function useMagnetic(strength = 0.18, limit = 5) {
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spring = { stiffness: 300, damping: 18, mass: 0.5 }
  const x = useSpring(mx, spring)
  const y = useSpring(my, spring)

  const clamp = (v) => Math.max(-limit, Math.min(limit, v))

  const onMouseMove = (e) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set(clamp((e.clientX - rect.left - rect.width / 2) * strength))
    my.set(clamp((e.clientY - rect.top - rect.height / 2) * strength))
  }
  const onMouseLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return { handlers: { onMouseMove, onMouseLeave }, style: reduced ? {} : { x, y } }
}

const VARIANTS = {
  primary:
    'bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-warm',
  outline:
    'border-2 border-terracotta-500 text-terracotta-600 hover:bg-terracotta-50',
  ghost: 'text-terracotta-600 hover:bg-terracotta-50',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1fb457] shadow-warm',
}

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

const MOTION_PROPS = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 220, damping: 24, mass: 0.8 },
}

/**
 * Botão padrão com micro-interações.
 * Vira <Link> se receber `to`, <a> se receber `href`, senão <button>.
 * `loading` desabilita e mostra spinner (feedback de envio).
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const magnetic = useMagnetic()

  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
    'cursor-pointer select-none transition-colors duration-200',
    'disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ')

  const motionProps = { ...MOTION_PROPS, ...magnetic.handlers, style: magnetic.style }

  const content = (
    <>
      {loading && <Loader2 className="animate-spin" size={18} aria-hidden="true" />}
      {children}
    </>
  )

  if (to) {
    return (
      <MotionLink to={to} className={classes} {...motionProps} {...rest}>
        {content}
      </MotionLink>
    )
  }
  if (href) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...motionProps}
        {...rest}
      >
        {content}
      </motion.a>
    )
  }
  return (
    <motion.button
      type="button"
      className={classes}
      disabled={disabled || loading}
      {...motionProps}
      {...rest}
    >
      {content}
    </motion.button>
  )
}
