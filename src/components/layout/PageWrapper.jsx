import { motion } from 'framer-motion'
import { pageVariants } from '../../animations/variants'

/**
 * Envolve o conteúdo de cada página para a transição de entrada/saída
 * orquestrada pelo AnimatePresence no App.
 * O padding-top compensa a navbar fixa (fio de 2px + barra de 64px).
 */
export default function PageWrapper({ children, className = '' }) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={`min-h-screen pt-[4.125rem] ${className}`}
    >
      {children}
    </motion.main>
  )
}
