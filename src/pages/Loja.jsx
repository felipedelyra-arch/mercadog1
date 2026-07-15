import { AnimatePresence, motion } from 'framer-motion'
import { PackageSearch, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ProductCard from '../components/ProductCard'
import SectionHeading from '../components/ui/SectionHeading'
import { CardSkeleton } from '../components/ui/Skeleton'
import { staggerContainer } from '../animations/variants'
import { useFetch } from '../hooks/useFetch'
import { getProducts } from '../services/api'
import { PRODUCT_CATEGORIES } from '../data/products'

const ALL = 'todos'

export default function Loja() {
  const { data: products, loading } = useFetch(getProducts)
  // ?categoria=racao abre a loja já filtrada (usado pelo acesso rápido da Home)
  const [searchParams] = useSearchParams()
  const fromUrl = searchParams.get('categoria')
  const [category, setCategory] = useState(
    PRODUCT_CATEGORIES.some((c) => c.id === fromUrl) ? fromUrl : ALL,
  )
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!products) return []
    const q = query.trim().toLowerCase()
    return products.filter(
      (p) =>
        (category === ALL || p.categoria === category) &&
        (!q || p.nome.toLowerCase().includes(q)),
    )
  }, [products, category, query])

  const chips = [{ id: ALL, label: 'Todos' }, ...PRODUCT_CATEGORIES]

  return (
    <PageWrapper>
      <div className="bg-glow mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <SectionHeading
          eyebrow="Loja"
          title="Tudo para o seu pet"
          subtitle="Peça pelo WhatsApp e retire na loja ou receba em casa."
          align="left"
        />

        {/* Busca + filtro por categoria */}
        <div className="flex flex-col gap-4">
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
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border-2 border-sand bg-white py-3 pr-4 pl-11 text-sm text-ink placeholder:text-clay/60 focus:border-terracotta-500 focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoria">
            {chips.map(({ id, label }) => {
              const active = category === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(id)}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? 'text-white' : 'bg-cream text-clay hover:bg-terracotta-50'
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

        {/* Grid de produtos */}
        {loading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
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
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
