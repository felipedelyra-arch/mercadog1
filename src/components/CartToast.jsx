import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ShoppingBag, X } from 'lucide-react'
import { useEffect } from 'react'
import { useCart } from '../context/CartContext'

const DURACAO = 4500

/**
 * Aviso de "adicionado ao carrinho", logo abaixo da navbar e do lado da
 * sacola — junto com o pulso do ícone (CartButton), mostra onde o carrinho
 * fica para quem nunca comprou pelo site. Some sozinho; um item novo
 * reinicia o tempo.
 */
export default function CartToast() {
  const { aviso, fecharAviso, open, setOpen, quantityOf } = useCart()
  const qtd = aviso ? quantityOf(aviso.produtoId) : 0

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(fecharAviso, DURACAO)
    return () => clearTimeout(t)
  }, [aviso, fecharAviso])

  // abriu o carrinho: o aviso já cumpriu o papel
  useEffect(() => {
    if (open) fecharAviso()
  }, [open, fecharAviso])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[5.25rem] z-50 flex justify-end px-3 sm:px-6" aria-live="polite">
      <AnimatePresence>
        {aviso && (
          <motion.div
            key={aviso.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-sand bg-white p-3.5 shadow-warm-xl"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">Adicionado ao carrinho</p>
                <p className="truncate text-sm text-clay">
                  {aviso.nome}
                  {qtd > 1 && <strong className="text-ink"> · {qtd} no carrinho</strong>}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-clay">
                  Seu carrinho fica na sacola
                  <ShoppingBag size={13} className="text-terracotta-600" aria-hidden="true" />
                  lá em cima.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={fecharAviso}
                className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-clay hover:bg-cream"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={fecharAviso}
                className="min-h-11 flex-1 rounded-full border border-sand-dark text-sm font-semibold text-ink hover:bg-cream"
              >
                Continuar comprando
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="min-h-11 flex-1 rounded-full bg-terracotta-500 text-sm font-semibold text-white hover:bg-terracotta-600"
              >
                Ver carrinho
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
