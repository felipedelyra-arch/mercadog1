import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {Clock, MapPin, Menu, Phone, X} from 'lucide-react'
import Logo from '../ui/Logo'
import Button from '../ui/Button'
import { EASE, staggerContainer, fadeUp } from '../../animations/variants'
import { SITE } from '../../config/site'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../../config/whatsapp'
import WhatsAppIcon from '../ui/WhatsAppIcon'

const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/agendamento', label: 'Banho e Tosa' },
  { to: '/consultas', label: 'Consultas' },
  { to: '/loja', label: 'Loja' },
]

/**
 * Navbar fixa no topo, escura (inspiração PetsStar):
 * logo à esquerda, links centrais com sublinhado animado, CTA à direita.
 * No mobile o hambúrguer abre um drawer branco pela esquerda.
 */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const toggleRef = useRef(null)

  // Fecha o drawer ao navegar
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Esc fecha + trava o scroll do body enquanto o drawer está aberto
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-ink/95 shadow-warm backdrop-blur-md">
        {/* Largura total: logo encostada à esquerda da tela */}
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-5">
          {/* Logo branca direto sobre o fundo escuro, sem chip */}
          <Link to="/" aria-label="Mercadog — página inicial" className="shrink-0">
            <Logo className="h-12" variant="light" />
          </Link>

          {/* Links — desktop */}
          <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className="relative px-3 py-2">
                {({ isActive }) => (
                  <>
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isActive ? 'text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {label}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-terracotta-300"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Ações à direita — desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <motion.a
              href={buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.geral)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <WhatsAppIcon size={17} aria-hidden="true" />
            </motion.a>
            <Button to="/agendamento" size="sm">
              Agende um horário
            </Button>
          </div>

          {/* Hambúrguer — mobile */}
          <button
            ref={toggleRef}
            type="button"
            className="grid size-11 place-items-center rounded-full text-white transition-colors hover:bg-white/10 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Drawer — mobile */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-[2px] md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              id="menu-mobile"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed inset-y-0 left-0 z-[70] flex w-80 max-w-[85vw] flex-col bg-white shadow-warm-lg md:hidden"
            >
              <div className="flex items-center justify-between border-b border-sand px-5 py-4">
                <Logo className="h-10" />
                <button
                  type="button"
                  autoFocus
                  aria-label="Fechar menu"
                  onClick={() => {
                    setMenuOpen(false)
                    toggleRef.current?.focus()
                  }}
                  className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-terracotta-50"
                >
                  <X size={22} />
                </button>
              </div>

              <motion.nav
                aria-label="Navegação principal"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5"
              >
                {NAV_LINKS.map(({ to, label }) => (
                  <motion.div key={to} variants={fadeUp}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `block rounded-xl px-4 py-3.5 font-display text-lg font-semibold transition-colors ${
                          isActive
                            ? 'bg-terracotta-50 text-terracotta-600'
                            : 'text-ink hover:bg-cream'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  </motion.div>
                ))}

                <motion.div variants={fadeUp} className="mt-4">
                  <Button to="/agendamento" className="w-full">
                    Agende um horário
                  </Button>
                </motion.div>
                <motion.div variants={fadeUp} className="mt-2">
                  <Button
                    variant="whatsapp"
                    href={buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.geral)}
                    className="w-full"
                  >
                    <WhatsAppIcon size={18} aria-hidden="true" />
                    Falar no WhatsApp
                  </Button>
                </motion.div>
              </motion.nav>

              {/* Contato resumido */}
              <div className="flex flex-col gap-2 border-t border-sand bg-cream px-5 py-4 text-sm text-clay">
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-terracotta-500" aria-hidden="true" />
                  {SITE.address}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={15} className="shrink-0 text-terracotta-500" aria-hidden="true" />
                  {SITE.phone}
                </p>
                {SITE.hours.map(({ label, value }) => (
                  <p key={label} className="flex items-start gap-2">
                    <Clock size={15} className="mt-0.5 shrink-0 text-terracotta-500" aria-hidden="true" />
                    <span>
                      {label}: <strong className="text-ink">{value}</strong>
                    </span>
                  </p>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
