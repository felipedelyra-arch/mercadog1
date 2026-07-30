/**
 * Cliente Supabase — único ponto de conexão com o banco.
 *
 * As chaves ficam em `.env.local` (VITE_SUPABASE_URL e
 * VITE_SUPABASE_PUBLISHABLE_KEY). Sem elas o cliente fica nulo e a camada de
 * serviços cai no modo mock, então o site continua funcionando em qualquer
 * ambiente — só não persiste agendamento.
 *
 * A publishable key é pública por natureza: nenhuma tabela é exposta ao
 * cliente. Todo acesso passa pelas funções `criar_agendamento`,
 * `buscar_agendamento` e `responder_agendamento`.
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key) : null

/** `false` quando as chaves não estão configuradas (dev sem .env.local). */
export const hasSupabase = Boolean(supabase)
