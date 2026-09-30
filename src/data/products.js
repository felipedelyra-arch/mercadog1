/**
 * Helpers do catálogo da loja.
 *
 * Os produtos e categorias vivem no Supabase (tabelas `produtos` e
 * `categorias`, ver supabase/schema.sql) e chegam pelas funções de
 * src/services/api.js. Aqui ficam só as regras de exibição.
 *
 * Campos de um produto:
 * - `preco`      número em reais, ou null → "Sob consulta"
 * - `detalhes`   apresentação ("c/ 10 comp", "30 ml") ou null
 * - `destaque`   true põe o selo "Popular" e leva para a vitrine da Home
 * - `disponivel` false barra o pedido e mostra "Sem estoque"
 * - `image`      caminho no bucket "produtos" ou URL externa; null → ícone da categoria
 * - `categorias` { label, icon } da categoria, vindo do join da consulta
 */
import { PRODUCTS_BUCKET, supabase } from '../lib/supabase'

/**
 * Resolve a URL da foto do produto.
 * Link externo passa direto; caminho vira a URL pública do bucket.
 */
export const productImageUrl = (image) => {
  if (!image) return null
  if (/^https?:\/\//.test(image)) return image
  return supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(image.replace(/^\//, '')).data
    .publicUrl
}

/** Produto sem `disponivel: false` é considerado em estoque. */
export const isAvailable = (product) => product.disponivel !== false

/** Nome + apresentação, usado no card e na mensagem do WhatsApp. */
export const productFullName = (product) =>
  product.detalhes ? `${product.nome} (${product.detalhes})` : product.nome
