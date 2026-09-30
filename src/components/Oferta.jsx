import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './ui/SectionHeading'
import WhatsAppIcon from './ui/WhatsAppIcon'
import { useFetch } from '../hooks/useFetch'
import { getAvailableSlots } from '../services/api'
import { isoLocal } from '../data/schedule'
import { isAvailable } from '../data/products'
import { minPrice } from '../data/services'
import { WHATSAPP_MESSAGES, WHATSAPP_NUMBERS, buildWhatsAppUrl } from '../config/whatsapp'
import { formatPrice } from '../utils/format'

/** "hoje às 14:00", "amanhã às 08:00" ou "sex, 02 de out às 09:30". */
function proximoHorario(dias) {
  const dia = dias?.[0]
  if (!dia) return null
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(hoje.getDate() + 1)
  const quando =
    dia.iso === isoLocal(hoje) ? 'hoje' : dia.iso === isoLocal(amanha) ? 'amanhã' : `${dia.weekday}, ${dia.label}`
  return `${quando} às ${dia.slots[0]}`
}

/**
 * O que a casa oferece, com um dado vivo em cada linha: próximo horário
 * livre, preço inicial, quantos produtos há na loja. É o que diferencia
 * do "somos completos" genérico — e ajuda a decidir sem abrir outra página.
 */
export default function Oferta({ services, products }) {
  const { data: diasConsulta } = useFetch(() => getAvailableSlots('consulta'))
  const { data: diasBanho } = useFetch(() => getAvailableSlots('servico'))

  const precos = (services ?? []).map(minPrice).filter((v) => v != null)
  const precoBanho = precos.length ? Math.min(...precos) : null
  const emEstoque = products?.filter(isAvailable).length
  const proxConsulta = proximoHorario(diasConsulta)
  const proxBanho = proximoHorario(diasBanho)

  const linhas = [
    {
      titulo: 'Clínica veterinária 24h',
      texto: 'Emergência a qualquer hora, todos os dias, com o Dr. Wilson.',
      rotulo: 'Agora',
      fato: 'Atendendo',
      aoVivo: true,
      acao: 'Chamar no WhatsApp',
      href: buildWhatsAppUrl(WHATSAPP_NUMBERS.veterinario, WHATSAPP_MESSAGES.clinica24h),
    },
    {
      titulo: 'Consultas e ortopedia',
      texto: 'Consulta com hora marcada. Exames, vacinas e cirurgias são indicados na avaliação.',
      rotulo: 'Próximo horário livre',
      fato: proxConsulta,
      acao: 'Agendar consulta',
      to: '/consultas',
    },
    {
      titulo: 'Banho e tosa',
      texto: 'Do porte pequeno ao grande, com o horário escolhido por você.',
      rotulo: precoBanho != null ? `A partir de ${formatPrice(precoBanho)}` : 'Próximo horário livre',
      fato: proxBanho,
      acao: 'Agendar banho e tosa',
      to: '/agendamento',
    },
    {
      titulo: 'Loja',
      texto: 'Antipulgas, antibióticos, suplementos e mais. Peça pelo site e retire ou receba em casa.',
      rotulo: 'Na loja hoje',
      fato: emEstoque ? `${emEstoque} produtos` : null,
      acao: 'Ver a loja',
      to: '/loja',
    },
    {
      titulo: 'Leva e traz',
      texto: 'Buscamos e devolvemos o seu pet em casa.',
      rotulo: 'Como funciona',
      fato: 'Combine pelo WhatsApp',
      acao: 'Combinar no WhatsApp',
      href: buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, WHATSAPP_MESSAGES.geral),
    },
  ]

  return (
    <section aria-labelledby="oferta" className="border-t border-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:gap-10 sm:px-6 lg:py-20">
        <div className="grid gap-2 sm:gap-4 lg:grid-cols-2 lg:items-end lg:gap-16">
          <SectionHeading id="oferta" title="Tudo num endereço só" align="left" />
          <p className="max-w-lg text-base leading-relaxed text-clay sm:text-lg">
            Clínica, banho e tosa e loja na mesma casa, no centro de Tupã. Veja o que está livre agora e já
            resolva por aqui.
          </p>
        </div>

        <ul className="flex flex-col border-y border-sand">
          {linhas.map((l) => {
            const externo = Boolean(l.href)
            const classes =
              'group -mx-3 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-tile px-3 py-4 transition-colors hover:bg-cream focus-visible:bg-cream sm:-mx-4 sm:px-4 sm:py-6 lg:grid-cols-[1.35fr_1fr_auto] lg:gap-x-8'
            const conteudo = (
              <>
                <span className="col-start-1 flex flex-col gap-1.5">
                  <span className="font-display text-xl font-semibold text-ink sm:text-2xl">{l.titulo}</span>
                  <span className="hidden max-w-md text-clay sm:block">{l.texto}</span>
                </span>

                <span className="col-start-1 flex flex-wrap items-baseline gap-x-2 lg:col-start-2 lg:row-start-1 lg:flex-col lg:gap-0.5">
                  <span className="text-sm text-clay">{l.rotulo}</span>
                  <span className="flex items-center gap-2 font-semibold text-ink lg:text-lg">
                    {l.aoVivo && (
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-whatsapp ring-4 ring-whatsapp/15" />
                    )}
                    {l.fato ?? '—'}
                  </span>
                </span>

                <span className="col-start-2 row-span-2 row-start-1 inline-flex items-center font-semibold text-terracotta-600 lg:col-start-3 lg:row-span-1">
                  <span className="sr-only">{l.acao}</span>
                  <span
                    aria-hidden="true"
                    className="grid size-11 place-items-center rounded-full border border-terracotta-200 text-terracotta-600 transition-colors group-hover:border-terracotta-500 group-hover:bg-terracotta-500 group-hover:text-white"
                  >
                    {externo ? <WhatsAppIcon size={18} /> : <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
                  </span>
                </span>
              </>
            )
            return (
              <li key={l.titulo} className="border-t border-sand first:border-t-0">
                {externo ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className={classes}>
                    {conteudo}
                  </a>
                ) : (
                  <Link to={l.to} className={classes}>
                    {conteudo}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
