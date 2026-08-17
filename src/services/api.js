/**
 * Camada de serviços — única porta de entrada de dados para as páginas.
 *
 * O site não tem banco de dados: catálogo (serviços, consultas, produtos) e
 * agenda saem dos arquivos em `src/data/`, com um pequeno delay para simular
 * rede e exercitar os skeletons.
 *
 * Nada é gravado em lugar nenhum — pedido de agendamento e de produto viram
 * mensagem de WhatsApp, e o atendimento segue dali.
 */
import { SERVICES } from '../data/services'
import { CONSULTA_TYPES, VETS } from '../data/consultas'
import { PRODUCTS } from '../data/products'
import { generateSchedule } from '../data/schedule'

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getServices() {
  await delay(300)
  return SERVICES
}

export async function getConsultaTypes() {
  await delay(300)
  return CONSULTA_TYPES
}

export async function getVets() {
  await delay(200)
  return VETS
}

export async function getProducts() {
  await delay(600)
  return PRODUCTS
}

/** Horários exibidos por contexto ('servico' | 'consulta'). */
export async function getAvailableSlots(context) {
  await delay(500)
  return generateSchedule(context)
}
