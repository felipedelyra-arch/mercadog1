/**
 * Geração da agenda a partir da configuração que a equipe mantém no painel
 * (tabelas `agenda_config` e `agenda_bloqueios`, lidas por agenda_publica).
 *
 * A regra é a mesma que o banco aplica no criar_pedido
 * (motivo_horario_invalido em supabase/004_agenda.sql): se mudar aqui,
 * mude lá — senão o site oferece um horário que o banco recusa.
 */

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
export const isoLocal = (date) => {
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mes}-${dia}`
}

/** 'AAAA-MM-DD' → Date ao meio-dia local (imune a horário de verão). */
export const fromIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** 'HH:MM' para minutos desde a meia-noite. */
export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Minutos desde a meia-noite para 'HH:MM'. */
export const toLabel = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/**
 * Todos os horários de um dia pela grade, sem olhar ocupação nem antecedência.
 * O último começa cedo o bastante para terminar dentro da faixa — não oferece
 * 17:45 se a faixa fecha às 18h e o atendimento leva 45min.
 */
export function slotsDoDia(config, iso) {
  const faixas = config.semana[String(fromIso(iso).getDay())]
  if (!faixas) return []
  const slots = []
  for (const [abre, fecha] of faixas) {
    const inicio = toMinutes(abre)
    const fim = toMinutes(fecha)
    for (let t = inicio; t + config.slot_minutos <= fim; t += config.slot_minutos) {
      slots.push(toLabel(t))
    }
  }
  return slots
}

/** Descrição do dia usada nos seletores. */
export const describeDay = (iso) => {
  const date = fromIso(iso)
  return {
    iso,
    weekday: WEEKDAY_FMT.format(date).replace('.', ''),
    label: DAY_FMT.format(date).replace('.', ''),
    full: FULL_FMT.format(date),
  }
}

/**
 * Próximos dias abertos com os horários que ainda podem ser pedidos.
 * @param {{ agora: string, config: object, bloqueios: Array, ocupados: Array }} agenda
 *   resposta de agenda_publica — `agora` é a hora local da loja, vinda do banco,
 *   para o relógio errado de um celular não abrir nem esconder horários.
 */
export function generateSchedule({ agora, config, bloqueios, ocupados }) {
  const [hojeIso, horaAgora] = agora.split('T')
  const corteHoje = toMinutes(horaAgora) + config.antecedencia_minutos
  const diaFechado = new Set(bloqueios.filter((b) => !b.horario).map((b) => b.data))
  const indisponivel = new Set(
    [...bloqueios.filter((b) => b.horario), ...ocupados].map((b) => `${b.data} ${b.horario}`),
  )

  const days = []
  const cursor = fromIso(hojeIso)
  // limite de segurança: se tudo estiver fechado, para em 60 dias em vez de girar sem fim
  for (let i = 0; i < 60 && days.length < config.dias_exibidos; i++) {
    const iso = isoLocal(cursor)
    cursor.setDate(cursor.getDate() + 1)
    if (diaFechado.has(iso)) continue

    // antecedência pode passar da meia-noite: 22h + 12h de antecedência corta a manhã seguinte
    const corte = corteHoje - i * 24 * 60
    const slots = slotsDoDia(config, iso).filter(
      (t) => toMinutes(t) >= corte && !indisponivel.has(`${iso} ${t}`),
    )
    // dia sem horário restante (fim de tarde de hoje, por exemplo) não entra
    if (slots.length > 0) days.push({ ...describeDay(iso), slots })
  }

  return days
}
