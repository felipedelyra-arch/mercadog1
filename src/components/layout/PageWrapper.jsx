import { motion } from 'framer-motion'
import { pageVariants } from '../../animations/variants'

/**
 * Envolve o conteúdo de cada página para a transição de entrada/saída
 * orquestrada pelo AnimatePresence no App.
 * O padding-top compensa a navbar fixa (barra de 80px).
 */
export default function PageWrapper({ children, className = '' }) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={`min-h-screen pt-20 ${className}`}
    >
      {children}
    </motion.main>
  )
}
