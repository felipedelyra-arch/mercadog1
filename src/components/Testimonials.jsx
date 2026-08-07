import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import { fadeUp, staggerContainer, viewportProps } from '../animations/variants'

/** Depoimentos de quem já passou pelo Mercadog. */
const TESTIMONIALS = [
  {
    name: 'Mariana S.',
    pet: 'tutora da Mel (shih-tzu)',
    text: 'Levei a Mel numa emergência de madrugada e o Dr. Wilson atendeu na hora. Cuidado e atenção do começo ao fim.',
  },
  {
    name: 'Carlos A.',
    pet: 'tutor do Thor (labrador)',
    text: 'O Thor passou por uma cirurgia ortopédica e a recuperação foi perfeita. Equipe atenciosa que explica tudo com calma.',
  },
  {
    name: 'Fernanda L.',
    pet: 'tutora da Nina (vira-lata)',
    text: 'Banho e tosa impecáveis, e a Nina volta sempre feliz. Ainda aproveito para comprar a ração no mesmo lugar.',
  },
]

export default function Testimonials() {
  return (
    <section aria-label="Depoimentos" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Depoimentos"
        title="Quem já passou por aqui"
        subtitle="Histórias reais de tutores que confiam no Mercadog."
      />
      <motion.div
        variants={staggerContainer}
        {...viewportProps}
        className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
      >
        {TESTIMONIALS.map(({ name, pet, text }) => (
          <motion.figure
            key={name}
            variants={fadeUp}
            className="flex flex-col gap-3.5 rounded-card border border-sand bg-white p-5 shadow-warm sm:p-6"
          >
            <Quote size={22} className="text-terracotta-300" aria-hidden="true" />
            <blockquote className="flex-1 text-sm leading-relaxed text-clay">“{text}”</blockquote>
            <figcaption className="flex items-center gap-3 border-t border-sand pt-3.5">
              {/* Avatar com as iniciais do tutor */}
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-terracotta-100 font-display text-sm font-semibold text-terracotta-600"
              >
                {name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </span>
              <span>
                <span className="flex gap-0.5 text-terracotta-500" aria-label="5 de 5 estrelas">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={12} fill="currentColor" aria-hidden="true" />
                  ))}
                </span>
                <span className="block font-display text-sm font-semibold text-ink">{name}</span>
                <span className="block text-xs text-clay">{pet}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  )
}
