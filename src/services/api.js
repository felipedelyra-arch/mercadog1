/**
 * Camada de serviços — única porta de entrada de dados para as páginas.
 *
 * Catálogo (serviços, consultas, produtos, agenda) ainda é mock com um pequeno
 * delay para simular rede e exercitar os skeletons.
 *
 * Agendamento é real: grava no Supabase via funções do banco. Nenhuma tabela
 * fica exposta ao cliente.
 */
import { SERVICES } from '../data/services'
import { CONSULTA_TYPES, VETS } from '../data/consultas'
import { PRODUCTS } from '../data/products'
import { generateSchedule } from '../data/schedule'
import { supabase, hasSupabase } from './supabase'

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

/** Monta o link de confirmação que a clínica vai abrir. */
const confirmUrl = (token) =>
  `${window.location.origin}${import.meta.env.BASE_URL}a/${token}`

/**
 * Grava o agendamento e devolve `{ ok, protocolo, link }`.
 * O `link` vai dentro da mensagem de WhatsApp — é por ele que a clínica
 * confirma. Sem chaves do Supabase cai no mock (link vazio).
 */
export async function createBooking(payload) {
  if (!hasSupabase) {
    await delay(900)
    console.info('[mock] agendamento criado:', payload)
    return { ok: true, protocolo: `MD-${Date.now().toString(36).toUpperCase()}`, link: null }
  }

  const { data, error } = await supabase.rpc('criar_agendamento', {
    p_tipo: payload.kind,
    p_item_id: payload.itemId,
    p_item_nome: payload.itemLabel,
    p_data_label: payload.day?.full ?? '',
    p_horario: payload.time ?? '',
    p_tutor: payload.tutor,
    p_telefone: payload.telefone,
    p_pet: payload.pet,
    p_porte: payload.porte || null,
    p_observacoes: payload.observacoes || null,
  })

  if (error) {
    console.error('[supabase] falha ao criar agendamento:', error)
    return { ok: false, erro: 'Não foi possível registrar o agendamento.' }
  }

  return { ok: true, protocolo: data.protocolo, link: confirmUrl(data.token) }
}

/** Dados do agendamento para a página de confirmação da clínica. */
export async function getBookingByToken(token) {
  if (!hasSupabase) return null
  const { data, error } = await supabase.rpc('buscar_agendamento', { p_token: token })
  if (error) {
    console.error('[supabase] falha ao buscar agendamento:', error)
    return null
  }
  return data
}

/**
 * Registra a resposta da clínica.
 * @param {string} token - token do link
 * @param {'confirmado'|'remarcar'} status
 * @param {string} pin - PIN da clínica (impede o tutor de confirmar sozinho)
 */
export async function respondBooking(token, status, pin) {
  if (!hasSupabase) return { ok: false, erro: 'Banco não configurado.' }
  const { data, error } = await supabase.rpc('responder_agendamento', {
    p_token: token,
    p_status: status,
    p_pin: pin,
  })
  if (error) {
    console.error('[supabase] falha ao responder agendamento:', error)
    return { ok: false, erro: 'Não foi possível registrar a resposta.' }
  }
  return data
}
