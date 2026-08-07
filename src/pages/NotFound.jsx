import { motion } from 'framer-motion'
import { Dog } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <PageWrapper className="grid place-items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 px-4 py-24 text-center"
      >
        <motion.span
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
          className="grid size-20 place-items-center rounded-arch bg-terracotta-100 text-terracotta-500"
        >
          <Dog size={40} aria-hidden="true" />
        </motion.span>
        <h1 className="font-display text-display-lg font-semibold text-ink">
          Página não encontrada
        </h1>
        <p className="max-w-sm text-clay">
          Parece que alguém enterrou essa página no quintal. Vamos voltar para o início?
        </p>
        <Button to="/" className="mt-2">
          Voltar para a Home
        </Button>
      </motion.div>
    </PageWrapper>
  )
}
