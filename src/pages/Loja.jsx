import { motion } from 'framer-motion'
import { PackageSearch, Search, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ProductCard from '../components/ProductCard'
import SectionHeading from '../components/ui/SectionHeading'
import { CardSkeleton } from '../components/ui/Skeleton'
import { useFetch } from '../hooks/useFetch'
import { getCategories, getProducts } from '../services/api'
import { useMediaQuery } from '../hooks/useMediaQuery'
import ProductRow from '../components/ProductRow'
import { isAvailable } from '../data/products'
import { WHATSAPP_MESSAGES, WHATSAPP_NUMBERS, buildWhatsAppUrl } from '../config/whatsapp'

const ALL = 'todos'
/** Quantos produtos aparecem por vez — o resto vem no "Mostrar mais". */
const POR_VEZ = 24

export default function Loja() {
  const { data: products, loading: loadingProducts, error } = useFetch(getProducts)
  const { data: categories, loading: loadingCategories } = useFetch(getCategories)
  const loading = loadingProducts || loadingCategories
  // ?categoria=antibioticos abre a loja já filtrada
  const [searchParams] = useSearchParams()
  const [selected, setCategory] = useState(searchParams.get('categoria') ?? ALL)
  const [query, setQuery] = useState('')
  const [limite, setLimite] = useState(POR_VEZ)
  // celular: lista em linhas; tablet/computador: grade de cards
  const grade = useMediaQuery('(min-width: 640px)')
  // categoria da URL que não existe no banco cai em "Todos"
  const category = categories?.some((c) => c.id === selected) ? selected : ALL

  const filtered = useMemo(() => {
    if (!products) return []
    const q = query.trim().toLowerCase()
    return products
      .filter(
        (p) =>
          (category === ALL || p.categoria === category) &&
          (!q || `${p.nome} ${p.detalhes ?? ''}`.toLowerCase().includes(q)),
      )
      // fora de estoque desce para o fim: quem chega vê primeiro o que dá para pedir
      .sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)))
  }, [products, category, query])

  const chips = [{ id: ALL, label: 'Todos' }, ...(categories ?? [])]
  const visiveis = filtered.slice(0, limite)
  const restantes = filtered.length - visiveis.length

  return (
    <PageWrapper title="Farmácia veterinária">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <SectionHeading
          as="h1"
          title="Farmácia veterinária"
          subtitle="Adicione ao carrinho e finalize o pedido pelo WhatsApp. Retire na loja ou receba em casa."
          align="left"
        />

        {/* Busca + filtro por categoria.
            Grudam abaixo da navbar ao rolar: no celular dá para trocar o filtro
            sem voltar ao topo da lista. */}
        <div className="sticky top-20 z-30 -mx-4 flex flex-col gap-3 border-b border-sand bg-white/92 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 sm:py-4">
          <label className="relative block max-w-md">
            <span className="sr-only">Buscar produto</span>
            <Search
              size={18}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-clay"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar produto…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimite(POR_VEZ)
              }}
              className="tap w-full rounded-full border border-sand-dark bg-white py-3 pr-4 pl-11 text-ink placeholder:text-clay/60 transition-colors focus:border-terracotta-500 focus:outline-none"
            />
          </label>

          <div
            className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
            role="tablist"
            aria-label="Filtrar por categoria"
          >
            {chips.map(({ id, label }) => {
              const active = category === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setCategory(id)
                    setLimite(POR_VEZ)
                  }}
                  className={`relative min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                    active
                      ? 'text-white'
                      : 'border border-sand bg-cream text-clay hover:border-terracotta-200 hover:bg-terracotta-50'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="category-pill"
                      className="absolute inset-0 rounded-full bg-terracotta-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quantos produtos o filtro deixou — evita a sensação de lista "cortada" */}
        {!loading && !error && (
          <p aria-live="polite" className="-mt-3 text-xs font-semibold text-clay">
            {filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'}
          </p>
        )}

        {/* Grid de produtos */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-card bg-cream px-6 py-16 text-center">
            <WifiOff size={40} className="text-terracotta-300" aria-hidden="true" />
            <p className="font-display text-xl font-semibold text-ink">
              Não conseguimos carregar a loja
            </p>
            <p className="max-w-xs text-sm text-clay">
              Tente de novo em instantes ou fale com a gente pelo{' '}
              <a
                href={buildWhatsAppUrl(
                  WHATSAPP_NUMBERS.atendimento,
                  WHATSAPP_MESSAGES.atendimentoLoja,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-terracotta-600 underline"
              >
                WhatsApp
              </a>
              .
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 rounded-card bg-cream px-6 py-16 text-center"
          >
            <PackageSearch size={40} className="text-terracotta-300" aria-hidden="true" />
            <p className="font-display text-xl font-semibold text-ink">Nada por aqui</p>
            <p className="max-w-xs text-sm text-clay">
              Nenhum produto encontrado com esses filtros. Tente outra busca ou categoria.
            </p>
          </motion.div>
        ) : (
          // sem entrada em cascata: com 170 produtos o último levaria ~12 s para aparecer
          <div className="flex flex-col gap-6">
            {grade ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {visiveis.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <ul className="-mt-2 flex flex-col divide-y divide-sand">
                {visiveis.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </ul>
            )}
            {restantes > 0 && (
              <button
                type="button"
                onClick={() => setLimite((n) => n + POR_VEZ)}
                className="min-h-12 w-full rounded-full border border-terracotta-500 font-semibold text-terracotta-600 transition-colors hover:bg-terracotta-50 sm:mx-auto sm:w-auto sm:px-8"
              >
                Mostrar mais {Math.min(restantes, POR_VEZ)} produtos
                <span className="font-normal text-clay"> · faltam {restantes}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
