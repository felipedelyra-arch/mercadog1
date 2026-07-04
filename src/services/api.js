/**
 * Camada de serviços — única porta de entrada de dados para as páginas.
 *
 * Hoje devolve mocks com um pequeno delay para simular rede (e exercitar os
 * skeletons). Quando o backend em Python existir, troque o corpo de cada
 * função por `fetch(`${API_BASE}/...`)` — as assinaturas já estão prontas
 * e nenhuma página precisa mudar.
 */
import { SERVICES } from '../data/services'
import { CONSULTA_TYPES, VETS } from '../data/consultas'
import { PRODUCTS } from '../data/products'
import { generateSchedule } from '../data/schedule'

// export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

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

/**
 * Horários disponíveis por contexto ('servico' | 'consulta').
 * O backend receberá também o id do serviço/consulta para agendas específicas.
 */
export async function getAvailableSlots(context) {
  await delay(500)
  return generateSchedule(context)
}

/**
 * Cria um agendamento (mock). O backend devolverá o registro persistido;
 * aqui devolvemos um protocolo fake para o feedback de sucesso.
 */
export async function createBooking(payload) {
  await delay(900)
  console.info('[mock] agendamento criado:', payload)
  return {
    ok: true,
    protocolo: `MD-${Date.now().toString(36).toUpperCase()}`,
  }
}
