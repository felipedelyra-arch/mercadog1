import { Link } from 'react-router-dom'
import { Bath, Clock, Mail, MapPin, PawPrint, Phone } from 'lucide-react'
import Logo from '../ui/Logo'
import FacebookIcon from '../ui/FacebookIcon'
import InstagramIcon from '../ui/InstagramIcon'
import WhatsAppIcon from '../ui/WhatsAppIcon'
import { SITE } from '../../config/site'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../../config/whatsapp'

const FOOTER_LINKS = [
  { to: '/consultas', label: 'Consultas veterinárias' },
  { to: '/agendamento', label: 'Agendar banho e tosa' },
  { to: '/loja', label: 'Loja de produtos' },
]

/** Redes sociais + WhatsApp. O WhatsApp pisca para puxar o clique. */
const SOCIALS = [
  { icon: InstagramIcon, label: 'Instagram do Mercadog', href: SITE.instagram },
  { icon: FacebookIcon, label: 'Facebook do Mercadog', href: SITE.facebook },
  {
    icon: WhatsAppIcon,
    label: 'WhatsApp do Mercadog',
    href: buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.geral),
    blink: true,
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-sand bg-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-12 md:grid-cols-3">
        {/* Identidade */}
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-clay">{SITE.tagline}.</p>
          <div className="mt-1 flex items-center gap-3">
            {SOCIALS.map(({ icon: Icon, label, href, blink }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className={`grid size-11 place-items-center rounded-full transition-colors ${
                  blink
                    ? 'blink-whatsapp bg-whatsapp text-white hover:bg-whatsapp-dark'
                    : 'bg-terracotta-100 text-terracotta-600 hover:bg-terracotta-200'
                }`}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
          <p className="text-sm text-clay">@mercadogpetshop</p>
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
          <a
            href={buildWhatsAppUrl(WHATSAPP_NUMBERS.banhoTosa, WHATSAPP_MESSAGES.banhoTosa)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-2 hover:text-terracotta-600"
          >
            <Bath size={16} className="shrink-0 text-terracotta-500" aria-hidden="true" />
            Banho e tosa: {SITE.phoneBanhoTosa}
          </a>
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

      <div className="flex flex-col items-center gap-1 border-t border-sand px-4 py-5 text-center text-xs text-clay">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          © {new Date().getFullYear()} {SITE.name} · Feito com carinho para o seu pet
          <PawPrint size={13} className="text-terracotta-500" aria-hidden="true" />
        </p>
        <p>
          Site desenvolvido por{' '}
          <span className="font-semibold text-terracotta-600">Fluxo Tech</span>
        </p>
        {/* Espaço para o botão flutuante do WhatsApp não cobrir o texto no celular */}
        <div aria-hidden="true" className="h-14 sm:h-0" />
      </div>
    </footer>
  )
}
