import { motion } from 'framer-motion'
import { useState } from 'react'
import { fadeUp, SPRING_SNAP } from '../animations/variants'
import { useTilt } from '../hooks/useTilt'
import { formatPrice } from '../utils/format'
import { getCategoryById, isAvailable, productImageUrl } from '../data/products'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import { getIcon } from './ui/icons'
import WhatsAppIcon from './ui/WhatsAppIcon'

/**
 * Card de produto com tilt 3D e spotlight no hover.
 * Mostra a foto quando `product.image` existe; sem foto (ou se o arquivo
 * falhar) cai no tile creme com o ícone da categoria.
 * CTA abre o WhatsApp do atendimento com o nome do produto pré-preenchido.
 * Produto fora de estoque fica sem CTA e sem clique — só informa a falta.
 */
export default function ProductCard({ product }) {
  const category = getCategoryById(product.categoria)
  const Icon = getIcon(category?.icon)
  const tilt = useTilt()
  // foto quebrada não deixa buraco no grid: volta para o ícone da categoria
  const [imageFailed, setImageFailed] = useState(false)

  const available = isAvailable(product)
  const imageUrl = imageFailed ? null : productImageUrl(product.image)

  const whatsUrl = buildWhatsAppUrl(
    WHATSAPP_NUMBERS.atendimento,
    WHATSAPP_MESSAGES.produto(product.nome),
  )

  return (
    <motion.article
      layout
      variants={fadeUp}
      {...(available ? tilt.handlers : {})}
      style={available ? tilt.style : undefined}
      whileHover={available ? { y: -4 } : undefined}
      whileTap={available ? { scale: 0.985 } : undefined}
      transition={SPRING_SNAP}
      // card inteiro clicável (atalho); o botão interno segue sendo o acesso por teclado
      onClick={
        available ? () => window.open(whatsUrl, '_blank', 'noopener,noreferrer') : undefined
      }
      className={`group relative flex h-full flex-col overflow-hidden rounded-card border border-sand bg-white shadow-warm transition-colors ${
        available ? 'cursor-pointer hover:border-terracotta-200' : 'opacity-75'
      }`}
    >
      {/* Spotlight quente seguindo o cursor */}
      {available && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: tilt.spotlight }}
        />
      )}

      {/* Foto do produto — sem ela, tile com o ícone da categoria */}
      <div className="relative grid h-32 place-items-center overflow-hidden bg-gradient-to-b from-terracotta-50 to-cream sm:h-40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.nome}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={`size-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none ${
              available ? 'group-hover:scale-105' : 'grayscale'
            }`}
          />
        ) : (
          <span
            className={`grid size-14 place-items-center rounded-arch bg-white text-terracotta-400 shadow-warm-xs ring-1 ring-sand transition-transform duration-500 ease-out motion-reduce:transition-none sm:size-16 ${
              available ? 'group-hover:-rotate-6 group-hover:scale-108' : ''
            }`}
          >
            <Icon size={26} aria-hidden="true" />
          </span>
        )}

        {!available ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-clay px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase sm:top-3 sm:left-3 sm:text-[11px]">
            Sem estoque
          </span>
        ) : (
          product.destaque && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-terracotta-600 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase sm:top-3 sm:left-3 sm:text-[11px]">
              Popular
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <span className="text-[10px] font-bold tracking-[0.12em] text-clay uppercase sm:text-[11px]">
          {category?.label}
        </span>
        <h3 className="flex-1 text-[0.8125rem] leading-snug font-semibold text-ink sm:text-sm">
          {product.nome}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-sand pt-2.5">
          <span
            className={`font-display text-base font-semibold sm:text-lg ${
              available ? 'text-terracotta-600' : 'text-clay'
            }`}
          >
            {formatPrice(product.preco)}
          </span>
          {available ? (
            <motion.a
              href={whatsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Pedir ${product.nome} pelo WhatsApp`}
              // evita abrir duas vezes (clique também sobe para o card)
              onClick={(e) => e.stopPropagation()}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-terracotta-500 text-white transition-colors hover:bg-terracotta-600"
            >
              <WhatsAppIcon size={17} aria-hidden="true" />
            </motion.a>
          ) : (
            <span className="text-[11px] font-semibold text-clay">
              Não temos no momento
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
