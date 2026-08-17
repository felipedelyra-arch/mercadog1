/**
 * Horários de funcionamento — fonte única da agenda.
 *
 * É daqui que saem os dias e horários oferecidos no agendamento. Mexer neste
 * arquivo muda a agenda do site inteiro; nenhum horário fica solto no código.
 *
 * O site conhece o horário de funcionamento, não a ocupação da agenda: sem
 * banco de dados não há onde registrar que um horário já foi tomado. Quem
 * fecha a disponibilidade é a equipe, pelo WhatsApp.
 */

/**
 * Faixas de atendimento por dia da semana (0 = domingo … 6 = sábado).
 * `null` = fechado. Cada faixa é ['abre', 'fecha'] em formato 24h.
 * O intervalo do almoço aparece como duas faixas separadas.
 */
export const OPENING_HOURS = {
  /* Banho e tosa */
  servico: {
    0: null, // domingo — fechado
    1: [['08:00', '12:00'], ['13:30', '18:00']],
    2: [['08:00', '12:00'], ['13:30', '18:00']],
    3: [['08:00', '12:00'], ['13:30', '18:00']],
    4: [['08:00', '12:00'], ['13:30', '18:00']],
    5: [['08:00', '12:00'], ['13:30', '18:00']],
    6: [['08:00', '12:00']], // sábado — só de manhã
  },

  /* Consultas veterinárias agendadas.
     Urgência é outra porta: a clínica atende 24h e o contato é o botão
     direto de WhatsApp, que não passa por esta agenda. */
  consulta: {
    0: null,
    1: [['08:00', '12:00'], ['13:30', '19:00']],
    2: [['08:00', '12:00'], ['13:30', '19:00']],
    3: [['08:00', '12:00'], ['13:30', '19:00']],
    4: [['08:00', '12:00'], ['13:30', '19:00']],
    5: [['08:00', '12:00'], ['13:30', '19:00']],
    6: [['08:00', '12:00']],
  },
}

/** Duração de cada atendimento, em minutos — define o passo entre horários. */
export const SLOT_MINUTES = {
  servico: 45,
  consulta: 30,
}

/**
 * Antecedência mínima: horário que cai dentro desta janela não é oferecido.
 * Evita alguém pedir 14h faltando cinco minutos para as 14h.
 */
export const MIN_LEAD_MINUTES = 90

/** Quantos dias abertos a agenda mostra de uma vez. */
export const OPEN_DAYS_SHOWN = 10

/**
 * Datas sem atendimento, no formato 'AAAA-MM-DD' (feriados, recesso, reforma).
 * Mantenha atualizado — o dia some da agenda automaticamente.
 */
export const CLOSED_DATES = [
  // '2026-12-25',
]
