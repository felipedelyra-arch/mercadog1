import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Check, Plus, Trash2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { getIcon } from '../components/ui/icons'
import { deleteCategoria, listCategorias, saveCategoria } from './api'
import { useToast } from './toast'

const ICONES = ['Pill', 'Tablets', 'Syringe', 'Bandage', 'ShowerHead', 'Bath', 'Ear', 'Eye', 'Bug', 'ShieldPlus', 'Sparkles', 'Flower2', 'HeartPulse', 'Beef', 'Bone', 'ToyBrick', 'Tag', 'PawPrint']

/** "Pulgas & Carrapatos" → "pulgas-carrapatos" (vai na URL da loja, não muda depois). */
const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'categoria'

const qtd = (c) => c.produtos?.[0]?.count ?? 0

/**
 * Categorias da loja: nome, ícone e ordem dos filtros. Só dá para excluir
 * categoria vazia — assim nenhum produto fica sem categoria.
 */
export default function Categorias({ onClose }) {
  const toast = useToast()
  const [lista, setLista] = useState(null)
  const [editando, setEditando] = useState(null) // id em edição ou 'nova'
  const [form, setForm] = useState({ label: '', icon: 'Pill' })
  const [busy, setBusy] = useState(false)

  const load = () =>
    listCategorias()
      .then(setLista)
      .catch(() => toast({ message: 'Não foi possível carregar as categorias.', tone: 'erro' }))

  useEffect(() => {
    load()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrir = (c) => {
    setEditando(c ? c.id : 'nova')
    setForm(c ? { label: c.label, icon: c.icon } : { label: '', icon: 'Pill' })
  }

  const salvar = async () => {
    const label = form.label.trim()
    if (label.length < 2) return toast({ message: 'Dê um nome à categoria.', tone: 'erro' })
    setBusy(true)
    try {
      if (editando === 'nova') {
        let id = slugify(label)
        for (let n = 2; lista.some((c) => c.id === id); n++) id = `${slugify(label)}-${n}`
        await saveCategoria({ id, label, icon: form.icon, ordem: (lista.at(-1)?.ordem ?? 0) + 1 }, { nova: true })
        toast({ message: `Categoria “${label}” criada.` })
      } else {
        const atual = lista.find((c) => c.id === editando)
        await saveCategoria({ ...atual, label, icon: form.icon })
        toast({ message: `Categoria “${label}” salva.` })
      }
      setEditando(null)
      await load()
    } catch {
      toast({ message: 'Não foi possível salvar. Confira a internet.', tone: 'erro' })
    } finally {
      setBusy(false)
    }
  }

  const mover = async (i, delta) => {
    const a = lista[i]
    const b = lista[i + delta]
    if (!b) return
    setBusy(true)
    try {
      await Promise.all([saveCategoria({ ...a, ordem: i + delta + 1 }), saveCategoria({ ...b, ordem: i + 1 })])
      await load()
    } catch {
      toast({ message: 'Não foi possível mudar a ordem.', tone: 'erro' })
    } finally {
      setBusy(false)
    }
  }

  const excluir = async (c) => {
    setBusy(true)
    try {
      await deleteCategoria(c.id)
      toast({ message: `Categoria “${c.label}” excluída.` })
      await load()
    } catch {
      toast({ message: 'Não foi possível excluir. Confira a internet.', tone: 'erro' })
    } finally {
      setBusy(false)
    }
  }

  const formulario = (
    <div className="flex flex-col gap-3 rounded-tile border border-terracotta-200 bg-terracotta-50/60 p-3">
      <input
        autoFocus
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        onKeyDown={(e) => e.key === 'Enter' && salvar()}
        placeholder="Nome da categoria"
        aria-label="Nome da categoria"
        className="min-h-11 w-full rounded-tile border border-sand-dark bg-white px-3 text-ink focus:border-terracotta-500 focus:outline-none"
      />
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Ícone">
        {ICONES.map((nome) => {
          const Icon = getIcon(nome)
          return (
            <button
              key={nome}
              type="button"
              role="radio"
              aria-checked={form.icon === nome}
              aria-label={nome}
              onClick={() => setForm((f) => ({ ...f, icon: nome }))}
              className={`grid size-9 place-items-center rounded-tile border ${
                form.icon === nome ? 'border-terracotta-500 bg-white text-terracotta-600' : 'border-sand bg-white text-clay'
              }`}
            >
              <Icon size={17} />
            </button>
          )
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
          Cancelar
        </Button>
        <Button size="sm" onClick={salvar} loading={busy}>
          <Check size={16} aria-hidden="true" />
          Salvar
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink/50" aria-hidden="true" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Categorias da loja"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-card bg-white shadow-warm-xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[32rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card"
      >
        <div className="flex items-center justify-between border-b border-sand px-5 py-3.5">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Categorias da loja</h2>
            <p className="text-xs text-clay">A ordem aqui é a ordem dos filtros no site.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="tap grid size-10 place-items-center rounded-full hover:bg-terracotta-50">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto px-5 py-4">
          {!lista ? (
            <Skeleton className="h-48 w-full rounded-card" />
          ) : (
            lista.map((c, i) =>
              editando === c.id ? (
                <div key={c.id}>{formulario}</div>
              ) : (
                <div key={c.id} className="flex items-center gap-2 rounded-tile border border-sand px-2 py-2">
                  <div className="flex flex-col">
                    <button type="button" aria-label={`Subir ${c.label}`} disabled={i === 0 || busy} onClick={() => mover(i, -1)} className="grid size-10 place-items-center rounded-full text-clay hover:bg-terracotta-50 disabled:opacity-25 sm:size-7">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" aria-label={`Descer ${c.label}`} disabled={i === lista.length - 1 || busy} onClick={() => mover(i, 1)} className="grid size-10 place-items-center rounded-full text-clay hover:bg-terracotta-50 disabled:opacity-25 sm:size-7">
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  {(() => {
                    const Icon = getIcon(c.icon)
                    return <Icon size={18} className="shrink-0 text-terracotta-500" aria-hidden="true" />
                  })()}
                  <button type="button" onClick={() => abrir(c)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-semibold text-ink">{c.label}</span>
                    <span className="text-xs text-clay">
                      {qtd(c)} {qtd(c) === 1 ? 'produto' : 'produtos'}
                    </span>
                  </button>
                  {qtd(c) === 0 && (
                    <button type="button" aria-label={`Excluir ${c.label}`} disabled={busy} onClick={() => excluir(c)} className="grid size-9 place-items-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-40">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ),
            )
          )}

          {editando === 'nova' ? (
            formulario
          ) : (
            <button
              type="button"
              onClick={() => abrir(null)}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-tile border border-dashed border-terracotta-300 text-sm font-semibold text-terracotta-600 hover:bg-terracotta-50"
            >
              <Plus size={16} aria-hidden="true" />
              Nova categoria
            </button>
          )}
          <p className="text-xs text-clay">
            Para excluir uma categoria, mova os produtos dela para outra (editando cada produto). Só categorias vazias
            mostram a lixeira.
          </p>
        </div>
      </motion.div>
    </>
  )
}
