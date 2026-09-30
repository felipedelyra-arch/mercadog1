import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import LocationSection from '../components/LocationSection'
import Oferta from '../components/Oferta'
import SectionHeading from '../components/ui/SectionHeading'
import ServiceCard from '../components/ServiceCard'
import ProductCard from '../components/ProductCard'
import ProductRow from '../components/ProductRow'
import { useMediaQuery } from '../hooks/useMediaQuery'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EASE } from '../animations/variants'
import { useFetch } from '../hooks/useFetch'
import { getProducts, getServices } from '../services/api'
import { isAvailable } from '../data/products'
import { cardPrice } from '../data/services'
import { SITE } from '../config/site'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'
import { formatTelefone } from '../utils/format'

export default function Home() {
  const navigate = useNavigate()
  const { data: services, loading: loadingServices } = useFetch(getServices)
  const { data: products, loading: loadingProducts } = useFetch(getProducts)

  // vitrine: os marcados como destaque; sem nenhum marcado, os primeiros em estoque
  const inStock = products?.filter(isAvailable) ?? []
  const highlighted = inStock.filter((p) => p.destaque)
  const featured = (highlighted.length ? highlighted : inStock).slice(0, 4)

  const emergencia = buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h)
  // celular: produtos em linhas compactas (cards de 2 colunas dobram a altura)
  const grade = useMediaQuery('(min-width: 640px)')

  return (
    <PageWrapper>
      {/* ---------- Hero: a única entrada animada da página ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-7 px-4 pt-7 pb-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-16 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col items-start gap-5 lg:gap-6"
        >
          <h1 className="font-display text-display-lg font-semibold text-ink">
            Seu pet em boas mãos, <span className="text-terracotta-600">24h por dia</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-clay sm:text-lg">
            Petshop e clínica veterinária no centro de Tupã. Emergência a qualquer hora, consultas,
            banho e tosa e loja de produtos veterinários.
          </p>

          <div className="grid w-full grid-cols-1 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
            <Button to="/consultas" size="lg" className="w-full sm:w-auto">
              Agendar consulta
            </Button>
            <Button to="/agendamento" variant="outline" size="lg" className="w-full sm:w-auto">
              Agendar banho e tosa
            </Button>
          </div>

          <p className="text-sm text-clay">
            Emergência agora?{' '}
            <a
              href={emergencia}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-terracotta-600 underline underline-offset-4 hover:text-terracotta-700"
            >
              Chame o veterinário no WhatsApp
            </a>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="w-full"
        >
          {/* celular: faixa baixa; computador: o arco alto ao lado do título */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-terracotta-100 lg:rounded-arch lg:aspect-[4/5]">
            <img
              src={`${import.meta.env.BASE_URL}hero-dog.jpg`}
              alt="Cachorro beagle sorrindo"
              className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
            />
          </div>
        </motion.div>
      </section>

      {/* ---------- O que tem no Mercadog, com horário livre e preço de verdade ---------- */}
      <Oferta services={services} products={products} />

      {/* ---------- Banho e tosa ---------- */}
      <section aria-labelledby="banho-tosa" className="bg-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:gap-8 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <SectionHeading
              id="banho-tosa"
              title="Banho e tosa"
              subtitle="Escolha o serviço, o dia e o horário. Os valores variam pelo porte do pet."
              align="left"
            />
            <Link
              to="/agendamento"
              className="inline-flex min-h-11 shrink-0 items-center gap-1 font-semibold text-terracotta-600 underline-offset-4 hover:underline"
            >
              Ver horários livres
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {loadingServices ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            // celular: arrasta para o lado em vez de empilhar 3 cards altos
            <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {(services ?? []).map((service) => (
                <div key={service.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                  <ServiceCard
                    item={service}
                    price={cardPrice(service)}
                    // clique leva ao agendamento já com o serviço escolhido
                    onSelect={() => navigate('/agendamento', { state: { serviceId: service.id } })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Emergência: o bloco forte da página ---------- */}
      <section aria-labelledby="emergencia" className="bg-terracotta-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:gap-8 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:py-20">
          <div className="flex flex-col gap-4">
            <h2 id="emergencia" className="max-w-xl font-display text-display-md font-semibold">
              Emergência? A clínica atende 24 horas, todos os dias.
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-terracotta-100 sm:text-lg">
              Chame direto no WhatsApp do veterinário e diga o que está acontecendo. Se precisar vir,
              a gente já espera o seu pet.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <Button variant="whatsapp" size="lg" href={emergencia} className="w-full sm:w-auto">
              <WhatsAppIcon size={20} aria-hidden="true" />
              {formatTelefone(WHATSAPP_NUMBERS.veterinario)}
            </Button>
            <a href={`tel:+55${SITE.phone.replace(/\D/g, '')}`} className="inline-flex min-h-11 items-center text-sm text-terracotta-100 underline-offset-4 hover:underline">
              ou ligue: {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Loja ---------- */}
      <section aria-labelledby="loja">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:gap-8 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <SectionHeading
              id="loja"
              title="Loja"
              subtitle="Medicamentos e cuidados com orientação dos nossos veterinários. Monte o pedido e finalize pelo WhatsApp."
              align="left"
            />
            <Link
              to="/loja"
              className="inline-flex min-h-11 shrink-0 items-center gap-1 font-semibold text-terracotta-600 underline-offset-4 hover:underline"
            >
              Ver todos os produtos
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : grade ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <ul className="-mt-2 flex flex-col divide-y divide-sand">
              {featured.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ---------- Onde estamos + avaliações do Google ---------- */}
      <div className="border-t border-sand">
        <LocationSection />
      </div>
    </PageWrapper>
  )
}
