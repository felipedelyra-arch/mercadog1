import { useLocation } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import BookingFlow from '../components/booking/BookingFlow'
import SectionHeading from '../components/ui/SectionHeading'
import { useFetch } from '../hooks/useFetch'
import { getServices } from '../services/api'
import { minPrice, PET_SIZES } from '../data/services'
import { WHATSAPP_MESSAGES } from '../config/whatsapp'
import { formatPrice } from '../utils/format'

export default function Agendamento() {
  const { data: services, loading } = useFetch(getServices)
  // Serviço pré-selecionado quando o usuário clica num card da Home
  const { state } = useLocation()

  return (
    <PageWrapper>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
        <SectionHeading
          eyebrow="Banho e tosa"
          title="Agende o dia de spa do seu pet"
          subtitle="Três passos rápidos: serviço, horário e os dados do seu pet. Os valores variam por porte."
          align="left"
        />

        <BookingFlow
          kind="servico"
          items={services ?? []}
          loading={loading}
          initialItemId={state?.serviceId}
          priceFor={(service) => ({ from: minPrice(service) })}
          buildWhatsMessage={(service, slot, form) => {
            const porte = PET_SIZES.find((s) => s.id === form.porte)
            const preco = form.porte ? formatPrice(service.precos[form.porte]) : null
            return WHATSAPP_MESSAGES.agendamento({
              servico: `${service.nome}${porte ? ` (porte ${porte.label.toLowerCase()}${preco ? `, ${preco}` : ''})` : ''}`,
              data: slot.day.full,
              horario: slot.time,
              pet: form.pet,
            })
          }}
        />
      </div>
    </PageWrapper>
  )
}
