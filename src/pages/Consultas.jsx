import { motion } from 'framer-motion'
import {Stethoscope} from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import BookingFlow from '../components/booking/BookingFlow'
import Button from '../components/ui/Button'
import SectionHeading from '../components/ui/SectionHeading'
import { fadeUp, staggerContainer, viewportProps } from '../animations/variants'
import { useFetch } from '../hooks/useFetch'
import { getConsultaTypes, getVets } from '../services/api'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'

export default function Consultas() {
  const { data: types, loading } = useFetch(getConsultaTypes)
  const { data: vets } = useFetch(getVets)

  return (
    <PageWrapper>
      <div className="bg-glow mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Clínica veterinária 24h"
            title="Consultas com quem entende de pet"
            subtitle="Consultas, vacinas, cirurgias e ortopedia especializada. Agende online ou fale direto com a equipe médica pelo WhatsApp — a clínica funciona 24 horas."
            align="left"
          />
          <Button
            variant="whatsapp"
            href={buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h)}
            className="shrink-0"
          >
            <WhatsAppIcon size={18} aria-hidden="true" />
            Clínica 24h · Dr. Wilson
          </Button>
        </div>

        <BookingFlow
          kind="consulta"
          items={types ?? []}
          loading={loading}
          priceFor={(type) => (type.aPartir ? { from: type.preco } : type.preco)}
          buildWhatsMessage={(type, slot, form) =>
            WHATSAPP_MESSAGES.consulta({
              tipo: type.nome,
              data: slot.day.full,
              horario: slot.time,
              pet: form.pet,
            })
          }
        />

        {/* Equipe */}
        {vets && (
          <section aria-label="Nossa equipe veterinária" className="mt-4">
            <motion.div
              variants={staggerContainer}
              {...viewportProps}
              className="grid gap-5 sm:grid-cols-2"
            >
              {vets.map((vet) => (
                <motion.div
                  key={vet.crmv}
                  variants={fadeUp}
                  className="flex items-center gap-4 rounded-card border border-sand bg-cream p-5"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-arch bg-white text-terracotta-500 shadow-warm">
                    <Stethoscope size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">{vet.nome}</h3>
                    <p className="text-sm text-clay">{vet.especialidade}</p>
                    <p className="text-xs text-clay">{vet.crmv}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </div>
    </PageWrapper>
  )
}
