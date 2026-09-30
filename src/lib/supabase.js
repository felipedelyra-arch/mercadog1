import { createClient } from '@supabase/supabase-js'

/**
 * Cliente único do Supabase.
 * URL e chave "anon" são públicas por design — quem protege os dados são as
 * policies de RLS (supabase/schema.sql). Nunca coloque a service_role aqui.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes — veja .env.example',
  )
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing')

/** Bucket público com as fotos dos produtos. */
export const PRODUCTS_BUCKET = 'produtos'
