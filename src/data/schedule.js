/**
 * Geração da agenda a partir do horário de funcionamento real.
 *
 * Os dias e horários saem de `src/config/hours.js` — nada é sorteado. O que
 * o site NÃO sabe é quais horários já foram tomados por outro cliente: sem
 * banco de dados não há onde registrar isso. Por isso a tela deixa claro que
 * o horário é um pedido, e a equipe confirma pelo WhatsApp.
 */
import {
  CLOSED_DATES,
  MIN_LEAD_MINUTES,
  OPENING_HOURS,
  OPEN_DAYS_SHOWN,
  SLOT_MINUTES,
} from '../config/hours'

const WEEKDAY_FMT = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const DAY_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const FULL_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/**
 * Data local em 'AAAA-MM-DD'.
 * Não use `toISOString()`: ele converte para UTC e, à noite no Brasil (UTC-3),
 * devolve o dia seguinte — a agenda apareceria deslocada em um dia.
 */
const isoLocal = (date) => {
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mes}-${dia}`
}

/** 'HH:MM' para minutos desde a meia-noite. */
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Minutos desde a meia-noite para 'HH:MM'. */
const toLabel = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/**
 * Horários de um dia, a partir das faixas de funcionamento.
 * O último horário começa cedo o bastante para o atendimento terminar dentro
 * da faixa — não oferece 17:45 se a faixa fecha às 18h e o serviço leva 45min.
 */
function slotsForRanges(ranges, stepMinutes, minStartMinutes) {
  const slots = []
  for (const [abre, fecha] of ranges) {
    const inicio = toMinutes(abre)
    const fim = toMinutes(fecha)
    for (let t = inicio; t + stepMinutes <= fim; t += stepMinutes) {
      if (t >= minStartMinutes) slots.push(toLabel(t))
    }
  }
  return slots
}

/**
 * Próximos dias abertos com seus horários.
 * @param {'servico'|'consulta'} context - agenda de banho/tosa ou de consultas
 * @param {number} count - quantos dias abertos devolver
 */
export function generateSchedule(context = 'servico', count = OPEN_DAYS_SHOWN) {
  const semana = OPENING_HOURS[context] ?? OPENING_HOURS.servico
  const passo = SLOT_MINUTES[context] ?? 30

  const agora = new Date()
  const hojeIso = isoLocal(agora)
  // horário mais cedo que ainda pode ser pedido hoje
  const corteHoje = agora.getHours() * 60 + agora.getMinutes() + MIN_LEAD_MINUTES

  const days = []
  const cursor = new Date(agora)
  // limite de segurança: se tudo estiver fechado, para em 60 dias em vez de girar sem fim
  const ultimoDia = new Date(agora)
  ultimoDia.setDate(ultimoDia.getDate() + 60)

  while (days.length < count && cursor <= ultimoDia) {
    const iso = isoLocal(cursor)
    const faixas = semana[cursor.getDay()]
    const aberto = faixas && !CLOSED_DATES.includes(iso)

    if (aberto) {
      const slots = slotsForRanges(faixas, passo, iso === hojeIso ? corteHoje : 0)
      // dia sem horário restante (fim de tarde de hoje, por exemplo) não entra
      if (slots.length > 0) {
        days.push({
          iso,
          weekday: WEEKDAY_FMT.format(cursor).replace('.', ''),
          label: DAY_FMT.format(cursor).replace('.', ''),
          full: FULL_FMT.format(cursor),
          slots,
        })
      }
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}
