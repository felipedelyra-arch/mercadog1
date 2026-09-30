import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus } from 'lucide-react'
import { formatPrice } from '../utils/format'
import { isAvailable, productFullName, productImageUrl } from '../data/products'
import { useCart } from '../context/CartContext'
import { getIcon } from './ui/icons'

/**
 * Produto em linha — a versão de celular do ProductCard. Cabe ~7 por tela em
 * vez de ~2, sem o quadro grande de ícone (a maioria ainda não tem foto).
 * Mesmas regras: "+" põe no carrinho, sem estoque não tem botão.
 */
export default function ProductRow({ product }) {
  const Icon = getIcon(product.categorias?.icon)
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = imageFailed ? null : productImageUrl(product.image)
  const available = isAvailable(product)
  const cart = useCart()
  const inCart = cart.quantityOf(product.id)

  return (
    <li className={`flex items-center gap-3 py-3 ${available ? '' : 'opacity-70'}`}>
      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-tile bg-terracotta-50 text-terracotta-400">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} className="size-full object-cover" />
        ) : (
          <Icon size={22} aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="leading-snug font-semibold text-ink">{product.nome}</p>
        <p className="truncate text-sm text-clay">
          {[product.detalhes, product.categorias?.label].filter(Boolean).join(' · ')}
        </p>
        {product.exige_receita && (
          <p className="flex items-center gap-1 text-xs font-semibold text-terracotta-700">
            <FileText size={12} aria-hidden="true" />
            Exige receita
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`font-display font-semibold ${available ? 'text-terracotta-600' : 'text-clay'}`}>
          {product.preco == null ? <span className="text-sm">Sob consulta</span> : formatPrice(product.preco)}
        </span>
        {available ? (
          <motion.button
            type="button"
            aria-label={`Adicionar ${productFullName(product)} ao carrinho${inCart ? ` (já tem ${inCart})` : ''}`}
            onClick={() => cart.add(product)}
            whileTap={{ scale: 0.92 }}
            className="relative grid size-11 place-items-center rounded-full bg-terracotta-500 text-white transition-colors hover:bg-terracotta-600"
          >
            <Plus size={20} aria-hidden="true" />
            {inCart > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-xs font-bold text-white ring-2 ring-white"
              >
                {inCart}
              </span>
            )}
          </motion.button>
        ) : (
          <span className="text-xs font-semibold text-clay">Sem estoque</span>
        )}
      </div>
    </li>
  )
}
