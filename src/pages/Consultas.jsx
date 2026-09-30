import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Info, Stethoscope } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import BookingFlow from '../components/booking/BookingFlow'
import Button from '../components/ui/Button'
import SectionHeading from '../components/ui/SectionHeading'
import { fadeUp, staggerContainer, viewportProps } from '../animations/variants'
import { useFetch } from '../hooks/useFetch'
import { getVets } from '../services/api'
import { CONSULTA } from '../data/consultas'
import { PET_SIZES } from '../data/services'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'

export default function Consultas() {
  const { data: vets } = useFetch(getVets)
  // Motivo pré-preenchido pelos atalhos da Home ("Vacina", "Avaliação para cirurgia")
  const { state } = useLocation()

  return (
    <PageWrapper title="Consultas veterinárias">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            as="h1"
            title="Consultas com quem entende de pet"
            subtitle="Escolha o dia e o horário e conte o que o seu pet precisa. Para urgências, fale direto com a equipe médica pelo WhatsApp — a clínica funciona 24 horas."
            align="left"
          />
          <Button
            variant="whatsapp"
            href={buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h)}
            className="w-full shrink-0 sm:w-auto"
          >
            <WhatsAppIcon size={18} aria-hidden="true" />
            Clínica 24h · Dr. Wilson
          </Button>
        </div>

        {/* Consulta é uma só: o que vai ser feito e o valor saem na hora */}
        <p className="-mt-4 flex items-start gap-2.5 rounded-card border border-sand bg-cream px-4 py-3.5 text-sm text-clay">
          <Info size={18} className="mt-0.5 shrink-0 text-terracotta-500" aria-hidden="true" />
          <span>
            Na consulta o veterinário avalia o seu pet e indica exames, vacinas ou procedimentos
            quando precisar. <strong className="text-ink">O valor é informado no atendimento.</strong>
          </span>
        </p>

        <BookingFlow
          kind="consulta"
          fixedItem={CONSULTA}
          initialNote={state?.motivo}
          serviceLabel={(item) => item.nome}
          buildWhatsMessage={(item, slot, form, pedido) =>
            WHATSAPP_MESSAGES.consulta({
              ...pedido,
              data: slot.day.full,
              horario: slot.time,
              pet: form.pet,
              porte: PET_SIZES.find((s) => s.id === form.porte)?.label,
              motivo: form.observacoes,
            })
          }
        />

        {/* Equipe */}
        {vets?.length > 0 && (
          <section aria-label="Nossa equipe veterinária" className="mt-4">
            <motion.div
              variants={staggerContainer}
              {...viewportProps}
              className="grid gap-5 sm:grid-cols-2"
            >
              {vets.map((vet) => (
                <motion.div
                  key={vet.id}
                  variants={fadeUp}
                  className="flex items-center gap-4 rounded-card border border-sand bg-cream p-5"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-arch bg-white text-terracotta-500 shadow-warm">
                    <Stethoscope size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">{vet.nome}</h3>
                    {vet.especialidade && <p className="text-sm text-clay">{vet.especialidade}</p>}
                    {vet.crmv && <p className="text-xs text-clay">{vet.crmv}</p>}
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
