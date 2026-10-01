import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Banknote, CalendarDays, Check, MapPin, Phone, RotateCcw, Store, Truck, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'
import { formatPrice } from '../utils/format'
import { conflitos, getPedido } from './api'
import { useResponder } from './useResponder'
import { EntregaTag } from './ui'
import {
  STATUS,
  TIPO_LABEL,
  formatCriadoEm,
  formatData,
  formatTelefone,
  mensagemCliente,
  whatsCliente,
} from './pedidoInfo'

/**
 * Um pedido: tudo o que o cliente mandou + os botões de resposta.
 * Depois de confirmar ou recusar, aparece o botão que abre o WhatsApp do
 * cliente com a resposta já escrita — mandar é um toque.
 */
export default function Pedido() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(undefined)
  const [conflito, setConflito] = useState([])
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)
  // status que acabou de ser dado nesta tela → mostra o "avisar cliente"
  const [respondido, setRespondido] = useState(null)

  useEffect(() => {
    getPedido(id)
      .then((p) => {
        setPedido(p)
        setNota(p?.nota_interna ?? '')
        if (p?.data) conflitos(p).then(setConflito).catch(() => {})
      })
      .catch(() => setPedido(null))
  }, [id])

  // o aviso com "Desfazer" também atualiza esta tela quando desfeito
  const salvarResposta = useResponder(
    useCallback((atualizado) => {
      setPedido(atualizado)
      setNota(atualizado.nota_interna ?? '')
      setRespondido(
        atualizado.status === 'confirmado' || atualizado.status === 'recusado' ? atualizado.status : null,
      )
    }, []),
  )

  const responder = async (status) => {
    setSaving(status)
    setError(null)
    const ok = await salvarResposta(pedido, status, nota)
    if (!ok) setError('Não foi possível salvar. Confira a internet e tente de novo.')
    setSaving(null)
  }

  if (pedido === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    )
  }

  if (pedido === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-sand bg-white px-6 py-14 text-center">
        <p className="font-display text-xl font-semibold text-ink">Pedido não encontrado</p>
        <Button to="/admin/pedidos" variant="outline" size="sm">
          Ver todos os pedidos
        </Button>
      </div>
    )
  }

  const status = STATUS[pedido.status]
  // o carrinho grava a forma de pagamento da entrega na 1ª linha das observações
  const pagamento = pedido.observacoes?.match(/^Pagamento: (.+)$/m)?.[1]
  const card = 'rounded-card border border-sand bg-white p-4 shadow-warm-xs sm:p-5'
  const titulo = 'mb-2 text-xs font-bold tracking-[0.12em] text-clay uppercase'

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/admin/pedidos"
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-clay hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Pedidos
      </Link>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="font-display text-3xl font-semibold text-ink">Pedido #{pedido.numero}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
          {status.label}
        </span>
        <EntregaTag pedido={pedido} grande />
        <p className="w-full text-sm text-clay">
          {TIPO_LABEL[pedido.tipo]} · recebido {formatCriadoEm(pedido.created_at)}
        </p>
      </div>

      {pedido.status === 'cancelado' && (
        <div className="rounded-card border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
          <p className="font-semibold">
            {pedido.cliente_nome.split(' ')[0]} cancelou pelo site
            {pedido.cancelado_em && ` em ${formatCriadoEm(pedido.cancelado_em)}`}.
          </p>
          {pedido.motivo_cancelamento && <p className="mt-1">Motivo: {pedido.motivo_cancelamento}</p>}
        </div>
      )}

      {/* Avisar o cliente, logo depois de responder */}
      {respondido && (
        <div className="flex flex-col gap-3 rounded-card border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-semibold text-emerald-900">
            {respondido === 'confirmado' ? 'Pedido confirmado.' : 'Pedido recusado.'} Agora avise{' '}
            {pedido.cliente_nome.split(' ')[0]} — a mensagem já vai escrita.
          </p>
          <Button
            variant="whatsapp"
            size="sm"
            href={whatsCliente(pedido, mensagemCliente(pedido, respondido))}
          >
            <WhatsAppIcon size={17} aria-hidden="true" />
            Avisar no WhatsApp
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Cliente */}
        <section className={card}>
          <h2 className={titulo}>Cliente</h2>
          <p className="text-lg font-semibold text-ink">{pedido.cliente_nome}</p>
          <p className="text-clay">{formatTelefone(pedido.cliente_telefone)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" href={`tel:+55${pedido.cliente_telefone.replace(/^55/, '')}`}>
              <Phone size={16} aria-hidden="true" />
              Ligar
            </Button>
            <Button variant="outline" size="sm" href={whatsCliente(pedido, '')}>
              <WhatsAppIcon size={16} aria-hidden="true" />
              WhatsApp
            </Button>
          </div>
        </section>

        {/* O que foi pedido */}
        {pedido.tipo === 'loja' ? (
          pedido.entrega === 'entrega' ? (
            <section className="rounded-card border-2 border-sky-300 bg-sky-50 p-4 shadow-warm-xs sm:p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-sky-800 uppercase">
                <Truck size={20} aria-hidden="true" />
                Entregar no endereço
              </h2>
              <p className="text-lg font-semibold text-ink">{pedido.endereco}</p>
              {pagamento && (
                <p className="mt-2 flex items-center gap-2 font-semibold text-ink">
                  <Banknote size={18} className="shrink-0 text-sky-700" aria-hidden="true" />
                  {pagamento}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.endereco ?? '')}`}
                className="mt-3"
              >
                <MapPin size={16} aria-hidden="true" />
                Abrir no mapa
              </Button>
            </section>
          ) : (
            <section className="rounded-card border-2 border-violet-300 bg-violet-50 p-4 shadow-warm-xs sm:p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-[0.12em] text-violet-800 uppercase">
                <Store size={20} aria-hidden="true" />
                Retirada na loja
              </h2>
              <p className="text-lg font-semibold text-ink">O cliente vem buscar no balcão.</p>
              <p className="mt-1 text-sm text-clay">Separe os itens e deixe com o nº #{pedido.numero}.</p>
            </section>
          )
        ) : (
          <section className={card}>
            <h2 className={titulo}>Agendamento</h2>
            <p className="text-lg font-semibold text-ink">{pedido.servico}</p>
            <p className="text-ink">
              {formatData(pedido.data)} às <strong>{pedido.horario}</strong>
            </p>
            <p className="mt-1 text-clay">
              Pet: <strong className="text-ink">{pedido.pet_nome}</strong>
              {pedido.pet_porte && ` · porte ${pedido.pet_porte.toLowerCase()}`}
            </p>
            <Link
              to={`/admin/agenda?dia=${pedido.data}`}
              className="mt-3 flex w-fit items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:underline"
            >
              <CalendarDays size={16} aria-hidden="true" />
              Ver na agenda do dia
            </Link>
            {conflito.length > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Já existe agendamento confirmado neste horário:{' '}
                  {conflito.map((c) => (
                    <Link key={c.id} to={`/admin/pedidos/${c.id}`} className="font-semibold underline">
                      #{c.numero} {c.cliente_nome}
                    </Link>
                  ))}
                </span>
              </p>
            )}
          </section>
        )}
      </div>

      {pedido.tipo === 'loja' && (
        <section className={card}>
          <h2 className={titulo}>Itens</h2>
          <ul className="divide-y divide-sand">
            {pedido.itens.map((item) => (
              <li key={item.produto_id} className="flex items-baseline gap-3 py-2.5">
                <span className="w-8 shrink-0 font-bold text-terracotta-600">{item.quantidade}x</span>
                <span className="min-w-0 flex-1 text-ink">
                  {item.nome}
                  {item.detalhes && <span className="text-sm text-clay"> · {item.detalhes}</span>}
                  {item.exige_receita && (
                    <span className="ml-2 rounded-full bg-terracotta-100 px-2 py-0.5 text-xs font-semibold text-terracotta-700">
                      exige receita
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {item.preco == null ? 'sob consulta' : formatPrice(item.preco * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-baseline justify-between border-t border-sand pt-3">
            <span className="font-semibold text-clay">Total</span>
            <span className="font-display text-2xl font-semibold text-ink">
              {formatPrice(pedido.total ?? 0)}
              {pedido.sob_consulta && <span className="text-sm text-clay"> + sob consulta</span>}
            </span>
          </p>
        </section>
      )}

      {pedido.observacoes && (
        <section className={card}>
          <h2 className={titulo}>
            {pedido.tipo === 'consulta' ? 'Motivo da consulta' : 'Observações do cliente'}
          </h2>
          <p className="whitespace-pre-line text-ink">{pedido.observacoes}</p>
        </section>
      )}

      {/* Resposta */}
      <section className={card}>
        <label htmlFor="nota" className={titulo + ' block'}>
          Anotação da equipe <span className="normal-case">(só a equipe vê)</span>
        </label>
        <textarea
          id="nota"
          rows={2}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ex.: cliente pediu para ligar antes, pagou no Pix…"
          className="w-full rounded-tile border border-sand-dark bg-white px-4 py-3 text-ink focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none"
        />

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {pedido.status === 'pendente' && (
            <>
              <Button onClick={() => responder('confirmado')} loading={saving === 'confirmado'} disabled={Boolean(saving)}>
                <Check size={18} aria-hidden="true" />
                Confirmar
              </Button>
              <Button variant="outline" onClick={() => responder('recusado')} loading={saving === 'recusado'} disabled={Boolean(saving)}>
                <X size={18} aria-hidden="true" />
                Recusar
              </Button>
            </>
          )}
          {pedido.status === 'confirmado' && (
            <>
              <Button onClick={() => responder('concluido')} loading={saving === 'concluido'} disabled={Boolean(saving)}>
                <Check size={18} aria-hidden="true" />
                Marcar como concluído
              </Button>
              <Button variant="outline" onClick={() => responder('recusado')} loading={saving === 'recusado'} disabled={Boolean(saving)}>
                <X size={18} aria-hidden="true" />
                Cancelar
              </Button>
            </>
          )}
          {(pedido.status === 'recusado' || pedido.status === 'concluido' || pedido.status === 'cancelado') && (
            <Button variant="outline" onClick={() => responder('pendente')} loading={saving === 'pendente'} disabled={Boolean(saving)}>
              <RotateCcw size={18} aria-hidden="true" />
              Reabrir pedido
            </Button>
          )}
          {pedido.status !== 'pendente' && nota !== (pedido.nota_interna ?? '') && (
            <Button variant="ghost" onClick={() => responder(pedido.status)} loading={saving === pedido.status}>
              Salvar anotação
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
