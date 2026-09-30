import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const MotionLink = motion.create(Link)

const VARIANTS = {
  primary:
    'bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-warm',
  outline:
    'border border-terracotta-500 text-terracotta-600 hover:bg-terracotta-50 hover:border-terracotta-600',
  ghost: 'text-terracotta-600 hover:bg-terracotta-50',
  /* Verde escuro (não o #25D366 da marca): com texto branco o verde claro
     fica em 2:1 de contraste e reprova em qualquer teste de leitura. */
  whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp-dark shadow-warm',
}

/* Todos os tamanhos respeitam a área mínima de toque de 44px no celular. */
const SIZES = {
  sm: 'min-h-11 px-4 py-2 text-sm',
  md: 'min-h-12 px-6 py-3 text-[0.9375rem]',
  lg: 'min-h-13 px-6 py-3.5 text-base sm:px-8 sm:py-4 sm:text-lg',
}

// só um retorno de toque; nada de crescer ou "puxar" com o mouse
const MOTION_PROPS = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 30 },
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
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
    'text-center leading-tight tracking-[0.005em]',
    'cursor-pointer select-none transition-colors duration-200',
    'disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ')

  const motionProps = MOTION_PROPS

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
