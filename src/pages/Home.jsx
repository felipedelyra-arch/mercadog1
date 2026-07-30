import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bone, Heart, PawPrint, ShoppingBag, Stethoscope } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import Marquee from '../components/ui/Marquee'
import WaveDivider from '../components/ui/WaveDivider'
import Features from '../components/Features'
import QuickActions from '../components/QuickActions'
import TopActions from '../components/TopActions'
import Testimonials from '../components/Testimonials'
import LocationSection from '../components/LocationSection'
import SectionHeading from '../components/ui/SectionHeading'
import ServiceCard from '../components/ServiceCard'
import ProductCard from '../components/ProductCard'
import { CardSkeleton } from '../components/ui/Skeleton'
import {
  fadeUp,
  staggerContainer,
  viewportProps,
  wordsContainer,
  wordUp,
  EASE,
} from '../animations/variants'
import { useFetch } from '../hooks/useFetch'
import { getProducts, getServices } from '../services/api'
import { minPrice } from '../data/services'
import { WHATSAPP_NUMBERS, WHATSAPP_MESSAGES, buildWhatsAppUrl } from '../config/whatsapp'

/** Headline do hero: cada palavra sobe de trás de uma máscara. */
const HEADLINE = [
  { text: 'Seu' },
  { text: 'pet' },
  { text: 'em' },
  { text: 'boas' },
  { text: 'mãos,' },
  { text: '24h', accent: true },
  { text: 'por', accent: true },
  { text: 'dia', accent: true },
]

/** Ícone flutuando suavemente no painel do hero (desliga com reduced motion via MotionConfig). */
function FloatingIcon({ icon: Icon, className, delay = 0, duration = 4 }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`absolute grid place-items-center rounded-full bg-white text-terracotta-500 shadow-warm ${className}`}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Icon size={22} />
    </motion.span>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { data: services, loading: loadingServices } = useFetch(getServices)
  const { data: products, loading: loadingProducts } = useFetch(getProducts)

  const featured = products?.filter((p) => p.destaque).slice(0, 4) ?? []

  // Parallax sutil do painel do hero conforme o scroll
  const { scrollY } = useScroll()
  const panelY = useTransform(scrollY, [0, 600], [0, 50])
  const iconsY = useTransform(scrollY, [0, 600], [0, -36])

  return (
    <PageWrapper>
      {/* Atalhos no topo: emergência e serviços a um toque, sem precisar rolar */}
      <TopActions />

      {/* ---------- Hero (compacto, com brilho de fundo) ---------- */}
      <section className="bg-glow mx-auto grid max-w-6xl items-center gap-8 px-4 pt-8 pb-14 sm:px-6 lg:grid-cols-2 lg:pt-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-5"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta-100 px-4 py-1.5 text-sm font-bold text-terracotta-600"
          >
            <PawPrint size={16} aria-hidden="true" />
            Petshop &amp; clínica veterinária 24h
          </motion.span>

          <motion.h1
            variants={wordsContainer}
            className="font-display text-3xl leading-[1.15] font-semibold text-ink sm:text-4xl lg:text-5xl"
          >
            {HEADLINE.map(({ text, accent }, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  variants={wordUp}
                  className={`inline-block ${accent ? 'text-gradient' : ''}`}
                >
                  {text}
                </motion.span>
                {i < HEADLINE.length - 1 && <span>&nbsp;</span>}
              </span>
            ))}
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-md text-base text-clay sm:text-lg">
            Emergência, consultas, banho e tosa e loja completa — tudo pelo WhatsApp.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-2 flex flex-wrap gap-3">
            {/* CTA principal leva direto às consultas veterinárias */}
            <Button to="/consultas" size="lg">
              Agendar serviço
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button to="/loja" variant="outline" size="lg">
              <ShoppingBag size={18} aria-hidden="true" />
              Ver produtos
            </Button>
          </motion.div>

          {/* Prova social rápida: números que dão confiança de bater o olho */}
          <motion.dl
            variants={fadeUp}
            className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-sand pt-4"
          >
            {[
              ['24h', 'emergência todos os dias'],
              ['+5 mil', 'pets já atendidos'],
              ['4.9★', 'avaliação dos tutores'],
            ].map(([num, label]) => (
              <div key={label}>
                <dt className="font-display text-xl font-semibold text-terracotta-600">{num}</dt>
                <dd className="text-xs text-clay">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Painel visual do hero: arco (porta de casinha) com ícones flutuantes e parallax */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          style={{ y: panelY }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="rounded-arch relative flex aspect-square items-end justify-center overflow-hidden bg-terracotta-100">
            {/* Foto real dentro do arco — assinatura visual da casa */}
            <img
              src={`${import.meta.env.BASE_URL}hero-dog.jpg`}
              alt="Cachorro beagle sorrindo"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Faixa inferior tipo "porta" */}
            <div className="relative z-10 w-full bg-terracotta-500/95 px-6 py-5 text-center backdrop-blur-sm">
              <p className="font-display text-lg font-semibold text-white">
                Seu pet em boas mãos
              </p>
              <p className="text-sm text-terracotta-100">desde a primeira patinha</p>
            </div>
          </div>
          <motion.div
            style={{ y: iconsY }}
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <FloatingIcon icon={Bone} className="top-10 -left-3 size-12" delay={0.3} />
            <FloatingIcon icon={Heart} className="top-1/3 -right-4 size-14" delay={1} duration={5} />
            <FloatingIcon icon={Stethoscope} className="bottom-24 -left-5 size-14" delay={1.8} duration={4.5} />
          </motion.div>
        </motion.div>
      </section>

      {/* Faixa em loop com os serviços da casa */}
      <Marquee />

      {/* Tudo que a casa oferece (grid inspirado no PetsStar) */}
      <Features />

      {/* ---------- Serviços ---------- */}
      {/* Onda orgânica: transição branco → creme */}
      <div className="text-cream">
        <WaveDivider />
      </div>
      <section className="bg-cream pt-12 pb-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
          <SectionHeading
            eyebrow="Serviços"
            title="Dia de spa, sem estresse"
            subtitle="Escolha o serviço, o dia e o horário — a gente cuida do resto."
          />
          {loadingServices ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              {...viewportProps}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  item={service}
                  price={{ from: minPrice(service) }}
                  // clique leva ao agendamento já com o serviço escolhido
                  onSelect={() => navigate('/agendamento', { state: { serviceId: service.id } })}
                />
              ))}
            </motion.div>
          )}
          <motion.div variants={fadeUp} {...viewportProps} className="text-center">
            <Button to="/agendamento" variant="outline">
              Agendar agora
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Fecha a seção creme com a onda invertida */}
      <div className="rotate-180 text-cream">
        <WaveDivider />
      </div>

      {/* ---------- Emergência 24h (CTA) ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          variants={fadeUp}
          {...viewportProps}
          className="flex flex-col items-center gap-6 rounded-card bg-terracotta-500 px-6 py-12 text-center shadow-warm-lg sm:px-12"
        >
          <span className="grid size-14 place-items-center rounded-arch bg-white/15 text-white">
            <Stethoscope size={28} aria-hidden="true" />
          </span>
          <h2 className="max-w-lg font-display text-3xl font-semibold text-white">
            Emergência? Atendemos 24 horas, todos os dias
          </h2>
          <p className="max-w-md text-terracotta-100">
            Consultas, vacinas, cirurgias e ortopedia especializada com o Dr. Wilson.
            Em caso de urgência, chame direto no WhatsApp — sem espera.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="whatsapp"
              href={buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h)}
            >
              Emergência 24h no WhatsApp
            </Button>
            <Button to="/consultas" className="bg-white !text-terracotta-600 hover:bg-terracotta-50">
              Ver consultas disponíveis
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ---------- Depoimentos ---------- */}
      <Testimonials />

      {/* ---------- Produtos populares ---------- */}
      <div className="text-cream">
        <WaveDivider />
      </div>
      <section className="bg-cream pt-12 pb-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
          <SectionHeading
            eyebrow="Loja"
            title="Os favoritos da vizinhança"
            subtitle="Ração, brinquedos e acessórios que os pets aprovam."
          />
          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              {...viewportProps}
              className="grid grid-cols-2 gap-5 lg:grid-cols-4"
            >
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}
          <motion.div variants={fadeUp} {...viewportProps} className="text-center">
            <Button to="/loja" variant="outline">
              Ver toda a loja
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Fecha a seção creme */}
      <div className="rotate-180 text-cream">
        <WaveDivider />
      </div>

      {/* ---------- Localidade ---------- */}
      <LocationSection />

      {/* Acesso rápido (estilo linktree oficial) — reforço no fim da página */}
      <QuickActions />
    </PageWrapper>
  )
}
