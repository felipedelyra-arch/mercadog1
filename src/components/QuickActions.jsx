import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {Bath, ChevronRight, ShoppingBag, Siren, Stethoscope} from 'lucide-react'
import { fadeUp, staggerContainer, viewportProps } from '../animations/variants'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import WhatsAppIcon from './ui/WhatsAppIcon'

/**
 * Acesso rápido no estilo do linktree oficial do Mercadog:
 * pills brancos sobre painel terracota escuro, um por ação.
 */
export default function QuickActions() {
  const navigate = useNavigate()

  const ACTIONS = [
    {
      icon: Siren,
      label: 'Emergência 24h · Dr. Wilson',
      href: buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h),
    },
    {
      icon: Stethoscope,
      label: 'Agendar consulta médica',
      onClick: () => navigate('/consultas'),
    },
    {
      icon: Bath,
      label: 'Agendar banho e tosa',
      onClick: () => navigate('/agendamento'),
    },
    {
      icon: ShoppingBag,
      label: 'Comprar ração e produtos',
      onClick: () => navigate('/loja'),
    },
    {
      icon: WhatsAppIcon,
      label: 'Falar com um atendente',
      href: buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.atendimentoLoja),
    },
  ]

  const pillClass =
    'flex w-full items-center gap-4 rounded-full bg-white px-5 py-4 text-left ' +
    'font-display text-base font-semibold text-terracotta-700 shadow-warm ' +
    'transition-colors hover:bg-terracotta-50 sm:text-lg'

  return (
    <section aria-label="Acesso rápido" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <motion.div
        variants={staggerContainer}
        {...viewportProps}
        className="rounded-card bg-terracotta-700 px-5 py-10 shadow-warm-lg sm:px-10"
      >
        <motion.div variants={fadeUp} className="mb-8 text-center">
          <h2 className="font-display text-3xl font-semibold text-white">
            O que você precisa hoje?
          </h2>
          <p className="mt-2 text-sm text-terracotta-100">
            Atalhos direto ao ponto — como no nosso Instagram.
          </p>
        </motion.div>

        <div className="mx-auto flex max-w-md flex-col gap-4">
          {ACTIONS.map(({ icon: Icon, label, onClick, href }) => {
            const inner = (
              <>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-terracotta-100 text-terracotta-600">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="flex-1">{label}</span>
                <ChevronRight size={18} className="shrink-0 text-terracotta-300" aria-hidden="true" />
              </>
            )
            const motionProps = {
              variants: fadeUp,
              whileHover: { scale: 1.02, y: -2 },
              whileTap: { scale: 0.98 },
              transition: { type: 'spring', stiffness: 180, damping: 24, mass: 0.8 },
            }
            return href ? (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={pillClass}
                {...motionProps}
              >
                {inner}
              </motion.a>
            ) : (
              <motion.button
                key={label}
                type="button"
                onClick={onClick}
                className={pillClass}
                {...motionProps}
              >
                {inner}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
