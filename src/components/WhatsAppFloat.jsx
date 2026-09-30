import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import WhatsAppIcon from './ui/WhatsAppIcon'

/**
 * Botão flutuante de WhatsApp.
 * - Fica fora da farmácia: lá ele cobria o "+" dos produtos da coluna da direita
 *   (o WhatsApp do pedido já está no carrinho).
 * `bottom-safe` respeita a barra de gestos do iPhone.
 */
export default function WhatsAppFloat() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/loja')) return null

  return (
    <motion.a
      href={buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.geral)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o Mercadog no WhatsApp"
      className="bottom-safe fixed right-4 z-40 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-warm-lg ring-2 ring-white/80 transition-colors hover:bg-whatsapp-dark sm:right-6"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
      whileTap={{ scale: 0.92 }}
    >
      <WhatsAppIcon size={26} aria-hidden="true" />
    </motion.a>
  )
}
