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
    'group tap flex w-full items-center gap-3.5 rounded-full bg-white px-4 py-3 text-left ' +
    'font-display text-[0.9375rem] leading-snug font-semibold text-terracotta-700 shadow-warm ' +
    'transition-colors hover:bg-terracotta-50 sm:gap-4 sm:px-5 sm:py-4 sm:text-lg'

  return (
    <section aria-label="Acesso rápido" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <motion.div
        variants={staggerContainer}
        {...viewportProps}
        className="relative overflow-hidden rounded-panel bg-terracotta-700 px-4 py-9 shadow-warm-lg sm:px-10 sm:py-10"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_-10%,rgba(255,255,255,0.14),transparent_60%)]"
        />
        <motion.div variants={fadeUp} className="relative mb-7 text-center sm:mb-8">
          <h2 className="font-display text-display-md font-semibold text-white">
            O que você precisa hoje?
          </h2>
          <p className="mt-2 text-sm text-terracotta-100">
            Atalhos direto ao ponto — como no nosso Instagram.
          </p>
        </motion.div>

        <div className="relative mx-auto flex max-w-md flex-col gap-3 sm:gap-4">
          {ACTIONS.map(({ icon: Icon, label, onClick, href }) => {
            const inner = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-terracotta-100 text-terracotta-600 sm:size-11">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="flex-1">{label}</span>
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-terracotta-300 transition-transform duration-200 group-hover:translate-x-0.5"
                />
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
