/**
 * Variantes compartilhadas do Framer Motion.
 * Todas as páginas/cards usam estas — não crie variantes locais duplicadas.
 * O respeito a prefers-reduced-motion é global via <MotionConfig reducedMotion="user"> no App.
 *
 * Filosofia: springs (física) no lugar de durações fixas — o movimento
 * desacelera naturalmente e nunca "corta" no fim.
 */

/** Easing padrão para o que ainda usa duração (saídas e máscaras). */
export const EASE = [0.22, 1, 0.36, 1]

/** Spring padrão de entrada: suave, desacelera sem quicar. */
const SPRING_IN = { type: 'spring', stiffness: 130, damping: 22, mass: 0.9 }

/**
 * Spring de interação (hover/tap): macio de propósito.
 * Stiffness baixo = o card DESLIZA até a posição em vez de pular —
 * a resposta começa devagar e acompanha o cursor.
 */
export const SPRING_SNAP = { type: 'spring', stiffness: 160, damping: 26, mass: 0.8 }

/**
 * Entrada de elemento: sobe suave com leve escala.
 * Sem animação de filter/blur aqui de propósito: blur + transform 3D no mesmo
 * elemento força repaint a cada frame e faz o texto tremer (jank).
 */
export const fadeUp = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_IN,
  },
}

/** Container que orquestra filhos em cascata (use com filhos em `fadeUp`). */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08, when: 'beforeChildren' },
  },
}

/** Transição entre páginas (usada pelo PageWrapper com AnimatePresence). */
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.22, ease: EASE },
  },
}

/** Aparição com escala, para modais e feedbacks. */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_IN,
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.18, ease: EASE } },
}

/**
 * Props de hover/tap para cards — espalhe no motion.div:
 * <motion.div {...cardHoverProps}>
 */
export const cardHoverProps = {
  whileHover: { y: -4, scale: 1.01 },
  whileTap: { scale: 0.985 },
  transition: SPRING_SNAP,
}

/** Props padrão para revelar seções ao entrar na viewport. */
export const viewportProps = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-70px' },
}

/** Container do headline: revela palavra por palavra (use com `wordUp` nos filhos). */
export const wordsContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.12 },
  },
}

/** Palavra sobe de trás de uma máscara (o pai precisa de overflow-hidden). */
export const wordUp = {
  hidden: { y: '115%', rotate: 2.5 },
  visible: {
    y: 0,
    rotate: 0,
    transition: { type: 'spring', stiffness: 150, damping: 21, mass: 0.8 },
  },
}
