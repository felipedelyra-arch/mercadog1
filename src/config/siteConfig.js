/**
 * Dados da loja editáveis pelo painel (tabela `site_config`).
 *
 * `SITE` e `WHATSAPP_NUMBERS` continuam sendo os objetos que o site inteiro
 * lê; aqui eles são preenchidos com o que está no banco antes da primeira
 * renderização (ver main.jsx). Os valores escritos em site.js/whatsapp.js
 * ficam como reserva para quando o banco não responder.
 */
import { supabase } from '../lib/supabase'
import { formatTelefone } from '../utils/format'
import { SITE } from './site'
import { WHATSAPP_NUMBERS } from './whatsapp'

const CACHE_KEY = 'mercadog:site-config'

/** Campos de `SITE` que a equipe edita. */
export const CAMPOS_SITE = [
  'tagline',
  'address',
  'addressShort',
  'phone',
  'email',
  'hours',
  'instagram',
  'facebook',
  'linktree',
  'google',
]

/** Copia os dados do banco para os objetos que o site usa. */
export function applySiteConfig(dados) {
  if (!dados) return
  for (const campo of CAMPOS_SITE) {
    if (dados[campo] == null) continue
    // objeto (google) mescla: campo que o banco não tem continua com o valor de reserva
    const eObjeto = typeof dados[campo] === 'object' && !Array.isArray(dados[campo])
    SITE[campo] = eObjeto ? { ...SITE[campo], ...dados[campo] } : dados[campo]
  }
  if (dados.whatsapp) Object.assign(WHATSAPP_NUMBERS, dados.whatsapp)
  // o número do banho e tosa exibido na tela sai do próprio WhatsApp do setor
  SITE.phoneBanhoTosa = formatTelefone(WHATSAPP_NUMBERS.banhoTosa)
}

export function readCachedSiteConfig() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY))
  } catch {
    return null
  }
}

export function cacheSiteConfig(dados) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(dados))
  } catch {
    // sem storage (aba anônima bloqueada): só não guarda a cópia
  }
}

export async function fetchSiteConfig() {
  const { data, error } = await supabase.from('site_config').select('dados').eq('id', 1).maybeSingle()
  if (error) throw error
  return data?.dados ?? null
}
