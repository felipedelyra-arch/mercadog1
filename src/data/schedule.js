/**
 * Geração de agenda mockada.
 * Disponibilidade pseudo-aleatória mas DETERMINÍSTICA (seed = data + horário),
 * para os mesmos horários aparecerem ocupados entre renders e recarregamentos.
 */
const SLOT_TIMES = [
  '09:00', '09:45', '10:30', '11:15',
  '13:30', '14:15', '15:00', '15:45', '16:30', '17:15',
]

/** Hash simples e estável de string para número (0 a 1). */
function seededRandom(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash % 1000) / 1000
}

const WEEKDAY_FMT = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const DAY_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const FULL_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * Próximos `count` dias com horários disponíveis (atendimento todos os dias).
 * `context` diferencia a agenda de banho/tosa da agenda de consultas.
 */
export function generateSchedule(context = 'servico', count = 7) {
  const days = []
  const cursor = new Date()
  cursor.setDate(cursor.getDate() + 1) // agenda abre no dia seguinte

  while (days.length < count) {
    const iso = cursor.toISOString().slice(0, 10)
    const slots = SLOT_TIMES.filter(
      (time) => seededRandom(`${context}-${iso}-${time}`) > 0.35,
    )
    days.push({
      iso,
      weekday: WEEKDAY_FMT.format(cursor).replace('.', ''),
      label: DAY_FMT.format(cursor).replace('.', ''),
      full: FULL_FMT.format(cursor),
      slots,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}
