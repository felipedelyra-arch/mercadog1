import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Pencil, Plus, Search, Tags, Trash2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { getIcon } from '../components/ui/icons'
import { productImageUrl } from '../data/products'
import { getCategories } from '../services/api'
import { formatPrice, parsePreco } from '../utils/format'
import { deleteProduto, listProdutos, removeFoto, saveProduto, uploadFoto } from './api'
import { Chip } from './ui'
import { useToast } from './toast'
import Categorias from './Categorias'

const TODAS = ''

/**
 * Catálogo no painel. Estoque, destaque e preço mudam direto na lista, com
 * "Desfazer"; nome, categoria e foto ficam no formulário de edição.
 */
export default function Produtos() {
  const [params] = useSearchParams()
  const toast = useToast()
  const [produtos, setProdutos] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState(TODAS)
  // ?estoque=sem (atalho da tela inicial) abre já filtrado
  const [soSemEstoque, setSoSemEstoque] = useState(params.get('estoque') === 'sem')
  // produto em edição: objeto (editar), {} (novo) ou null (fechado)
  const [editando, setEditando] = useState(null)
  const [gerindoCategorias, setGerindoCategorias] = useState(false)

  const load = () =>
    Promise.all([listProdutos(), getCategories()])
      .then(([p, c]) => {
        setProdutos(p)
        setCategorias(c)
      })
      .catch(setError)

  useEffect(() => {
    load()
  }, [])

  const filtrados = useMemo(() => {
    if (!produtos) return []
    const q = query.trim().toLowerCase()
    return produtos.filter(
      (p) =>
        (categoria === TODAS || p.categoria === categoria) &&
        (!soSemEstoque || !p.disponivel) &&
        (!q || `${p.nome} ${p.detalhes ?? ''}`.toLowerCase().includes(q)),
    )
  }, [produtos, query, categoria, soSemEstoque])

  const replace = (saved) =>
    setProdutos((list) => {
      const exists = list.some((p) => p.id === saved.id)
      const next = exists ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved]
      return next.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    })

  /**
   * Muda um campo já na lista (estoque, destaque, preço): aparece na hora,
   * volta sozinho se o banco recusar e oferece "Desfazer".
   */
  const alterar = async (produto, campo, valor, mensagem) => {
    const antes = produto[campo]
    replace({ ...produto, [campo]: valor })
    try {
      await saveProduto({ id: produto.id, [campo]: valor })
      toast({
        message: mensagem,
        actions: [
          {
            label: 'Desfazer',
            onClick: async () => {
              replace({ ...produto, [campo]: antes })
              try {
                await saveProduto({ id: produto.id, [campo]: antes })
              } catch {
                replace({ ...produto, [campo]: valor })
                toast({ message: 'Não foi possível desfazer. Confira a internet.', tone: 'erro' })
              }
            },
          },
        ],
      })
    } catch {
      replace({ ...produto, [campo]: antes })
      toast({ message: 'Não foi possível salvar. Confira a internet e tente de novo.', tone: 'erro' })
    }
  }

  const toggle = (produto, campo) => {
    const valor = !produto[campo]
    const msg =
      campo === 'disponivel'
        ? `${produto.nome}: ${valor ? 'em estoque' : 'sem estoque'}.`
        : campo === 'destaque'
          ? `${produto.nome}: ${valor ? 'em destaque na Home' : 'fora do destaque'}.`
          : `${produto.nome}: ${valor ? 'exige receita' : 'não exige receita'}.`
    alterar(produto, campo, valor, msg)
  }

  if (error && !produtos) {
    return (
      <p className="rounded-card bg-red-50 p-4 text-sm font-semibold text-red-600">
        Não foi possível carregar os produtos. Confira a internet e recarregue a página.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Produtos{' '}
          {produtos && <span className="text-base font-normal text-clay">({produtos.length})</span>}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setGerindoCategorias(true)}>
            <Tags size={16} aria-hidden="true" />
            Categorias
          </Button>
          <Button size="sm" onClick={() => setEditando({})}>
            <Plus size={17} aria-hidden="true" />
            Novo produto
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar produto</span>
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-clay" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-sand-dark bg-white py-2.5 pr-4 pl-10 text-ink focus:border-terracotta-500 focus:outline-none"
          />
        </label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-label="Categoria"
          className="rounded-full border border-sand-dark bg-white px-4 py-2.5 text-ink focus:border-terracotta-500 focus:outline-none"
        >
          <option value={TODAS}>Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-2 rounded-full border border-sand-dark bg-white px-4 text-sm font-semibold text-clay">
          <input
            type="checkbox"
            checked={soSemEstoque}
            onChange={(e) => setSoSemEstoque(e.target.checked)}
            className="size-4 accent-terracotta-500"
          />
          Só sem estoque
        </label>
      </div>

      {!produtos ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-sand overflow-hidden rounded-card border border-sand bg-white">
          {filtrados.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-clay">Nenhum produto com esses filtros.</li>
          )}
          {filtrados.map((p) => {
            const Icon = getIcon(p.categorias?.icon)
            const foto = productImageUrl(p.image)
            return (
              <li key={p.id} className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 ${p.disponivel ? '' : 'bg-cream/70'}`}>
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-tile bg-terracotta-50 text-terracotta-400">
                  {foto ? <img src={foto} alt="" className="size-full object-cover" /> : <Icon size={20} aria-hidden="true" />}
                </span>
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-semibold text-ink">{p.nome}</span>
                  <span className="block truncate text-xs text-clay">
                    {[p.detalhes, p.categorias?.label].filter(Boolean).join(' · ')}
                  </span>
                </button>
                <PrecoInline
                  produto={p}
                  onSave={(preco) =>
                    alterar(p, 'preco', preco, `${p.nome}: ${preco == null ? 'sob consulta' : formatPrice(preco)}.`)
                  }
                />
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <Chip ativo={p.disponivel} onClick={() => toggle(p, 'disponivel')} on="Em estoque" off="Sem estoque" />
                  <Chip ativo={p.destaque} onClick={() => toggle(p, 'destaque')} on="★ Destaque" off="☆ Destaque" discreto />
                  <Chip ativo={Boolean(p.exige_receita)} onClick={() => toggle(p, 'exige_receita')} on="Exige receita" off="Sem receita" discreto />
                </div>
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  aria-label={`Editar ${p.nome}`}
                  className="hidden size-9 shrink-0 place-items-center rounded-full text-clay hover:bg-terracotta-50 hover:text-ink sm:grid"
                >
                  <Pencil size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <AnimatePresence>
        {editando && (
          <ProdutoForm
            produto={editando}
            categorias={categorias}
            onClose={() => setEditando(null)}
            onSaved={(saved) => {
              replace(saved)
              setEditando(null)
              toast({ message: `${saved.nome} salvo.` })
            }}
            onDeleted={(id) => {
              const nome = produtos.find((p) => p.id === id)?.nome
              setProdutos((list) => list.filter((p) => p.id !== id))
              setEditando(null)
              toast({ message: `${nome ?? 'Produto'} excluído.` })
            }}
          />
        )}
        {gerindoCategorias && (
          <Categorias
            onClose={() => {
              setGerindoCategorias(false)
              load() // nomes e ícones de categoria aparecem nos produtos
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProdutoForm({ produto, categorias, onClose, onSaved, onDeleted }) {
  const novo = !produto.id
  const [form, setForm] = useState({
    nome: produto.nome ?? '',
    detalhes: produto.detalhes ?? '',
    categoria: produto.categoria ?? categorias[0]?.id ?? '',
    preco: produto.preco == null ? '' : String(produto.preco).replace('.', ','),
    disponivel: produto.disponivel ?? true,
    destaque: produto.destaque ?? false,
    exige_receita: produto.exige_receita ?? false,
    image: produto.image ?? null,
  })
  const [foto, setFoto] = useState(null) // arquivo novo escolhido
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const preview = useMemo(
    () => (foto ? URL.createObjectURL(foto) : productImageUrl(form.image)),
    [foto, form.image],
  )
  useEffect(() => () => foto && URL.revokeObjectURL(preview), [foto, preview])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const preco = parsePreco(form.preco)
    if (form.nome.trim().length < 2) return setError('Informe o nome do produto.')
    if (Number.isNaN(preco)) return setError('Preço inválido. Use por exemplo 39,90 — ou deixe vazio para "sob consulta".')

    setSaving(true)
    setError(null)
    try {
      let image = form.image
      if (foto) image = await uploadFoto(foto)
      const saved = await saveProduto({
        id: produto.id,
        nome: form.nome.trim(),
        detalhes: form.detalhes.trim() || null,
        categoria: form.categoria,
        preco,
        disponivel: form.disponivel,
        destaque: form.destaque,
        exige_receita: form.exige_receita,
        image,
      })
      // foto trocada ou removida: apaga a antiga do bucket
      if (produto.image && produto.image !== image) removeFoto(produto.image).catch(() => {})
      onSaved(saved)
    } catch {
      setError('Não foi possível salvar. Confira a internet e tente de novo.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteProduto(produto)
      onDeleted(produto.id)
    } catch {
      setError('Não foi possível excluir. Tente de novo.')
      setSaving(false)
    }
  }

  const input =
    'w-full rounded-tile border border-sand-dark bg-white px-4 py-3 text-ink focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none'
  const label = 'mb-1 block text-sm font-bold text-ink'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-ink/50"
        aria-hidden="true"
      />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label={novo ? 'Novo produto' : `Editar ${produto.nome}`}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-card bg-white shadow-warm-xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[32rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card"
      >
        <div className="flex items-center justify-between border-b border-sand px-5 py-3.5">
          <h2 className="font-display text-xl font-semibold text-ink">
            {novo ? 'Novo produto' : 'Editar produto'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="tap grid size-10 place-items-center rounded-full hover:bg-terracotta-50">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-tile bg-terracotta-50 text-terracotta-300">
              {preview ? <img src={preview} alt="" className="size-full object-cover" /> : <ImagePlus size={26} aria-hidden="true" />}
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && file.size > 5 * 1024 * 1024) {
                    setError('Foto muito grande (máximo 5 MB).')
                    return
                  }
                  if (file) setFoto(file)
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={16} aria-hidden="true" />
                {preview ? 'Trocar foto' : 'Adicionar foto'}
              </Button>
              {preview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFoto(null)
                    setForm((f) => ({ ...f, image: null }))
                  }}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="p-nome" className={label}>Nome</label>
            <input id="p-nome" value={form.nome} onChange={set('nome')} className={input} />
          </div>
          <div>
            <label htmlFor="p-detalhes" className={label}>
              Apresentação <span className="font-normal text-clay">(opcional)</span>
            </label>
            <input id="p-detalhes" value={form.detalhes} onChange={set('detalhes')} placeholder="c/ 10 comp, 30 ml…" className={input} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-preco" className={label}>Preço</label>
              <input
                id="p-preco"
                inputMode="decimal"
                value={form.preco}
                onChange={set('preco')}
                placeholder="Vazio = sob consulta"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="p-categoria" className={label}>Categoria</label>
              <select id="p-categoria" value={form.categoria} onChange={set('categoria')} className={input}>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip ativo={form.disponivel} onClick={() => setForm((f) => ({ ...f, disponivel: !f.disponivel }))} on="Em estoque" off="Sem estoque" />
            <Chip ativo={form.destaque} onClick={() => setForm((f) => ({ ...f, destaque: !f.destaque }))} on="★ Destaque na Home" off="☆ Destaque na Home" discreto />
            <Chip ativo={form.exige_receita} onClick={() => setForm((f) => ({ ...f, exige_receita: !f.exige_receita }))} on="Exige receita" off="Sem receita" discreto />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-sand bg-cream px-5 py-3.5 pb-safe">
          {!novo &&
            (confirmDelete ? (
              <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
                Excluir de vez?
                <Button size="sm" onClick={handleDelete} loading={saving} className="!bg-red-600 hover:!bg-red-700">
                  Sim, excluir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} aria-hidden="true" />
                Excluir
              </button>
            ))}
          {!confirmDelete && (
            <Button type="submit" loading={saving} className="ml-auto">
              Salvar
            </Button>
          )}
        </div>
      </motion.form>
    </>
  )
}

/**
 * Preço editável na própria linha: toca, digita, Enter salva, Esc cancela.
 * Vazio = "sob consulta".
 */
function PrecoInline({ produto, onSave }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [invalido, setInvalido] = useState(false)

  const abrir = () => {
    setTexto(produto.preco == null ? '' : String(produto.preco).replace('.', ','))
    setInvalido(false)
    setEditando(true)
  }

  const salvar = () => {
    const preco = parsePreco(texto)
    if (Number.isNaN(preco)) return setInvalido(true)
    setEditando(false)
    if (preco !== produto.preco) onSave(preco)
  }

  if (editando) {
    return (
      <input
        autoFocus
        inputMode="decimal"
        value={texto}
        aria-label={`Preço de ${produto.nome}`}
        aria-invalid={invalido}
        placeholder="sob consulta"
        onChange={(e) => {
          setTexto(e.target.value)
          setInvalido(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') salvar()
          if (e.key === 'Escape') setEditando(false)
        }}
        onBlur={salvar}
        className={`w-24 shrink-0 rounded-tile border bg-white px-2 py-1.5 text-right text-sm font-semibold text-ink focus:outline-none ${
          invalido ? 'border-red-500' : 'border-terracotta-500'
        }`}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={abrir}
      title="Tocar para mudar o preço"
      className="shrink-0 rounded-tile border border-dashed border-transparent px-2 py-1.5 text-right text-sm font-semibold text-terracotta-600 transition-colors hover:border-terracotta-300 hover:bg-terracotta-50"
    >
      {produto.preco == null ? 'Sob consulta' : formatPrice(produto.preco)}
    </button>
  )
}
