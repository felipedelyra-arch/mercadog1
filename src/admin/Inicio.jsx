import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellOff, CalendarDays, Check, ChevronRight, ClipboardList, PackageX, Volume2, VolumeX, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { countSemEstoque, getAgoraLoja, listAgendamentos, listPedidos, onPedidosChange } from './api'
import {
  notificacoesPermitidas,
  notificacoesSuportadas,
  pedirPermissaoNotificacao,
  setSomLigado,
  somLigado,
  tocarSom,
} from './alertas'
import { STATUS, TIPO_LABEL, formatCriadoEm, resumo } from './pedidoInfo'
import { useResponder } from './useResponder'

const saudacao = (hora) => (hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite')

/**
 * Tela de abertura do painel: o que precisa de alguém agora (pedidos
 * aguardando, com confirmar/recusar ali mesmo), a agenda de hoje e o que
 * está sem estoque. Tudo atualiza sozinho quando chega pedido.
 */
export default function Inicio({ membro }) {
  const [agora, setAgora] = useState(null)
  const [pendentes, setPendentes] = useState(null)
  const [hoje, setHoje] = useState(null)
  const [semEstoque, setSemEstoque] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const a = await getAgoraLoja()
      const dia = a.split('T')[0]
      const [p, h, e] = await Promise.all([listPedidos('pendente'), listAgendamentos(dia, dia), countSemEstoque()])
      setAgora(a)
      setPendentes(p)
      setHoje(h)
      setSemEstoque(e)
    } catch (err) {
      setError(err)
    }
  }, [])

  useEffect(() => {
    load()
    return onPedidosChange(load)
  }, [load])

  // resposta pela tela inicial: tira o pedido da lista na hora (o "Desfazer" traz de volta)
  const responder = useResponder(
    useCallback((p) => {
      setPendentes((list) => {
        if (!list) return list
        const sem = list.filter((x) => x.id !== p.id)
        return p.status === 'pendente' ? [p, ...sem] : sem
      })
    }, []),
  )

  if (error) {
    return (
      <p className="rounded-card bg-red-50 p-4 text-sm font-semibold text-red-600">
        Não foi possível carregar o resumo. Confira a internet e recarregue a página.
      </p>
    )
  }

  const hora = agora ? Number(agora.split('T')[1].slice(0, 2)) : 12
  const primeiroNome = membro.nome.split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {saudacao(hora)}, {primeiroNome}!
        </h1>
        <p className="text-sm text-clay">Aqui está o que precisa de atenção agora.</p>
      </div>

      <AlertaConfig />

      {/* Números do momento */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Numero to="/admin/pedidos" icon={ClipboardList} label="Aguardando" valor={pendentes?.length} destaque={pendentes?.length > 0} />
        <Numero to="/admin/agenda" icon={CalendarDays} label="Na agenda hoje" valor={hoje?.length} />
        <Numero to="/admin/produtos?estoque=sem" icon={PackageX} label="Sem estoque" valor={semEstoque} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Aguardando resposta */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Aguardando resposta</h2>
            <Link to="/admin/pedidos" className="-my-2 flex min-h-11 items-center text-sm font-semibold text-terracotta-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {!pendentes ? (
            <Skeleton className="h-40 w-full rounded-card" />
          ) : pendentes.length === 0 ? (
            <p className="rounded-card border border-sand bg-white px-4 py-8 text-center text-sm text-clay">
              Nenhum pedido esperando. Quando chegar um, ele aparece aqui na hora.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendentes.slice(0, 8).map((p) => (
                <li key={p.id} className="flex flex-col gap-2 rounded-card border border-amber-200 bg-white p-3.5 shadow-warm-xs sm:flex-row sm:items-center">
                  <Link to={`/admin/pedidos/${p.id}`} className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2">
                      <span className="font-bold text-ink">#{p.numero}</span>
                      <span className="truncate font-semibold text-ink">{p.cliente_nome}</span>
                    </p>
                    <p className="truncate text-sm text-clay">
                      {TIPO_LABEL[p.tipo]} · {resumo(p)}
                    </p>
                    <p className="text-xs text-clay/80">Recebido {formatCriadoEm(p.created_at)}</p>
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => responder(p, 'confirmado')} className="flex-1 sm:flex-none">
                      <Check size={16} aria-hidden="true" />
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => responder(p, 'recusado')} className="flex-1 sm:flex-none">
                      <X size={16} aria-hidden="true" />
                      Recusar
                    </Button>
                  </div>
                </li>
              ))}
              {pendentes.length > 8 && (
                <Link to="/admin/pedidos" className="text-center text-sm font-semibold text-terracotta-600 hover:underline">
                  + {pendentes.length - 8} aguardando
                </Link>
              )}
            </ul>
          )}
        </section>

        {/* Agenda de hoje */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Hoje na agenda</h2>
            <Link to="/admin/agenda" className="-my-2 flex min-h-11 items-center text-sm font-semibold text-terracotta-600 hover:underline">
              Abrir agenda
            </Link>
          </div>
          {!hoje ? (
            <Skeleton className="h-40 w-full rounded-card" />
          ) : hoje.length === 0 ? (
            <p className="rounded-card border border-sand bg-white px-4 py-8 text-center text-sm text-clay">
              Nada agendado para hoje.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-sand overflow-hidden rounded-card border border-sand bg-white">
              {hoje.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/pedidos/${p.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-cream">
                    <span className="w-12 shrink-0 font-display text-lg font-semibold text-ink">{p.horario}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {p.pet_nome} <span className="font-normal text-clay">· {p.cliente_nome}</span>
                      </p>
                      <p className="truncate text-sm text-clay">{TIPO_LABEL[p.tipo]}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS[p.status].className}`}>
                      {STATUS[p.status].label}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-clay" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Numero({ to, icon: Icon, label, valor, destaque = false }) {
  return (
    <Link
      to={to}
      className={`flex flex-col gap-1 rounded-card border p-3 transition-colors sm:p-4 ${
        destaque ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-sand bg-white hover:border-terracotta-200'
      }`}
    >
      <Icon size={18} className={destaque ? 'text-amber-700' : 'text-terracotta-500'} aria-hidden="true" />
      <span className="font-display text-2xl font-semibold text-ink sm:text-3xl">{valor ?? '–'}</span>
      <span className="text-xs font-semibold text-clay sm:text-sm">{label}</span>
    </Link>
  )
}

/** Liga o som e as notificações de pedido novo neste aparelho. */
function AlertaConfig() {
  const [som, setSom] = useState(somLigado)
  const [notif, setNotif] = useState(notificacoesPermitidas)
  const suportado = notificacoesSuportadas()
  const bloqueado = suportado && Notification.permission === 'denied'

  if (notif && som) return null

  return (
    <div className="flex flex-col gap-3 rounded-card border border-terracotta-200 bg-terracotta-50 p-4 sm:flex-row sm:items-center">
      <Bell size={22} className="shrink-0 text-terracotta-600" aria-hidden="true" />
      <p className="flex-1 text-sm text-ink">
        <strong>Avisos de pedido novo neste aparelho.</strong>{' '}
        {bloqueado
          ? 'As notificações estão bloqueadas no navegador — libere nas configurações do site para receber mesmo com o painel fechado.'
          : 'Ligue para ouvir um som e receber notificação quando chegar pedido, mesmo com o painel em segundo plano.'}
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          size="sm"
          variant={som ? 'outline' : 'primary'}
          onClick={() => {
            setSomLigado(!som)
            setSom(!som)
            if (!som) tocarSom()
          }}
        >
          {som ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
          {som ? 'Som ligado' : 'Ligar som'}
        </Button>
        {suportado && !notif && !bloqueado && (
          <Button size="sm" onClick={async () => setNotif(await pedirPermissaoNotificacao())}>
            {notif ? <Bell size={16} aria-hidden="true" /> : <BellOff size={16} aria-hidden="true" />}
            Ligar notificações
          </Button>
        )}
      </div>
    </div>
  )
}
