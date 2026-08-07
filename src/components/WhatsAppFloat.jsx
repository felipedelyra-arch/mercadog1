import { motion } from 'framer-motion'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import WhatsAppIcon from './ui/WhatsAppIcon'

/**
 * Botão flutuante de WhatsApp, visível em todas as páginas.
 * Entra com atraso e ganha um pulso sutil para chamar atenção sem irritar.
 * `bottom-safe` respeita a barra de gestos do iPhone.
 */
export default function WhatsAppFloat() {
  return (
    <motion.a
      href={buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.geral)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o Mercadog no WhatsApp"
      className="bottom-safe fixed right-4 z-50 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-warm-lg ring-2 ring-white/80 transition-colors hover:bg-whatsapp-dark sm:right-6"
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp/35 motion-reduce:hidden" />
      <WhatsAppIcon size={26} aria-hidden="true" />
    </motion.a>
  )
}
