import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bone, Heart, PawPrint, ShieldCheck, ShoppingBag, Star, Stethoscope } from 'lucide-react'
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
      <section className="bg-glow mx-auto grid max-w-6xl items-center gap-9 px-4 pt-8 pb-14 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pt-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-5"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-terracotta-200/70 bg-terracotta-50 px-3.5 py-1.5 text-[0.8125rem] font-bold text-terracotta-600 sm:text-sm"
          >
            <PawPrint size={15} aria-hidden="true" />
            Petshop &amp; clínica veterinária 24h
          </motion.span>

          <motion.h1
            variants={wordsContainer}
            className="font-display text-display-lg font-semibold text-ink"
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

          <motion.p variants={fadeUp} className="max-w-md text-base leading-relaxed text-clay sm:text-lg">
            Emergência, consultas, banho e tosa e loja completa — tudo pelo WhatsApp.
          </motion.p>

          {/* CTAs: no celular ocupam a largura toda (alvo grande, sem erro de toque) */}
          <motion.div
            variants={fadeUp}
            className="mt-1 grid w-full grid-cols-1 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-3"
          >
            {/* CTA principal leva direto às consultas veterinárias */}
            <Button to="/consultas" size="lg" className="w-full sm:w-auto">
              Agendar serviço
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button to="/loja" variant="outline" size="lg" className="w-full sm:w-auto">
              <ShoppingBag size={18} aria-hidden="true" />
              Ver produtos
            </Button>
          </motion.div>

          {/* Prova social rápida: números que dão confiança de bater o olho */}
          <motion.dl
            variants={fadeUp}
            className="mt-3 grid w-full grid-cols-3 gap-3 border-t border-sand pt-5"
          >
            {[
              { num: '24h', label: 'emergência todos os dias', icon: null, filled: false },
              { num: '+5 mil', label: 'pets já atendidos', icon: ShieldCheck, filled: false },
              { num: '4,9', label: 'avaliação dos tutores', icon: Star, filled: true },
            ].map(({ num, label, icon: Icon, filled }) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 font-display text-xl font-semibold text-terracotta-600">
                  {num}
                  {Icon && (
                    <Icon
                      size={15}
                      aria-hidden="true"
                      {...(filled ? { fill: 'currentColor', strokeWidth: 0 } : { strokeWidth: 2.2 })}
                    />
                  )}
                </dt>
                <dd className="mt-0.5 text-xs leading-snug text-clay">{label}</dd>
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
          className="relative mx-auto w-full max-w-[19rem] sm:max-w-sm"
        >
          <div className="rounded-arch relative flex aspect-square items-end justify-center overflow-hidden bg-terracotta-100 shadow-warm-lg ring-1 ring-terracotta-200/60">
            {/* Foto real dentro do arco — assinatura visual da casa */}
            <img
              src={`${import.meta.env.BASE_URL}hero-dog.jpg`}
              alt="Cachorro beagle sorrindo"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Faixa inferior tipo "porta" */}
            <div className="relative z-10 w-full bg-terracotta-600/95 px-5 py-4 text-center backdrop-blur-sm sm:px-6 sm:py-5">
              <p className="font-display text-base font-semibold text-white sm:text-lg">
                Seu pet em boas mãos
              </p>
              <p className="mt-0.5 text-xs text-terracotta-100 sm:text-sm">
                desde a primeira patinha
              </p>
            </div>
          </div>
          {/* Ícones flutuantes: decorativos, ficam fora do fluxo e escondidos
              no celular para não gerar rolagem lateral em telas estreitas. */}
          <motion.div
            style={{ y: iconsY }}
            className="pointer-events-none absolute inset-0 hidden sm:block"
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
          className="relative flex flex-col items-center gap-5 overflow-hidden rounded-panel bg-terracotta-600 px-5 py-11 text-center shadow-warm-lg sm:px-12 sm:py-14"
        >
          {/* Textura sutil: dá profundidade ao painel sem competir com o texto */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(255,255,255,0.16),transparent_60%)]"
          />
          <span className="relative grid size-14 place-items-center rounded-arch bg-white/15 text-white">
            <Stethoscope size={28} aria-hidden="true" />
          </span>
          <h2 className="relative max-w-lg font-display text-display-md font-semibold text-white">
            Emergência? Atendemos 24 horas, todos os dias
          </h2>
          <p className="relative max-w-md text-sm leading-relaxed text-terracotta-100 sm:text-base">
            Consultas, vacinas, cirurgias e ortopedia especializada com o Dr. Wilson.
            Em caso de urgência, chame direto no WhatsApp — sem espera.
          </p>
          <div className="relative mt-1 grid w-full grid-cols-1 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:justify-center sm:gap-3">
            <Button
              variant="whatsapp"
              className="w-full sm:w-auto"
              href={buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h)}
            >
              Emergência 24h no WhatsApp
            </Button>
            <Button
              to="/consultas"
              className="w-full !bg-white !text-terracotta-600 hover:!bg-terracotta-50 sm:w-auto"
            >
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
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              {...viewportProps}
              className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4"
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
