import { useLocation } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import BookingFlow from '../components/booking/BookingFlow'
import Button from '../components/ui/Button'
import SectionHeading from '../components/ui/SectionHeading'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'
import { useFetch } from '../hooks/useFetch'
import { getServices } from '../services/api'
import { minPrice, PET_SIZES } from '../data/services'
import { SITE } from '../config/site'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import { formatPrice } from '../utils/format'

export default function Agendamento() {
  const { data: services, loading } = useFetch(getServices)
  // Serviço pré-selecionado quando o usuário clica num card da Home
  const { state } = useLocation()

  return (
    <PageWrapper>
      <div className="bg-glow mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Banho e tosa"
            title="Agende o dia de spa do seu pet"
            subtitle="Três passos rápidos: serviço, horário e os dados do seu pet. Os valores variam por porte."
            align="left"
          />
          <Button
            variant="whatsapp"
            href={buildWhatsAppUrl(WHATSAPP_NUMBERS.banhoTosa, WHATSAPP_MESSAGES.banhoTosa)}
            className="w-full shrink-0 sm:w-auto"
          >
            <WhatsAppIcon size={18} aria-hidden="true" />
            {SITE.phoneBanhoTosa}
          </Button>
        </div>

        <BookingFlow
          kind="servico"
          items={services ?? []}
          loading={loading}
          initialItemId={state?.serviceId}
          priceFor={(service) => ({ from: minPrice(service) })}
          buildWhatsMessage={(service, slot, form, booking) => {
            const porte = PET_SIZES.find((s) => s.id === form.porte)
            const preco = form.porte ? formatPrice(service.precos[form.porte]) : null
            return WHATSAPP_MESSAGES.agendamento({
              servico: `${service.nome}${porte ? ` (porte ${porte.label.toLowerCase()}${preco ? `, ${preco}` : ''})` : ''}`,
              data: slot.day.full,
              horario: slot.time,
              pet: form.pet,
              protocolo: booking?.protocolo,
              link: booking?.link,
            })
          }}
        />
      </div>
    </PageWrapper>
  )
}
