import { motion } from 'framer-motion'
import { Bath, Beef, Pill, Stethoscope, Tag, Truck } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import { fadeUp, staggerContainer, viewportProps } from '../animations/variants'

/** Grid de tudo que a casa oferece (inspiração PetsStar), no nosso visual. */
const FEATURES = [
  {
    icon: Bath,
    title: 'Banho e Tosa',
    text: 'Banho relaxante e tosa com acabamento cuidadoso, do porte pequeno ao grande.',
  },
  {
    icon: Truck,
    title: 'Leva e Traz',
    text: 'Buscamos e devolvemos o seu pet em casa com segurança e conforto.',
  },
  {
    icon: Beef,
    title: 'Alimentação',
    text: 'Rações premium e dietas específicas com orientação de quem entende.',
  },
  {
    icon: Tag,
    title: 'Acessórios',
    text: 'Coleiras, caminhas, brinquedos e tudo para o dia a dia do seu pet.',
  },
  {
    icon: Pill,
    title: 'Farmácia',
    text: 'Medicamentos e produtos de saúde com orientação veterinária.',
  },
  {
    icon: Stethoscope,
    title: 'Veterinário 24h',
    text: 'Clínica completa: consultas, vacinas, cirurgias e ortopedia especializada.',
  },
]

export default function Features() {
  return (
    <section aria-label="Tudo que oferecemos" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Mercadog"
        title="Tudo para o seu pet num só lugar"
        subtitle="Petshop e clínica veterinária moderna, pronta para atender de consultas e exames a banho e acessórios."
      />
      <motion.div
        variants={staggerContainer}
        {...viewportProps}
        className="mt-10 grid gap-x-8 gap-y-7 sm:mt-12 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3"
      >
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <motion.div key={title} variants={fadeUp} className="group flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-arch bg-terracotta-100 text-terracotta-600 transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-108 motion-reduce:transition-none">
              <Icon size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[1.0625rem] font-semibold text-ink sm:text-lg">
                {title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-clay">{text}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
