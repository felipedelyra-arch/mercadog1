import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { pageVariants } from '../../animations/variants'

const SUFIXO = 'Mercadog · Tupã/SP'

/**
 * Envolve o conteúdo de cada página para a transição de entrada/saída
 * orquestrada pelo AnimatePresence no App.
 * O padding-top compensa a navbar fixa (barra de 80px).
 * `title` vira o título da aba e o que o Google mostra no resultado.
 */
export default function PageWrapper({ children, className = '', title }) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFIXO}` : `${SUFIXO} · Petshop e clínica veterinária 24h`
  }, [title])

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
