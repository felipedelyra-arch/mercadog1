import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { getIcon } from '../components/ui/icons'
import { PET_SIZES } from '../data/services'
import { formatDuration, formatPrice, parsePreco } from '../utils/format'
import { deleteServico, listServicos, saveServico } from './api'
import { Chip } from './ui'
import { useToast } from './toast'

const ICONES = ['Droplets', 'Scissors', 'Sparkles', 'Bath', 'ShowerHead', 'PawPrint', 'Bone', 'Smile', 'HeartPulse']
const DURACOES = [15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240]

/** "Banho & Hidratação" → "banho-hidratacao" (id do serviço, não muda depois). */
const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'servico'

/**
 * Serviços de banho e tosa que aparecem no site: nome, descrição, duração e
 * preço por porte. A consulta veterinária não entra aqui — é genérica e o
 * valor é definido no atendimento.
 */
export default function Servicos() {
  const toast = useToast()
  const [servicos, setServicos] = useState(null)
  const [error, setError] = useState(null)
  const [editando, setEditando] = useState(null) // objeto, {} (novo) ou null

  useEffect(() => {
    listServicos().then(setServicos).catch(setError)
  }, [])

  const replace = (saved) =>
    setServicos((list) => {
      const exists = list.some((s) => s.id === saved.id)
      const next = exists ? list.map((s) => (s.id === saved.id ? saved : s)) : [...list, saved]
      return next.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
    })

  /** Troca a posição de dois serviços vizinhos (ordem no site). */
  const mover = async (index, delta) => {
    const a = servicos[index]
    const b = servicos[index + delta]
    if (!b) return
    // normaliza a ordem pela posição atual, para empates não travarem a troca
    const novaA = index + delta + 1
    const novaB = index + 1
    replace({ ...a, ordem: novaA })
    replace({ ...b, ordem: novaB })
    try {
      await Promise.all([saveServico({ id: a.id, ordem: novaA }), saveServico({ id: b.id, ordem: novaB })])
    } catch {
      setError(new Error('ordem'))
      listServicos().then(setServicos)
    }
  }

  const toggleAtivo = async (s) => {
    replace({ ...s, ativo: !s.ativo })
    try {
      await saveServico({ id: s.id, ativo: !s.ativo })
      toast({
        message: `${s.nome} ${s.ativo ? 'escondido do site' : 'voltou ao site'}.`,
        actions: [
          {
            label: 'Desfazer',
            onClick: async () => {
              replace(s)
              try {
                await saveServico({ id: s.id, ativo: s.ativo })
              } catch {
                replace({ ...s, ativo: !s.ativo })
                toast({ message: 'Não foi possível desfazer.', tone: 'erro' })
              }
            },
          },
        ],
      })
    } catch {
      replace(s)
      toast({ message: 'Não foi possível salvar. Confira a internet.', tone: 'erro' })
    }
  }

  if (error && !servicos) {
    return (
      <p className="rounded-card bg-red-50 p-4 text-sm font-semibold text-red-600">
        Não foi possível carregar os serviços. Confira a internet e recarregue a página.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Banho e tosa</h1>
          <p className="text-sm text-clay">Serviços e preços que aparecem no site, na ordem abaixo.</p>
        </div>
        <Button size="sm" onClick={() => setEditando({})}>
          <Plus size={17} aria-hidden="true" />
          Novo serviço
        </Button>
      </div>

      {error && servicos && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          Uma alteração não foi salva. Confira a internet e tente de novo.
        </p>
      )}

      {!servicos ? (
        <Skeleton className="h-48 w-full rounded-card" />
      ) : (
        <ul className="flex flex-col divide-y divide-sand overflow-hidden rounded-card border border-sand bg-white">
          {servicos.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-clay">Nenhum serviço cadastrado.</li>
          )}
          {servicos.map((s, i) => {
            const Icon = getIcon(s.icon)
            return (
              <li key={s.id} className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${s.ativo ? '' : 'bg-cream/70'}`}>
                <div className="flex shrink-0 flex-col">
                  <button type="button" aria-label={`Subir ${s.nome}`} disabled={i === 0} onClick={() => mover(i, -1)} className="grid size-7 place-items-center rounded-full text-clay hover:bg-terracotta-50 disabled:opacity-25">
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" aria-label={`Descer ${s.nome}`} disabled={i === servicos.length - 1} onClick={() => mover(i, 1)} className="grid size-7 place-items-center rounded-full text-clay hover:bg-terracotta-50 disabled:opacity-25">
                    <ArrowDown size={15} />
                  </button>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-terracotta-50 text-terracotta-500">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <button type="button" onClick={() => setEditando(s)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold text-ink">{s.nome}</span>
                  <span className="block text-xs text-clay">{formatDuration(s.duracao)}</span>
                  <span className="block truncate text-sm text-terracotta-600">
                    {PET_SIZES.map((p) => `${p.label} ${s.precos?.[p.id] == null ? 'na hora' : formatPrice(s.precos[p.id])}`).join(' · ')}
                  </span>
                </button>
                <Chip ativo={s.ativo} onClick={() => toggleAtivo(s)} on="No site" off="Oculto" />
              </li>
            )
          })}
        </ul>
      )}

      <AnimatePresence>
        {editando && (
          <ServicoForm
            servico={editando}
            idsUsados={servicos?.map((s) => s.id) ?? []}
            proximaOrdem={(servicos?.at(-1)?.ordem ?? 0) + 1}
            onClose={() => setEditando(null)}
            onSaved={(saved) => {
              replace(saved)
              setEditando(null)
              toast({ message: `${saved.nome} salvo.` })
            }}
            onDeleted={(id) => {
              setServicos((list) => list.filter((s) => s.id !== id))
              setEditando(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ServicoForm({ servico, idsUsados, proximaOrdem, onClose, onSaved, onDeleted }) {
  const novo = !servico.id
  const [form, setForm] = useState({
    nome: servico.nome ?? '',
    descricao: servico.descricao ?? '',
    duracao: servico.duracao ?? 60,
    icon: servico.icon ?? 'Sparkles',
    ativo: servico.ativo ?? true,
    precos: Object.fromEntries(
      PET_SIZES.map((p) => [p.id, servico.precos?.[p.id] == null ? '' : String(servico.precos[p.id]).replace('.', ',')]),
    ),
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.nome.trim().length < 2) return setError('Informe o nome do serviço.')
    const precos = Object.fromEntries(PET_SIZES.map((p) => [p.id, parsePreco(form.precos[p.id])]))
    const invalido = PET_SIZES.find((p) => Number.isNaN(precos[p.id]))
    if (invalido) return setError(`Preço do porte ${invalido.label.toLowerCase()} inválido. Use por exemplo 75,00 — ou deixe vazio para "valor na hora".`)

    let id = servico.id
    if (novo) {
      const base = slugify(form.nome)
      id = base
      for (let n = 2; idsUsados.includes(id); n++) id = `${base}-${n}`
    }

    setSaving(true)
    setError(null)
    try {
      const saved = await saveServico(
        {
          id,
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          duracao: Number(form.duracao),
          icon: form.icon,
          precos,
          ativo: form.ativo,
          ...(novo ? { ordem: proximaOrdem } : {}),
        },
        { novo },
      )
      onSaved(saved)
    } catch {
      setError('Não foi possível salvar. Confira a internet e tente de novo.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteServico(servico.id)
      onDeleted(servico.id)
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink/50" aria-hidden="true" />
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label={novo ? 'Novo serviço' : `Editar ${servico.nome}`}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-card bg-white shadow-warm-xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[32rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card"
      >
        <div className="flex items-center justify-between border-b border-sand px-5 py-3.5">
          <h2 className="font-display text-xl font-semibold text-ink">{novo ? 'Novo serviço' : 'Editar serviço'}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="tap grid size-10 place-items-center rounded-full hover:bg-terracotta-50">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div>
            <label htmlFor="s-nome" className={label}>Nome</label>
            <input id="s-nome" value={form.nome} onChange={set('nome')} placeholder="Ex.: Hidratação" className={input} />
          </div>
          <div>
            <label htmlFor="s-descricao" className={label}>
              Descrição <span className="font-normal text-clay">(aparece no card)</span>
            </label>
            <textarea id="s-descricao" rows={3} value={form.descricao} onChange={set('descricao')} className={input} />
          </div>

          <fieldset>
            <legend className={label}>Preço por porte</legend>
            <div className="grid grid-cols-3 gap-2">
              {PET_SIZES.map((p) => (
                <label key={p.id} className="text-xs font-semibold text-clay">
                  {p.label} <span className="font-normal">({p.hint})</span>
                  <input
                    inputMode="decimal"
                    value={form.precos[p.id]}
                    onChange={(e) => setForm((f) => ({ ...f, precos: { ...f.precos, [p.id]: e.target.value } }))}
                    placeholder="na hora"
                    className={`${input} mt-1 px-3`}
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-clay">Vazio = “valor na hora” para aquele porte.</p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-duracao" className={label}>Duração</label>
              <select id="s-duracao" value={form.duracao} onChange={set('duracao')} className={input}>
                {[...new Set([...DURACOES, Number(form.duracao)])].sort((a, b) => a - b).map((m) => (
                  <option key={m} value={m}>{formatDuration(m)}</option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className={label}>Ícone</legend>
              <div className="flex flex-wrap gap-1.5">
                {ICONES.map((nome) => {
                  const Icon = getIcon(nome)
                  return (
                    <button
                      key={nome}
                      type="button"
                      aria-label={nome}
                      aria-pressed={form.icon === nome}
                      onClick={() => setForm((f) => ({ ...f, icon: nome }))}
                      className={`grid size-9 place-items-center rounded-tile border transition-colors ${
                        form.icon === nome ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600' : 'border-sand text-clay hover:border-terracotta-300'
                      }`}
                    >
                      <Icon size={17} />
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>

          <Chip ativo={form.ativo} onClick={() => setForm((f) => ({ ...f, ativo: !f.ativo }))} on="Aparece no site" off="Oculto do site" />

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-sand bg-cream px-5 py-3.5 pb-safe">
          {!novo &&
            (confirmDelete ? (
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-red-700">
                Excluir de vez? (para só esconder, use “Oculto”)
                <Button size="sm" onClick={handleDelete} loading={saving} className="!bg-red-600 hover:!bg-red-700">
                  Sim, excluir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-red-600 hover:bg-red-50">
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
