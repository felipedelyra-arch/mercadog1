import { ExternalLink, Navigation, Star } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import Button from './ui/Button'
import { SITE } from '../config/site'

/**
 * Onde estamos: endereço, horário, telefone e avaliações do Google numa
 * coluna, o mapa na outra. A nota do Google só aparece quando a equipe
 * preenche em Ajustes; sem ela, fica só o convite para ver as avaliações.
 */
export default function LocationSection() {
  const query = encodeURIComponent(`Mercadog, ${SITE.address}`)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`
  const { google } = SITE
  const temNota = google?.nota != null

  const linha = 'flex flex-col gap-0.5 border-t border-sand py-3 first:border-t-0 first:pt-0 sm:py-4'
  const rotulo = 'text-sm font-semibold text-clay'

  return (
    <section aria-labelledby="onde-estamos" className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:gap-10 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-14 lg:py-20">
      <div className="flex flex-col gap-5 sm:gap-8">
        <SectionHeading
          id="onde-estamos"
          title="Onde estamos"
          subtitle="Loja e clínica no mesmo endereço, no centro de Tupã."
          align="left"
        />

        <dl>
          <div className={linha}>
            <dt className={rotulo}>Endereço</dt>
            <dd className="text-lg text-ink">{SITE.address}</dd>
          </div>
          <div className={linha}>
            <dt className={rotulo}>Horário</dt>
            {SITE.hours.map(({ label, value }) => (
              <dd key={label} className="text-lg text-ink">
                {label}: <strong className="font-semibold">{value}</strong>
              </dd>
            ))}
          </div>
          <div className={linha}>
            <dt className={rotulo}>Telefone</dt>
            <dd>
              <a href={`tel:+55${SITE.phone.replace(/\D/g, '')}`} className="inline-flex min-h-11 items-center text-lg text-ink underline-offset-4 hover:underline">
                {SITE.phone}
              </a>
            </dd>
          </div>
          {google?.link && (
            <div className={linha}>
              <dt className={rotulo}>Avaliações no Google</dt>
              <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {temNota && (
                  <span className="flex items-center gap-1.5 text-lg text-ink">
                    <strong className="font-display text-2xl font-semibold">
                      {Number(google.nota).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                    </strong>
                    <Star size={18} className="text-terracotta-500" fill="currentColor" aria-hidden="true" />
                    {google.total != null && <span className="text-clay">({google.total} avaliações)</span>}
                  </span>
                )}
                <a
                  href={google.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 font-semibold text-terracotta-600 underline-offset-4 hover:underline"
                >
                  {temNota ? 'Ler as avaliações' : 'Ver o que os tutores dizem'}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </dd>
            </div>
          )}
        </dl>

        <Button href={mapsUrl} variant="outline" className="w-full sm:w-fit">
          <Navigation size={16} aria-hidden="true" />
          Abrir rota no Google Maps
        </Button>
      </div>

      {/* no celular o botão "Abrir rota" já leva ao mapa — o mapa embutido só alongava a página */}
      <div className="hidden overflow-hidden rounded-card border border-sand bg-cream sm:block">
        <iframe
          title="Mapa — como chegar ao Mercadog"
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          className="h-56 w-full border-0 sm:h-80 lg:h-full lg:min-h-[28rem]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  )
}
