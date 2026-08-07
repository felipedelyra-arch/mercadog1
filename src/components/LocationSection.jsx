import { motion } from 'framer-motion'
import { Clock, MapPin, Navigation, Phone } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Button from './ui/Button'
import { fadeUp, staggerContainer, viewportProps } from '../animations/variants'
import { SITE } from '../config/site'

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `Mercadog, ${SITE.address}`,
)}`

/** Localidade + horários: onde encontrar a loja e a clínica 24h. */
export default function LocationSection() {
  return (
    <section aria-label="Localização" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Onde estamos"
        title="Fácil de chegar, difícil de esquecer"
        subtitle="Loja e clínica no mesmo endereço, no centro de Tupã."
      />
      <motion.div
        variants={staggerContainer}
        {...viewportProps}
        className="mt-10 grid gap-3.5 sm:grid-cols-3 sm:gap-5"
      >
        <motion.div variants={fadeUp} className="flex items-start gap-4 rounded-card border border-sand bg-white p-5 shadow-warm sm:p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-arch bg-terracotta-100 text-terracotta-600">
            <MapPin size={22} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Endereço</h3>
            <p className="mt-1 text-sm leading-relaxed text-clay">{SITE.address}</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-start gap-4 rounded-card border border-sand bg-white p-5 shadow-warm sm:p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-arch bg-terracotta-100 text-terracotta-600">
            <Clock size={22} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Horário</h3>
            <p className="mt-1 text-sm leading-relaxed text-clay">
              Emergência veterinária <strong className="text-ink">24 horas</strong>, todos os dias.
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-start gap-4 rounded-card border border-sand bg-white p-5 shadow-warm sm:p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-arch bg-terracotta-100 text-terracotta-600">
            <Phone size={22} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Telefone</h3>
            <p className="mt-1 text-sm leading-relaxed text-clay">{SITE.phone}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Mapa real embutido: quem está com pressa vê onde é sem sair do site */}
      <motion.div
        variants={fadeUp}
        {...viewportProps}
        className="mt-8 overflow-hidden rounded-card shadow-warm-lg"
      >
        <iframe
          title="Mapa — como chegar ao Mercadog"
          src={`https://www.google.com/maps?q=${encodeURIComponent(`Mercadog, ${SITE.address}`)}&output=embed`}
          className="h-72 w-full border-0 sm:h-80"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </motion.div>

      <motion.div variants={fadeUp} {...viewportProps} className="mt-6 text-center">
        <Button href={MAPS_URL} variant="outline" className="w-full sm:w-auto">
          <Navigation size={16} aria-hidden="true" />
          Abrir rota no Google Maps
        </Button>
      </motion.div>
    </section>
  )
}
