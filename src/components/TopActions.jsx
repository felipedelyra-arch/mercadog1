import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bath, ChevronRight, Cross, ShoppingBag, Siren, Stethoscope, Syringe } from 'lucide-react'
import { fadeUp, staggerContainer } from '../animations/variants'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'

/**
 * Barra de ações no TOPO da home: em uma emergência ninguém tem
 * paciência para procurar — os serviços principais ficam a um toque
 * assim que a página abre, com a emergência 24h ocupando a linha inteira
 * no celular (é o caminho mais urgente, não pode disputar espaço).
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
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3"
      >
        {ACTIONS.map(({ icon: Icon, label, hint, onClick, href, emergency }) => {
          const base = [
            'group tap flex w-full items-center gap-3 rounded-card px-3.5 py-3 text-left sm:px-4 sm:py-3.5',
            'transition-colors duration-200',
            emergency
              ? 'pulse-emergency col-span-2 bg-terracotta-500 text-white shadow-warm-lg hover:bg-terracotta-600 sm:col-span-1'
              : 'border border-sand bg-white text-ink shadow-warm hover:border-terracotta-200 hover:bg-terracotta-50',
          ].join(' ')

          const inner = (
            <>
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-tile transition-transform duration-500 ease-out group-hover:-rotate-6 motion-reduce:transition-none ${
                  emergency ? 'bg-white/20 text-white' : 'bg-terracotta-100 text-terracotta-600'
                }`}
              >
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[0.9375rem] leading-tight font-semibold sm:text-base">
                  {label}
                </span>
                <span
                  className={`mt-0.5 block truncate text-xs ${
                    emergency ? 'text-terracotta-100' : 'text-clay'
                  }`}
                >
                  {hint}
                </span>
              </span>
              <ChevronRight
                size={16}
                aria-hidden="true"
                className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                  emergency ? 'text-white/70' : 'text-terracotta-300'
                }`}
              />
            </>
          )

          const motionProps = {
            variants: fadeUp,
            whileHover: { y: -2 },
            whileTap: { scale: 0.98 },
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
