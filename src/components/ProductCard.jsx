import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { fadeUp } from '../animations/variants'
import { formatPrice } from '../utils/format'
import { isAvailable, productFullName, productImageUrl } from '../data/products'
import { useCart } from '../context/CartContext'
import { getIcon } from './ui/icons'

/**
 * Card de produto (grade da loja no computador e vitrine da Home).
 * Mostra a foto quando `product.image` existe; sem foto (ou se o arquivo
 * falhar) cai no tile creme com o ícone da categoria.
 * Tocar no card (ou no "+") põe o produto no carrinho; o selo no canto mostra
 * quantos já estão lá. Sem preço cadastrado mostra "Sob consulta".
 * Produto fora de estoque fica sem CTA e sem clique — só informa a falta.
 */
export default function ProductCard({ product }) {
  const category = product.categorias
  const Icon = getIcon(category?.icon)
  // foto quebrada não deixa buraco no grid: volta para o ícone da categoria
  const [imageFailed, setImageFailed] = useState(false)

  const available = isAvailable(product)
  const imageUrl = imageFailed ? null : productImageUrl(product.image)

  const cart = useCart()
  const inCart = cart.quantityOf(product.id)
  const addToCart = () => cart.add(product)

  return (
    <motion.article
      variants={fadeUp}
      whileTap={available ? { scale: 0.985 } : undefined}
      // card inteiro clicável (atalho); o botão interno segue sendo o acesso por teclado
      onClick={available ? addToCart : undefined}
      className={`group relative flex h-full flex-col overflow-hidden rounded-card border border-sand bg-white shadow-warm transition-colors ${
        available ? 'cursor-pointer hover:border-terracotta-200' : 'opacity-75'
      }`}
    >
      {/* Foto do produto — sem ela, tile com o ícone da categoria */}
      <div className="relative grid h-32 place-items-center overflow-hidden bg-gradient-to-b from-terracotta-50 to-cream sm:h-40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.nome}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={`size-full object-cover ${available ? '' : 'grayscale'}`}
          />
        ) : (
          <span className="grid size-14 place-items-center rounded-arch bg-white text-terracotta-400 shadow-warm-xs ring-1 ring-sand sm:size-16">
            <Icon size={26} aria-hidden="true" />
          </span>
        )}

        <AnimatePresence>
          {inCart > 0 && (
            <motion.span
              key="qtd"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-2.5 right-2.5 z-20 flex h-7 items-center gap-1 rounded-full bg-ink px-2.5 text-xs font-bold text-white sm:top-3 sm:right-3"
            >
              <Check size={13} aria-hidden="true" />
              {inCart}
              <span className="sr-only">no carrinho</span>
            </motion.span>
          )}
        </AnimatePresence>

        {!available ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-clay px-2.5 py-1 text-xs font-semibold text-white sm:top-3 sm:left-3">
            Sem estoque
          </span>
        ) : (
          product.destaque && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-terracotta-600 px-2.5 py-1 text-xs font-semibold text-white sm:top-3 sm:left-3">
              Popular
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <span className="text-xs text-clay">
          {category?.label}
        </span>
        <h3 className="flex-1 text-[0.8125rem] leading-snug font-semibold text-ink sm:text-sm">
          {product.nome}
        </h3>
        {product.detalhes && (
          <p className="text-xs leading-snug text-clay sm:text-[0.8125rem]">{product.detalhes}</p>
        )}
        {product.exige_receita && (
          <p className="flex items-center gap-1 text-xs font-semibold text-terracotta-700">
            <FileText size={13} aria-hidden="true" />
            Exige receita veterinária
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-sand pt-2.5">
          <span
            className={`font-display text-base font-semibold sm:text-lg ${
              available ? 'text-terracotta-600' : 'text-clay'
            }`}
          >
            {product.preco == null ? (
              <span className="text-sm">Sob consulta</span>
            ) : (
              formatPrice(product.preco)
            )}
          </span>
          {available ? (
            <motion.button
              type="button"
              aria-label={`Adicionar ${productFullName(product)} ao carrinho`}
              // evita adicionar duas vezes (clique também sobe para o card)
              onClick={(e) => {
                e.stopPropagation()
                addToCart()
              }}
              whileTap={{ scale: 0.94 }}
              className="relative z-20 grid size-11 shrink-0 place-items-center rounded-full bg-terracotta-500 text-white transition-colors hover:bg-terracotta-600"
            >
              <Plus size={19} aria-hidden="true" />
            </motion.button>
          ) : (
            <span className="text-xs font-semibold text-clay">
              Não temos no momento
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
