/**
 * Converte a planilha de produtos (CSV) em supabase/seed.sql.
 *
 *   node scripts/gerar-seed.mjs tabela_produtos_veterinarios.csv
 *
 * Depois é só colar o seed.sql no SQL Editor do Supabase e rodar.
 * O seed APAGA os produtos existentes e recria tudo a partir da planilha —
 * use só na carga inicial, não depois que a equipe começar a editar pelo site.
 *
 * A planilha tem o preço em colunas diferentes conforme a seção
 * (DETALHES, ENTRADAS ou SAÍDAS): pegamos o primeiro valor que parece
 * dinheiro. Sem nenhum, o produto entra como "sob consulta" (preco null).
 */
import { readFileSync, writeFileSync } from 'node:fs'

/** Categoria da planilha → slug, nome exibido, ícone do lucide, ordem. */
const CATEGORIES = {
  'ANTI INFLAMATÓRIO': ['anti-inflamatorios', 'Anti-inflamatórios', 'Pill'],
  'SHAMPOO TERAPÊUTICO': ['shampoos', 'Shampoos terapêuticos', 'ShowerHead'],
  ANTIBIÓTICOS: ['antibioticos', 'Antibióticos', 'Tablets'],
  'PRODUTOS OTOLÓGICOS': ['otologicos', 'Otológicos', 'Ear'],
  CARRAPATOS: ['antipulgas', 'Pulgas e carrapatos', 'Bug'],
  DIVERSOS: ['diversos', 'Diversos', 'Pill'],
  'SUPLEMENTO VITAMÍNICO': ['suplementos', 'Suplementos', 'Sparkles'],
  'PROTETOR HEPÁTICO': ['protetores-hepaticos', 'Protetores hepáticos', 'ShieldPlus'],
  COLÍRIOS: ['colirios', 'Colírios e oftálmicos', 'Eye'],
  POMADAS: ['pomadas', 'Pomadas', 'Bandage'],
  FLORAIS: ['florais', 'Florais', 'Flower2'],
}

/** Parser de CSV com suporte a campos entre aspas (vírgula decimal). */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) rows.push([...row, field])
  return rows.filter((r) => r.some((c) => c.trim()))
}

/** "R$ 1.234,50" → 1234.5; qualquer outra coisa → null. */
function parsePrice(value) {
  const m = value.trim().match(/^(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})$/)
  return m ? Number(`${m[1].replace(/\./g, '')}.${m[2]}`) : null
}

const sql = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const clean = (v) => v.replace(/\s+/g, ' ').trim()

const file = process.argv[2]
if (!file) {
  console.error('uso: node scripts/gerar-seed.mjs <planilha.csv>')
  process.exit(1)
}

const [, ...rows] = parseCsv(readFileSync(file, 'utf8').replace(/^﻿/, ''))
const products = []
const semPreco = []

for (const [cat, nome, detalhes = '', entrada = '', saida = ''] of rows) {
  const category = CATEGORIES[clean(cat)]
  if (!category) throw new Error(`Categoria desconhecida: "${cat}" (${nome})`)
  const preco = [detalhes, entrada, saida].map(parsePrice).find((v) => v != null) ?? null
  const produto = {
    nome: clean(nome),
    // a coluna DETALHES às vezes traz o preço — aí ela não é detalhe
    detalhes: parsePrice(detalhes) == null && clean(detalhes) ? clean(detalhes) : null,
    categoria: category[0],
    preco,
  }
  if (preco == null) semPreco.push(produto.nome)
  products.push(produto)
}

const categoryRows = Object.values(CATEGORIES).map(
  ([id, label, icon], i) => `  (${sql(id)}, ${sql(label)}, ${sql(icon)}, ${i + 1})`,
)
const productRows = products.map(
  (p) => `  (${sql(p.nome)}, ${sql(p.detalhes)}, ${sql(p.categoria)}, ${p.preco ?? 'null'})`,
)

const out = `-- Gerado por scripts/gerar-seed.mjs a partir de ${file} — não edite à mão.
-- Carga inicial: APAGA todos os produtos e recria a partir da planilha.
begin;

insert into public.categorias (id, label, icon, ordem) values
${categoryRows.join(',\n')}
on conflict (id) do update set label = excluded.label, icon = excluded.icon, ordem = excluded.ordem;

delete from public.produtos;

insert into public.produtos (nome, detalhes, categoria, preco) values
${productRows.join(',\n')};

commit;
`

writeFileSync('supabase/seed.sql', out)
console.log(`supabase/seed.sql: ${products.length} produtos, ${categoryRows.length} categorias`)
if (semPreco.length) console.log(`Sem preço (entram como "Sob consulta"): ${semPreco.join(' · ')}`)
