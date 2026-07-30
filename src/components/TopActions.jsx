import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bath, Cross, ShoppingBag, Siren, Stethoscope, Syringe } from 'lucide-react'
import { fadeUp, staggerContainer } from '../animations/variants'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'

/**
 * Barra de ações no TOPO da home: em uma emergência ninguém tem
 * paciência para procurar — os serviços principais ficam a um toque
 * assim que a página abre, com a emergência 24h em primeiro e em destaque.
 */
export default function TopActions() {
  const navigate = useNavigate()

  const ACTIONS = [
    {
      icon: Siren,
      label: 'Emergência 24h',
      hint: 'Chamar agora no WhatsApp',
      href: buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h),
      emergency: true,
    },
    {
      icon: Stethoscope,
      label: 'Consulta médica',
      hint: 'Exames, ultrassom e raio X',
      onClick: () => navigate('/consultas'),
    },
    {
      icon: Bath,
      label: 'Banho e Tosa',
      hint: 'Agende em 1 minuto',
      onClick: () => navigate('/agendamento'),
    },
    {
      icon: ShoppingBag,
      label: 'Loja',
      hint: 'Ração e acessórios',
      onClick: () => navigate('/loja'),
    },
    {
      icon: Syringe,
      label: 'Vacinas',
      hint: 'Carteirinha sempre em dia',
      onClick: () => navigate('/consultas', { state: { consultaId: 'vacinas' } }),
    },
    {
      icon: Cross,
      label: 'Cirurgias',
      hint: 'Avaliação e pós-operatório',
      onClick: () => navigate('/consultas', { state: { consultaId: 'cirurgias' } }),
    },
  ]

  return (
    <section aria-label="Acesso rápido aos serviços" className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {ACTIONS.map(({ icon: Icon, label, hint, onClick, href, emergency }) => {
          const base =
            'flex w-full items-center gap-3 rounded-card px-4 py-3.5 text-left shadow-warm ' +
            'transition-colors ' +
            (emergency
              ? 'pulse-emergency bg-terracotta-600 text-white hover:bg-terracotta-500'
              : 'bg-white text-ink hover:bg-terracotta-50')
          const inner = (
            <>
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-full ${
                  emergency
                    ? 'bg-white/15 text-white'
                    : 'bg-terracotta-100 text-terracotta-600'
                }`}
              >
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-semibold sm:text-base">
                  {label}
                </span>
                <span
                  className={`block truncate text-xs ${
                    emergency ? 'text-terracotta-100' : 'text-clay'
                  }`}
                >
                  {hint}
                </span>
              </span>
            </>
          )
          const motionProps = {
            variants: fadeUp,
            whileHover: { scale: 1.03, y: -2 },
            whileTap: { scale: 0.97 },
          }
          return href ? (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={base}
              {...motionProps}
            >
              {inner}
            </motion.a>
          ) : (
            <motion.button key={label} type="button" onClick={onClick} className={base} {...motionProps}>
              {inner}
            </motion.button>
          )
        })}
      </motion.div>
    </section>
  )
}
