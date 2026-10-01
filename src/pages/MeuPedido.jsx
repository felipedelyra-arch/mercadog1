import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Loader2, MapPin, PackageX, Store, XCircle } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'
import { SITE } from '../config/site'
import { WHATSAPP_NUMBERS, buildWhatsAppUrl } from '../config/whatsapp'
import { cancelarPedido, verPedido } from '../services/api'
import { formatPrice } from '../utils/format'

/** Como o cliente lê cada status (o painel usa outros rótulos). */
const STATUS = {
  pendente: { label: 'Aguardando confirmação', className: 'bg-amber-100 text-amber-800' },
  confirmado: { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-800' },
  recusado: { label: 'Não pôde ser atendido', className: 'bg-red-100 text-red-700' },
  concluido: { label: 'Concluído', className: 'bg-sand text-clay' },
  cancelado: { label: 'Cancelado', className: 'bg-sand text-clay' },
}

const TITULO = { loja: 'Pedido da loja', banho_tosa: 'Banho e tosa', consulta: 'Consulta veterinária' }

const DATA_FMT = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })

/** '2026-10-02' → 'sexta-feira, 02/10' — sem passar por UTC, que voltaria um dia. */
const formatData = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return DATA_FMT.format(new Date(y, m - 1, d))
}

/**
 * Página do pedido para o cliente: /pedido/<código>.
 * O código é secreto (vem na tela final e na confirmação da equipe), então
 * quem tem o link é o próprio cliente — daqui ele acompanha e cancela.
 */
export default function MeuPedido() {
  const { codigo } = useParams()
  // undefined = carregando · null = não existe
  const [pedido, setPedido] = useState(undefined)
  const [loadError, setLoadError] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  useEffect(() => {
    verPedido(codigo).then(setPedido).catch((err) => setLoadError(err.message))
  }, [codigo])

  const cancelar = async () => {
    setCancelando(true)
    setCancelError(null)
    try {
      setPedido(await cancelarPedido(codigo, motivo))
      setConfirmando(false)
    } catch (err) {
      setCancelError(err.message)
      // a regra pode ter mudado (equipe respondeu, passou do prazo): recarrega
      verPedido(codigo).then(setPedido).catch(() => {})
    } finally {
      setCancelando(false)
    }
  }

  const whatsNumero = pedido?.tipo === 'consulta'
    ? WHATSAPP_NUMBERS.veterinario
    : pedido?.tipo === 'banho_tosa'
      ? WHATSAPP_NUMBERS.banhoTosa
      : WHATSAPP_NUMBERS.atendimento
  const whatsLink = pedido && buildWhatsAppUrl(whatsNumero, `Olá! É sobre o meu pedido nº ${pedido.numero}.`)

  const card = 'rounded-card border border-sand bg-white p-5 shadow-warm-xs sm:p-6'

  let conteudo
  if (loadError) {
    conteudo = (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        {loadError}
      </p>
    )
  } else if (pedido === undefined) {
    conteudo = (
      <div className="flex justify-center py-16 text-clay">
        <Loader2 size={28} className="animate-spin" aria-label="Carregando pedido" />
      </div>
    )
  } else if (pedido === null) {
    conteudo = (
      <div className={`${card} flex flex-col items-center gap-3 text-center`}>
        <PackageX size={40} className="text-terracotta-300" aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold text-ink">Pedido não encontrado</h1>
        <p className="max-w-sm text-sm text-clay">
          Confira se o link está completo. Se precisar de ajuda, fale com a gente pelo WhatsApp.
        </p>
        <Button variant="whatsapp" href={buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, 'Olá! Preciso de ajuda com um pedido feito pelo site.')}>
          <WhatsAppIcon size={18} aria-hidden="true" />
          Falar no WhatsApp
        </Button>
      </div>
    )
  } else {
    const status = STATUS[pedido.status]
    const ativo = pedido.status === 'pendente' || pedido.status === 'confirmado'
    conteudo = (
      <div className="flex flex-col gap-4">
        <div className={card}>
          <p className="text-sm font-semibold text-clay">{TITULO[pedido.tipo]}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-display text-3xl font-semibold text-ink">Pedido nº {pedido.numero}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
          </div>

          {pedido.tipo === 'loja' ? (
            <>
              <ul className="mt-4 divide-y divide-sand border-y border-sand">
                {(pedido.itens ?? []).map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 py-2.5 text-sm">
                    <span className="text-ink">
                      {i.quantidade}x {i.nome}
                      {i.detalhes && <span className="text-clay"> ({i.detalhes})</span>}
                    </span>
                    <span className="shrink-0 font-semibold text-ink">
                      {i.preco == null ? 'Sob consulta' : formatPrice(i.preco * i.quantidade)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-clay">Total</span>
                <span className="font-display text-2xl font-semibold text-ink">
                  {formatPrice(pedido.total ?? 0)}
                  {pedido.sob_consulta && <span className="text-sm text-clay"> + sob consulta</span>}
                </span>
              </p>
              <p className="mt-4 flex items-start gap-2 text-sm text-ink">
                {pedido.entrega === 'entrega' ? (
                  <>
                    <MapPin size={17} className="mt-0.5 shrink-0 text-terracotta-600" aria-hidden="true" />
                    <span>Entrega em: {pedido.endereco}</span>
                  </>
                ) : (
                  <>
                    <Store size={17} className="mt-0.5 shrink-0 text-terracotta-600" aria-hidden="true" />
                    <span>Retirada na loja: {SITE.addressShort}</span>
                  </>
                )}
              </p>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-1.5 text-ink">
              <p className="font-semibold">
                {pedido.pet_nome ? `${pedido.pet_nome}: ` : ''}
                {pedido.servico}
              </p>
              <p className="flex items-center gap-2 text-sm">
                <CalendarDays size={17} className="text-terracotta-600" aria-hidden="true" />
                {formatData(pedido.data)}, às {pedido.horario}
              </p>
            </div>
          )}
        </div>

        {pedido.status === 'cancelado' && (
          <p className="flex items-start gap-2 rounded-xl bg-cream px-4 py-3 text-sm text-ink">
            <XCircle size={17} className="mt-0.5 shrink-0 text-clay" aria-hidden="true" />
            Pedido cancelado. A equipe já foi avisada — não precisa fazer mais nada.
          </p>
        )}

        {ativo && pedido.pode_cancelar && !confirmando && (
          <Button variant="outline" onClick={() => setConfirmando(true)} className="w-full sm:w-fit">
            {pedido.tipo === 'loja' ? 'Cancelar pedido' : 'Cancelar agendamento'}
          </Button>
        )}

        {ativo && pedido.pode_cancelar && confirmando && (
          <div className={`${card} flex flex-col gap-3`}>
            <p className="font-semibold text-ink">Tem certeza que quer cancelar?</p>
            <div>
              <label htmlFor="motivo" className="mb-1 block text-sm font-bold text-ink">
                Quer contar o motivo? <span className="font-normal text-clay">(opcional)</span>
              </label>
              <textarea
                id="motivo"
                rows={2}
                maxLength={300}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-tile border border-sand-dark bg-white px-4 py-3 text-ink focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none"
              />
            </div>
            {cancelError && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {cancelError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={cancelar} loading={cancelando} className="bg-red-600 hover:bg-red-700">
                Sim, cancelar
              </Button>
              <Button variant="ghost" onClick={() => setConfirmando(false)} disabled={cancelando}>
                Voltar
              </Button>
            </div>
          </div>
        )}

        {ativo && !pedido.pode_cancelar && (
          <p className="rounded-xl bg-cream px-4 py-3 text-sm text-clay">
            Faltam menos de 2 horas para o horário, então o cancelamento é feito pelo WhatsApp.
          </p>
        )}

        {cancelError && !confirmando && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {cancelError}
          </p>
        )}

        <Button variant="whatsapp" href={whatsLink} className="w-full sm:w-fit">
          <WhatsAppIcon size={18} aria-hidden="true" />
          Falar sobre este pedido
        </Button>
      </div>
    )
  }

  return (
    <PageWrapper title={pedido ? `Pedido nº ${pedido.numero}` : 'Meu pedido'}>
      <section className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10 sm:py-14">
        {conteudo}
      </section>
    </PageWrapper>
  )
}
