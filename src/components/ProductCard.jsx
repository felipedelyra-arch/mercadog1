import { motion } from 'framer-motion'
import { fadeUp, SPRING_SNAP } from '../animations/variants'
import { useTilt } from '../hooks/useTilt'
import { formatPrice } from '../utils/format'
import { getCategoryById } from '../data/products'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import { getIcon } from './ui/icons'
import WhatsAppIcon from './ui/WhatsAppIcon'

/**
 * Card de produto com tilt 3D e spotlight no hover.
 * Sem foto nesta fase: tile creme com o ícone da categoria
 * (troque por <img> quando a API entregar `product.image`).
 * CTA abre o WhatsApp do atendimento com o nome do produto pré-preenchido.
 */
export default function ProductCard({ product }) {
  const category = getCategoryById(product.categoria)
  const Icon = getIcon(category?.icon)
  const tilt = useTilt()

  const whatsUrl = buildWhatsAppUrl(
    WHATSAPP_NUMBERS.atendimento,
    WHATSAPP_MESSAGES.produto(product.nome),
  )

  return (
    <motion.article
      layout
      variants={fadeUp}
      {...tilt.handlers}
      style={tilt.style}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={SPRING_SNAP}
      // card inteiro clicável (atalho); o botão interno segue sendo o acesso por teclado
      onClick={() => window.open(whatsUrl, '_blank', 'noopener,noreferrer')}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-sand bg-white shadow-warm"
    >
      {/* Spotlight quente seguindo o cursor */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: tilt.spotlight }}
      />

      {/* Tile da imagem (placeholder de categoria) */}
      <div className="relative grid h-40 place-items-center overflow-hidden bg-cream">
        <span className="grid size-16 place-items-center rounded-arch bg-white text-terracotta-300 shadow-warm transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-108 motion-reduce:transition-none">
          <Icon size={30} aria-hidden="true" />
        </span>
        {product.destaque && (
          <span className="absolute top-3 left-3 rounded-full bg-terracotta-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-terracotta-600 uppercase">
            Popular
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[11px] font-bold tracking-widest text-clay uppercase">
          {category?.label}
        </span>
        <h3 className="flex-1 text-sm leading-snug font-semibold text-ink">{product.nome}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-display text-lg font-semibold text-terracotta-600">
            {formatPrice(product.preco)}
          </span>
          <motion.a
            href={whatsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Pedir ${product.nome} pelo WhatsApp`}
            // evita abrir duas vezes (clique também sobe para o card)
            onClick={(e) => e.stopPropagation()}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="relative z-20 grid size-9 place-items-center rounded-full bg-terracotta-500 text-white hover:bg-terracotta-600"
          >
            <WhatsAppIcon size={17} aria-hidden="true" />
          </motion.a>
        </div>
      </div>
    </motion.article>
  )
}
