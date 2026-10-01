import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Check, ChevronRight, Inbox, Search, ShoppingBag, Stethoscope, Store, Truck, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { listPedidos, onPedidosChange } from './api'
import { STATUS, TIPO_LABEL, formatCriadoEm, resumo } from './pedidoInfo'
import { EntregaTag } from './ui'
import { useResponder } from './useResponder'

const FILTROS = [
  { id: 'pendente', label: 'Aguardando' },
  { id: 'confirmado', label: 'Confirmados' },
  { id: '', label: 'Todos' },
]

const TIPO_ICON = { loja: ShoppingBag, banho_tosa: CalendarClock, consulta: Stethoscope }

// recorte da loja: o que sai para entregar e o que fica no balcão
const MODOS = [
  { id: '', label: 'Todos' },
  { id: 'entrega', label: 'Entrega', icon: Truck, ativo: 'bg-sky-600 text-white border-sky-600' },
  { id: 'retirada', label: 'Retirada', icon: Store, ativo: 'bg-violet-600 text-white border-violet-600' },
]

/**
 * Lista de pedidos. Abre em "Aguardando", que é o que precisa de alguém.
 * Atualiza sozinha quando chega pedido novo (realtime do Supabase).
 */
export default function Pedidos() {
  const [filtro, setFiltro] = useState('pendente')
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState(null)
  const [busca, setBusca] = useState('')
  const [modo, setModo] = useState('')

  const load = useCallback(() => {
    listPedidos(filtro || undefined)
      .then((data) => {
        setPedidos(
          // confirmados em ordem de agenda (o próximo primeiro); o resto, mais novo primeiro
          filtro === 'confirmado'
            ? [...data].sort((a, b) =>
                `${a.data ?? '9'} ${a.horario ?? ''}`.localeCompare(`${b.data ?? '9'} ${b.horario ?? ''}`),
              )
            : data,
        )
        setError(null)
      })
      .catch(setError)
  }, [filtro])

  useEffect(() => {
    setPedidos(null)
    load()
    return onPedidosChange(load)
  }, [load])

  // Confirmar/Recusar direto da lista; o realtime recarrega a lista depois
  const responder = useResponder(
    useCallback(
      (atualizado) =>
        setPedidos((list) =>
          list
            ?.map((p) => (p.id === atualizado.id ? atualizado : p))
            .filter((p) => !filtro || p.status === filtro),
        ),
      [filtro],
    ),
  )

  // "42" ou "#42" acha pelo número da mensagem; texto acha pelo nome do cliente
  const termo = busca.trim().replace(/^#/, '').toLowerCase()
  const doModo = (p) => !modo || (p.tipo === 'loja' && p.entrega === modo)
  const contagem = (id) => pedidos?.filter((p) => p.tipo === 'loja' && p.entrega === id).length ?? 0
  const visiveis = pedidos?.filter(
    (p) =>
      doModo(p) &&
      (!termo ||
        (/^\d+$/.test(termo) ? String(p.numero) === termo : p.cliente_nome.toLowerCase().includes(termo))),
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Pedidos</h1>
        <div className="flex gap-1 rounded-full border border-sand bg-white p-1" role="tablist">
          {FILTROS.map(({ id, label }) => (
            <button
              key={id || 'todos'}
              type="button"
              role="tab"
              aria-selected={filtro === id}
              onClick={() => setFiltro(id)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                filtro === id ? 'bg-terracotta-500 text-white' : 'text-clay hover:bg-terracotta-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">Buscar pedido</span>
        <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-clay" aria-hidden="true" />
        <input
          type="search"
          inputMode="search"
          placeholder="Nº do pedido ou nome do cliente"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-full border border-sand-dark bg-white py-2.5 pr-4 pl-10 text-ink focus:border-terracotta-500 focus:outline-none"
        />
      </label>

      <div className="-mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar por entrega ou retirada">
        {MODOS.map(({ id, label, icon: Icon, ativo }) => (
          <button
            key={id || 'todos'}
            type="button"
            aria-pressed={modo === id}
            onClick={() => setModo(id)}
            className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
              modo === id
                ? (ativo ?? 'border-ink bg-ink text-white')
                : 'border-sand-dark bg-white text-clay hover:bg-cream'
            }`}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {label}
            {id && pedidos && (
              <span className={`rounded-full px-1.5 text-xs ${modo === id ? 'bg-white/25' : 'bg-sand'}`}>
                {contagem(id)}
              </span>
            )}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-card bg-red-50 p-4 text-sm font-semibold text-red-600">
          Não foi possível carregar os pedidos. Confira a internet e recarregue a página.
        </p>
      ) : !pedidos ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-sand bg-white px-6 py-14 text-center">
          <Inbox size={36} className="text-terracotta-300" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-ink">
            {termo
              ? 'Nenhum pedido encontrado'
              : modo
                ? `Nenhum pedido de ${modo} aqui`
                : filtro === 'pendente'
                  ? 'Nenhum pedido aguardando'
                  : 'Nenhum pedido aqui'}
          </p>
          <p className="text-sm text-clay">
            {termo ? 'Confira o número ou procure em “Todos”.' : 'Pedidos novos aparecem sozinhos nesta tela.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visiveis.map((p) => {
            const Icon = TIPO_ICON[p.tipo]
            const status = STATUS[p.status]
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-card border border-sand bg-white shadow-warm-xs transition-colors hover:border-terracotta-200 sm:flex-row sm:items-center sm:pr-3"
              >
                <Link
                  to={`/admin/pedidos/${p.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 p-3.5 pb-0 sm:gap-4 sm:p-4"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-terracotta-50 text-terracotta-600">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-bold text-ink">#{p.numero}</span>
                      <span className="truncate font-semibold text-ink">{p.cliente_nome}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
                        {status.label}
                      </span>
                      <EntregaTag pedido={p} />
                    </p>
                    <p className="truncate text-sm text-clay">
                      {TIPO_LABEL[p.tipo]} · {resumo(p)}
                    </p>
                    <p className="text-xs text-clay/80">Recebido {formatCriadoEm(p.created_at)}</p>
                  </div>
                  {p.status !== 'pendente' && (
                    <ChevronRight size={18} className="shrink-0 text-clay" aria-hidden="true" />
                  )}
                </Link>
                {p.status === 'pendente' ? (
                  <div className="flex shrink-0 gap-2 px-3.5 pb-3.5 sm:p-0">
                    <Button size="sm" onClick={() => responder(p, 'confirmado')} className="flex-1 sm:flex-none">
                      <Check size={16} aria-hidden="true" />
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => responder(p, 'recusado')} className="flex-1 sm:flex-none">
                      <X size={16} aria-hidden="true" />
                      Recusar
                    </Button>
                  </div>
                ) : (
                  <span className="pb-3.5 sm:pb-0" />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
