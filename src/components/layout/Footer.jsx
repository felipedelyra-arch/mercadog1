import { Link } from 'react-router-dom'
import { AtSign, Clock, Mail, MapPin, Phone } from 'lucide-react'
import Logo from '../ui/Logo'
import { SITE } from '../../config/site'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../../config/whatsapp'

const FOOTER_LINKS = [
  { to: '/consultas', label: 'Consultas veterinárias' },
  { to: '/agendamento', label: 'Agendar banho e tosa' },
  { to: '/loja', label: 'Loja de produtos' },
]

export default function Footer() {
  return (
    <footer className="border-t border-sand bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        {/* Identidade */}
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-clay">{SITE.tagline}.</p>
          <div className="flex gap-4">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta-500"
            >
              <AtSign size={16} aria-hidden="true" /> @mercadogpetshop
            </a>
            <a
              href={SITE.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta-500"
            >
              <AtSign size={16} aria-hidden="true" /> Facebook
            </a>
          </div>
        </div>

        {/* Navegação */}
        <nav aria-label="Links do rodapé" className="flex flex-col gap-2">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">Serviços</h3>
          <a
            href={buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-sm font-semibold text-terracotta-600 hover:text-terracotta-500"
          >
            Emergência veterinária 24h
          </a>
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="w-fit text-sm text-clay hover:text-terracotta-600">
              {label}
            </Link>
          ))}
          <a
            href={buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.geral)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-sm text-clay hover:text-terracotta-600"
          >
            Fale conosco no WhatsApp
          </a>
        </nav>

        {/* Contato e horários */}
        <div className="flex flex-col gap-2 text-sm text-clay">
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">Contato</h3>
          <p className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-terracotta-500" aria-hidden="true" />
            {SITE.address}
          </p>
          <p className="flex items-center gap-2">
            <Phone size={16} className="shrink-0 text-terracotta-500" aria-hidden="true" />
            {SITE.phone}
          </p>
          <p className="flex items-center gap-2">
            <Mail size={16} className="shrink-0 text-terracotta-500" aria-hidden="true" />
            {SITE.email}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {SITE.hours.map(({ label, value }) => (
              <p key={label} className="flex items-center gap-2">
                <Clock size={16} className="shrink-0 text-terracotta-500" aria-hidden="true" />
                <span>
                  {label}: <strong className="text-ink">{value}</strong>
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-sand py-4 text-center text-xs text-clay">
        © {new Date().getFullYear()} {SITE.name} · Feito com carinho para o seu pet 🐾
      </div>
    </footer>
  )
}
