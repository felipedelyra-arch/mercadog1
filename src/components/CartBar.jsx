import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'

/**
 * Barra do carrinho no rodapé da tela, só no celular e só na farmácia:
 * aparece quando há item no carrinho e fica no alcance do polegar — o ícone
 * do topo fica longe. Fora da farmácia ela cobriria formulários (agendamento).
 */
export default function CartBar() {
  const { pathname } = useLocation()
  const { count, total, sobConsulta, open, setOpen } = useCart()
  const visivel = pathname.startsWith('/loja') && count > 0 && !open

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="fixed inset-x-0 bottom-0 z-50 px-3 pb-safe md:hidden"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-ink px-4 text-left text-white shadow-warm-xl"
          >
            <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-white/10">
              <ShoppingBag size={18} aria-hidden="true" />
            </span>
            <span className="flex-1 font-semibold">
              Ver carrinho
              <span className="block text-sm font-normal text-white/75">
                {count} {count === 1 ? 'item' : 'itens'}
              </span>
            </span>
            <span className="text-right font-display text-lg font-semibold">
              {formatPrice(total)}
              {sobConsulta && <span className="block font-sans text-xs font-normal text-white/75">+ sob consulta</span>}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
