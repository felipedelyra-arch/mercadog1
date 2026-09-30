import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarOff, Lock, LockOpen, Plus, Trash2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { describeDay, fromIso, isoLocal, slotsDoDia, toMinutes } from '../data/schedule'
import {
  addBloqueio,
  getAgendaConfig,
  getAgoraLoja,
  listAgendamentos,
  listBloqueios,
  onPedidosChange,
  removeBloqueio,
  saveAgendaConfig,
} from './api'
import { STATUS, formatData, formatTelefone } from './pedidoInfo'
import { useToast } from './toast'

/** Os dois atendimentos: mesma grade, ocupação separada (atendentes x veterinário). */
const TIPOS = [
  { id: 'banho_tosa', label: 'Banho e tosa' },
  { id: 'consulta', label: 'Consulta' },
]
const TIPO_LABEL = Object.fromEntries(TIPOS.map((t) => [t.id, t.label]))

const SECOES = [
  { id: 'dia', label: 'Dia a dia' },
  { id: 'proximos', label: 'Próximos agendamentos' },
  { id: 'horarios', label: 'Horários de funcionamento' },
  { id: 'fechados', label: 'Dias fechados' },
]

const DIAS_NO_PAINEL = 21
const DIAS_PROXIMOS = 60

const addDays = (iso, n) => {
  const d = fromIso(iso)
  d.setDate(d.getDate() + n)
  return isoLocal(d)
}
const diasEntre = (de, ate) => Math.round((fromIso(ate) - fromIso(de)) / 86_400_000)

/** Bloqueio vale para o tipo? (tipo null = vale para os dois) */
const valePara = (b, tipo) => !b.tipo || b.tipo === tipo
const escopo = (b) => (b.tipo ? `só ${TIPO_LABEL[b.tipo].toLowerCase()}` : 'banho e tosa e consultas')

/**
 * Agenda do banho/tosa e das consultas. É a mesma grade que o site usa para
 * mostrar horários ao cliente — o que muda aqui aparece lá na hora.
 */
export default function Agenda() {
  // ?dia=2026-10-01 abre direto no dia de um pedido
  const [params] = useSearchParams()
  const [secao, setSecao] = useState('dia')
  const [config, setConfig] = useState(null)
  const [agora, setAgora] = useState(null) // 'AAAA-MM-DDTHH:MM', hora da loja
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getAgendaConfig(), getAgoraLoja()])
      .then(([c, a]) => {
        setConfig(c)
        setAgora(a)
      })
      .catch(setError)
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Agenda</h1>
        {config && (
          <p className="text-sm text-clay">
            Banho e tosa e consultas usam os mesmos horários, de {config.slot_minutos} em {config.slot_minutos} min —
            os mesmos que o cliente vê no site. Cada um tem a sua ocupação.
          </p>
        )}
      </div>

      <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4" role="tablist" aria-label="Seção">
        {SECOES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={secao === s.id}
            onClick={() => setSecao(s.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              secao === s.id ? 'border-terracotta-500 text-ink' : 'border-transparent text-clay hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-card bg-red-50 p-4 text-sm font-semibold text-red-600">
          Não foi possível carregar a agenda. Confira a internet e recarregue a página.
        </p>
      ) : !config || !agora ? (
        <Skeleton className="h-72 w-full rounded-card" />
      ) : secao === 'dia' ? (
        <DiaADia config={config} agora={agora} diaInicial={params.get('dia')} />
      ) : secao === 'proximos' ? (
        <Proximos agora={agora} />
      ) : secao === 'horarios' ? (
        <Horarios config={config} onSaved={setConfig} />
      ) : (
        <Fechados hoje={agora.split('T')[0]} />
      )}
    </div>
  )
}

/* ============================================================ Dia a dia */

function DiaADia({ config, agora, diaInicial }) {
  const toast = useToast()
  const [hoje, horaAgora] = agora.split('T')
  const [dia, setDia] = useState(diaInicial && diaInicial >= hoje ? diaInicial : hoje)
  const [agendamentos, setAgendamentos] = useState(null)
  const [bloqueios, setBloqueios] = useState([])
  const [busy, setBusy] = useState(null)
  const [fechando, setFechando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [fecharTipo, setFecharTipo] = useState('') // '' = os dois
  const [error, setError] = useState(null)

  // 21 dias, ou até o dia pedido se ele estiver mais longe
  const totalDias = Math.max(DIAS_NO_PAINEL, diasEntre(hoje, dia) + 1)
  const ultimo = addDays(hoje, totalDias - 1)
  const dias = useMemo(() => Array.from({ length: totalDias }, (_, i) => addDays(hoje, i)), [hoje, totalDias])

  const load = useCallback(() => {
    Promise.all([listAgendamentos(hoje, ultimo), listBloqueios(hoje)])
      .then(([a, b]) => {
        setAgendamentos(a)
        setBloqueios(b)
      })
      .catch(setError)
  }, [hoje, ultimo])

  useEffect(() => {
    load()
    return onPedidosChange(load)
  }, [load])

  const run = async (key, fn) => {
    setBusy(key)
    setError(null)
    try {
      await fn()
      load()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(null)
    }
  }

  if (!agendamentos) return <Skeleton className="h-72 w-full rounded-card" />

  const doDia = (iso) => agendamentos.filter((a) => a.data === iso)
  const fechamentos = (iso) => bloqueios.filter((b) => b.data === iso && !b.horario)
  const fechadoPara = (iso, tipo) => fechamentos(iso).find((b) => valePara(b, tipo))

  // Mesma regra do site (generateSchedule): antes disto o cliente não consegue mais pedir
  const corte = toMinutes(horaAgora) + config.antecedencia_minutos - diasEntre(hoje, dia) * 24 * 60
  const encerrado = (h) => toMinutes(h) < corte

  const grade = slotsDoDia(config, dia)
  const pedidosDia = doDia(dia)
  // horários com pedido que saíram da grade (a grade mudou depois do pedido)
  const horarios = [...new Set([...grade, ...pedidosDia.map((p) => p.horario)])].sort(
    (a, b) => toMinutes(a) - toMinutes(b),
  )
  const fechamentosDia = fechamentos(dia)
  const tudoFechado = TIPOS.every((t) => fechadoPara(dia, t.id))

  return (
    <div className="flex flex-col gap-4">
      {/* Faixa de dias */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="listbox" aria-label="Dia">
        {dias.map((iso) => {
          const d = describeDay(iso)
          const ativo = iso === dia
          const semGrade = slotsDoDia(config, iso).length === 0
          const fechado = TIPOS.every((t) => fechadoPara(iso, t.id))
          const pend = doDia(iso).filter((p) => p.status === 'pendente').length
          const conf = doDia(iso).filter((p) => p.status === 'confirmado').length
          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={ativo}
              onClick={() => {
                setDia(iso)
                setFechando(false)
              }}
              className={`flex w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-tile border px-2 py-2.5 transition-colors ${
                ativo
                  ? 'border-terracotta-500 bg-terracotta-500 text-white'
                  : fechado || semGrade
                    ? 'border-sand bg-sand/40 text-clay'
                    : 'border-sand bg-white text-ink hover:border-terracotta-300'
              }`}
            >
              <span className="text-[11px] font-bold uppercase">{iso === hoje ? 'Hoje' : d.weekday}</span>
              <span className="text-sm font-semibold">{d.label}</span>
              <span className="flex h-4 items-center gap-1 text-[10px] font-bold">
                {fechado ? (
                  'fechado'
                ) : (
                  <>
                    {conf > 0 && <span className={ativo ? '' : 'text-emerald-700'}>{conf}✓</span>}
                    {pend > 0 && <span className={ativo ? '' : 'text-amber-700'}>{pend}?</span>}
                  </>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          Não foi possível salvar. Confira a internet e tente de novo.
        </p>
      )}

      {/* Cabeçalho do dia: fechamentos e botão de fechar */}
      <div className="flex flex-col gap-3 rounded-card border border-sand bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl font-semibold text-ink">{formatData(dia)}</p>
            <p className="text-sm text-clay">
              {grade.length === 0
                ? 'Sem atendimento neste dia da semana'
                : `${grade.length} horários · ${pedidosDia.filter((p) => p.status === 'confirmado').length} confirmados · ${pedidosDia.filter((p) => p.status === 'pendente').length} aguardando`}
            </p>
          </div>
          {grade.length > 0 && !tudoFechado && !fechando && (
            <Button variant="outline" size="sm" onClick={() => setFechando(true)}>
              <CalendarOff size={16} aria-hidden="true" />
              Fechar o dia
            </Button>
          )}
        </div>

        {fechamentosDia.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand/50 px-3 py-2 text-sm">
            <span className="text-ink">
              <strong>Fechado</strong> para {escopo(b)}
              {b.motivo && <span className="text-clay"> · {b.motivo}</span>}
            </span>
            <button
              type="button"
              disabled={busy === b.id}
              onClick={() => run(b.id, () => removeBloqueio(b.id))}
              className="flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-terracotta-600 hover:bg-white disabled:opacity-50"
            >
              <LockOpen size={14} aria-hidden="true" />
              Reabrir
            </button>
          </div>
        ))}

        {fechando && (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              run('dia', async () => {
                await addBloqueio({ tipo: fecharTipo || null, data: dia, motivo: motivo.trim() || null })
                setFechando(false)
                setMotivo('')
              })
            }}
          >
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Fechar para">
              {[['', 'Tudo'], ...TIPOS.map((t) => [t.id, `Só ${t.label.toLowerCase()}`])].map(([id, label]) => (
                <button
                  key={id || 'tudo'}
                  type="button"
                  role="radio"
                  aria-checked={fecharTipo === id}
                  onClick={() => setFecharTipo(id)}
                  className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${
                    fecharTipo === id ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600' : 'border-sand-dark text-clay'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo (opcional): feriado, folga…"
                className="min-h-11 flex-1 rounded-full border border-sand-dark bg-white px-4 text-sm focus:border-terracotta-500 focus:outline-none"
              />
              <Button type="submit" size="sm" loading={busy === 'dia'}>
                Fechar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setFechando(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Horários: banho e tosa e consulta lado a lado */}
      {horarios.length > 0 && (
        <ul className="flex flex-col gap-2">
          {horarios.map((h) => (
            <li key={h} className="flex flex-col gap-2 rounded-tile border border-sand bg-white p-2.5 sm:flex-row sm:items-stretch">
              <span className="px-1.5 font-display text-lg font-semibold text-ink sm:w-16 sm:pt-1.5">{h}</span>
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                {TIPOS.map((t) => (
                  <Celula
                    key={t.id}
                    tipo={t}
                    pedidos={pedidosDia.filter((p) => p.tipo === t.id && p.horario === h)}
                    bloqueio={bloqueios.find((b) => b.data === dia && b.horario === h && valePara(b, t.id))}
                    fechado={Boolean(fechadoPara(dia, t.id))}
                    passou={encerrado(h)}
                    foraDaGrade={!grade.includes(h)}
                    busy={busy === `${t.id}-${h}`}
                    onToggle={(bloqueio) =>
                      run(`${t.id}-${h}`, async () => {
                        const nome = `${t.label} às ${h}`
                        if (bloqueio) {
                          await removeBloqueio(bloqueio.id)
                          toast({
                            message: `${nome} liberado.`,
                            actions: [{ label: 'Desfazer', onClick: () => run('desfazer', () => addBloqueio({ tipo: bloqueio.tipo, data: dia, horario: h })) }],
                          })
                        } else {
                          const novo = await addBloqueio({ tipo: t.id, data: dia, horario: h })
                          toast({
                            message: `${nome} bloqueado.`,
                            actions: [{ label: 'Desfazer', onClick: () => run('desfazer', () => removeBloqueio(novo.id)) }],
                          })
                        }
                      })
                    }
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Um horário de um atendimento: quem está marcado, ou livre/bloqueado. */
function Celula({ tipo, pedidos, bloqueio, fechado, passou, foraDaGrade, busy, onToggle }) {
  const conf = pedidos.find((p) => p.status === 'confirmado')
  const pend = pedidos.filter((p) => p.status === 'pendente')

  const estado = conf
    ? 'confirmado'
    : pend.length
      ? 'pendente'
      : fechado
        ? 'fechado'
        : bloqueio
          ? 'bloqueado'
          : passou
            ? 'encerrado'
            : 'livre'

  const cor =
    {
      confirmado: 'border-emerald-200 bg-emerald-50',
      pendente: 'border-amber-200 bg-amber-50',
      livre: 'border-sand bg-white',
    }[estado] ?? 'border-sand bg-sand/40'

  const podeBloquear = !conf && !fechado && !passou && !foraDaGrade

  return (
    <div className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-sm ${cor}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-wide text-clay uppercase">{tipo.label}</p>
        {conf && (
          <Link to={`/admin/pedidos/${conf.id}`} className="block truncate font-semibold text-emerald-900 hover:underline">
            ✓ {conf.cliente_nome} · {conf.pet_nome}
          </Link>
        )}
        {pend.map((p) => (
          <Link key={p.id} to={`/admin/pedidos/${p.id}`} className="block truncate font-semibold text-amber-900 hover:underline">
            ? #{p.numero} {p.cliente_nome} · aguardando
          </Link>
        ))}
        {estado === 'fechado' && <span className="text-clay">Dia fechado</span>}
        {estado === 'bloqueado' && <span className="text-clay">Bloqueado{bloqueio.tipo ? '' : ' (os dois)'}</span>}
        {estado === 'encerrado' && <span className="text-clay">Encerrado</span>}
        {estado === 'livre' && <span className="text-clay">Livre</span>}
        {foraDaGrade && pedidos.length > 0 && <span className="block text-xs text-amber-800">fora da grade atual</span>}
      </div>
      {podeBloquear && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggle(bloqueio)}
          aria-label={`${bloqueio ? 'Liberar' : 'Bloquear'} ${tipo.label.toLowerCase()}`}
          className="flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-sand-dark bg-white px-2.5 text-xs font-bold text-clay transition-colors hover:border-terracotta-300 hover:text-ink disabled:opacity-50"
        >
          {bloqueio ? <LockOpen size={13} aria-hidden="true" /> : <Lock size={13} aria-hidden="true" />}
          {bloqueio ? 'Liberar' : 'Bloquear'}
        </button>
      )}
    </div>
  )
}

/* ================================================= Próximos agendamentos */

function Proximos({ agora }) {
  const hoje = agora.split('T')[0]
  const [lista, setLista] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    listAgendamentos(hoje, addDays(hoje, DIAS_PROXIMOS)).then(setLista).catch(setError)
  }, [hoje])

  useEffect(() => {
    load()
    return onPedidosChange(load)
  }, [load])

  if (error) {
    return (
      <p className="rounded-card bg-red-50 p-4 text-sm font-semibold text-red-600">
        Não foi possível carregar os agendamentos. Recarregue a página.
      </p>
    )
  }
  if (!lista) return <Skeleton className="h-72 w-full rounded-card" />

  const visiveis = lista.filter((p) => !filtro || p.tipo === filtro)
  const porDia = Object.entries(
    visiveis.reduce((acc, p) => ({ ...acc, [p.data]: [...(acc[p.data] ?? []), p] }), {}),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar">
        {[['', 'Tudo'], ...TIPOS.map((t) => [t.id, t.label])].map(([id, label]) => (
          <button
            key={id || 'tudo'}
            type="button"
            role="tab"
            aria-selected={filtro === id}
            onClick={() => setFiltro(id)}
            className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
              filtro === id ? 'bg-terracotta-500 text-white' : 'border border-sand bg-white text-clay hover:bg-terracotta-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {porDia.length === 0 ? (
        <p className="rounded-card border border-sand bg-white px-4 py-10 text-center text-sm text-clay">
          Nada agendado nos próximos {DIAS_PROXIMOS} dias.
        </p>
      ) : (
        porDia.map(([data, pedidos]) => (
          <section key={data} className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">
              {data === hoje ? 'Hoje · ' : ''}
              {formatData(data)}
            </h2>
            <ul className="flex flex-col divide-y divide-sand overflow-hidden rounded-card border border-sand bg-white">
              {pedidos.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/pedidos/${p.id}`} className="flex items-start gap-3 px-3.5 py-3 hover:bg-cream">
                    <span className="w-12 shrink-0 font-display text-lg font-semibold text-ink">{p.horario}</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-ink">{p.cliente_nome}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS[p.status].className}`}>
                          {STATUS[p.status].label}
                        </span>
                      </p>
                      <p className="truncate text-sm text-clay">
                        {TIPO_LABEL[p.tipo]} · {p.pet_nome}
                        {p.tipo === 'banho_tosa' ? ` · ${p.servico}` : p.observacoes ? ` · ${p.observacoes}` : ''}
                      </p>
                      <p className="text-xs text-clay/80">{formatTelefone(p.cliente_telefone)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

/* ============================================ Horários de funcionamento */

// segunda primeiro, como a equipe pensa a semana
const SEMANA = [
  ['1', 'Segunda'],
  ['2', 'Terça'],
  ['3', 'Quarta'],
  ['4', 'Quinta'],
  ['5', 'Sexta'],
  ['6', 'Sábado'],
  ['0', 'Domingo'],
]

const DURACOES = [15, 20, 30, 40, 45, 50, 60, 75, 90, 120]
const ANTECEDENCIAS = [
  [0, 'Nenhuma'],
  [30, '30 min'],
  [60, '1 hora'],
  [90, '1h30'],
  [120, '2 horas'],
  [180, '3 horas'],
  [240, '4 horas'],
  [720, '12 horas'],
  [1440, '1 dia'],
  [2880, '2 dias'],
]

/** Primeiro problema encontrado na semana, ou null. */
function validarSemana(semana) {
  for (const [dow, nome] of SEMANA) {
    const faixas = semana[dow]
    if (!faixas) continue
    if (faixas.length === 0) return `${nome}: adicione um horário ou marque como fechado.`
    const ordenadas = [...faixas].sort((a, b) => toMinutes(a[0]) - toMinutes(b[0]))
    for (let i = 0; i < ordenadas.length; i++) {
      const [abre, fecha] = ordenadas[i]
      if (!abre || !fecha) return `${nome}: preencha início e fim.`
      if (toMinutes(abre) >= toMinutes(fecha)) return `${nome}: ${abre} precisa ser antes de ${fecha}.`
      if (i > 0 && toMinutes(abre) < toMinutes(ordenadas[i - 1][1]))
        return `${nome}: os horários ${ordenadas[i - 1].join('–')} e ${abre}–${fecha} se sobrepõem.`
    }
  }
  return null
}

/** Uma data qualquer que caia no dia da semana `dow` — só para contar horários. */
function diaDaSemanaIso(dow) {
  const d = new Date(2026, 0, 4, 12) // 04/01/2026 é domingo
  d.setDate(d.getDate() + Number(dow))
  return isoLocal(d)
}

function Horarios({ config, onSaved }) {
  const [draft, setDraft] = useState(() => structuredClone(config))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const mudou = JSON.stringify(draft) !== JSON.stringify(config)

  const setFaixas = (dow, faixas) => {
    setMsg(null)
    setDraft((d) => ({ ...d, semana: { ...d.semana, [dow]: faixas } }))
  }
  const setCampo = (campo, valor) => {
    setMsg(null)
    setDraft((d) => ({ ...d, [campo]: valor }))
  }

  const salvar = async () => {
    const erro = validarSemana(draft.semana)
    if (erro) return setMsg({ tipo: 'erro', texto: erro })
    setSaving(true)
    try {
      // faixas sempre em ordem: o site e o banco percorrem na sequência
      const semana = Object.fromEntries(
        Object.entries(draft.semana).map(([k, v]) => [k, v && [...v].sort((a, b) => toMinutes(a[0]) - toMinutes(b[0]))]),
      )
      const saved = await saveAgendaConfig({ ...draft, semana })
      onSaved(saved)
      setDraft(structuredClone(saved))
      setMsg({ tipo: 'ok', texto: 'Salvo. O site já mostra os novos horários, em banho e tosa e em consultas.' })
    } catch {
      setMsg({ tipo: 'erro', texto: 'Não foi possível salvar. Confira a internet e tente de novo.' })
    } finally {
      setSaving(false)
    }
  }

  const select =
    'min-h-11 w-full rounded-tile border border-sand-dark bg-white px-3 text-ink focus:border-terracotta-500 focus:outline-none'
  const time =
    'min-h-10 w-[6.5rem] rounded-tile border border-sand-dark bg-white px-2 text-ink focus:border-terracotta-500 focus:outline-none'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-clay">Valem para banho e tosa e para consultas.</p>
      <section className="grid gap-4 rounded-card border border-sand bg-white p-4 sm:grid-cols-3 sm:p-5">
        <label className="text-sm font-bold text-ink">
          Intervalo entre horários
          <select value={draft.slot_minutos} onChange={(e) => setCampo('slot_minutos', Number(e.target.value))} className={`${select} mt-1 font-normal`}>
            {DURACOES.map((m) => (
              <option key={m} value={m}>{m} minutos</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          Antecedência mínima
          <select value={draft.antecedencia_minutos} onChange={(e) => setCampo('antecedencia_minutos', Number(e.target.value))} className={`${select} mt-1 font-normal`}>
            {ANTECEDENCIAS.map(([m, l]) => (
              <option key={m} value={m}>{l}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          Dias mostrados no site
          <select value={draft.dias_exibidos} onChange={(e) => setCampo('dias_exibidos', Number(e.target.value))} className={`${select} mt-1 font-normal`}>
            {[5, 7, 10, 14, 21, 30].map((n) => (
              <option key={n} value={n}>{n} dias com atendimento</option>
            ))}
          </select>
        </label>
      </section>

      <section className="flex flex-col divide-y divide-sand rounded-card border border-sand bg-white">
        {SEMANA.map(([dow, nome]) => {
          const faixas = draft.semana[dow]
          const aberto = Boolean(faixas)
          const validas = aberto ? faixas.filter(([a, f]) => a && f && toMinutes(a) < toMinutes(f)) : []
          const qtd = slotsDoDia({ ...draft, semana: { [dow]: validas } }, diaDaSemanaIso(dow)).length
          return (
            <div key={dow} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start">
              <label className="flex w-36 shrink-0 items-center gap-2 pt-2 font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={aberto}
                  onChange={(e) => setFaixas(dow, e.target.checked ? [['08:00', '12:00']] : null)}
                  className="size-4 accent-terracotta-500"
                />
                {nome}
              </label>
              {aberto ? (
                <div className="flex flex-1 flex-col gap-2">
                  {faixas.map(([abre, fecha], i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" step="300" value={abre} aria-label={`${nome}, início`} onChange={(e) => setFaixas(dow, faixas.map((f, j) => (j === i ? [e.target.value, f[1]] : f)))} className={time} />
                      <span className="text-clay">até</span>
                      <input type="time" step="300" value={fecha} aria-label={`${nome}, fim`} onChange={(e) => setFaixas(dow, faixas.map((f, j) => (j === i ? [f[0], e.target.value] : f)))} className={time} />
                      <button type="button" aria-label="Remover faixa" onClick={() => setFaixas(dow, faixas.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-full text-clay hover:bg-red-50 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setFaixas(dow, [...faixas, ['13:30', '18:00']])} className="flex items-center gap-1 text-sm font-semibold text-terracotta-600 hover:underline">
                      <Plus size={15} aria-hidden="true" />
                      Adicionar faixa (ex.: depois do almoço)
                    </button>
                    <span className="text-xs text-clay">{qtd} horários</span>
                  </div>
                </div>
              ) : (
                <p className="pt-2 text-sm text-clay">Fechado</p>
              )}
            </div>
          )
        })}
      </section>

      {msg && (
        <p role="status" className={`rounded-xl px-3 py-2 text-sm font-semibold ${msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-600'}`}>
          {msg.texto}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {mudou && (
          <Button variant="ghost" size="sm" onClick={() => { setDraft(structuredClone(config)); setMsg(null) }}>
            Desfazer alterações
          </Button>
        )}
        <Button onClick={salvar} loading={saving} disabled={!mudou}>
          Salvar horários
        </Button>
      </div>
      <p className="text-xs text-clay">
        Agendamentos já marcados continuam valendo mesmo se o horário sair da grade — eles aparecem no Dia a dia
        como “fora da grade”.
      </p>
    </div>
  )
}

/* ======================================================== Dias fechados */

function Fechados({ hoje }) {
  const [lista, setLista] = useState(null)
  const [data, setData] = useState('')
  const [motivo, setMotivo] = useState('')
  const [tipo, setTipo] = useState('') // '' = os dois
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    listBloqueios(hoje)
      .then((b) => setLista(b.filter((x) => !x.horario)))
      .catch(setError)
  }, [hoje])

  useEffect(load, [load])

  const run = async (key, fn) => {
    setBusy(key)
    setError(null)
    try {
      await fn()
      load()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!data) return
          run('add', async () => {
            await addBloqueio({ tipo: tipo || null, data, motivo: motivo.trim() || null })
            setData('')
            setMotivo('')
          })
        }}
        className="flex flex-col gap-3 rounded-card border border-sand bg-white p-4 sm:p-5"
      >
        <p className="text-sm text-clay">
          Feriados, folgas e recesso: o dia some da agenda do site. Para fechar só um horário, use o Dia a dia.
        </p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Fechar para">
          {[['', 'Tudo'], ...TIPOS.map((t) => [t.id, `Só ${t.label.toLowerCase()}`])].map(([id, label]) => (
            <button
              key={id || 'tudo'}
              type="button"
              role="radio"
              aria-checked={tipo === id}
              onClick={() => setTipo(id)}
              className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${
                tipo === id ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600' : 'border-sand-dark text-clay'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            required
            min={hoje}
            value={data}
            onChange={(e) => setData(e.target.value)}
            aria-label="Data"
            className="min-h-11 rounded-tile border border-sand-dark bg-white px-3 text-ink focus:border-terracotta-500 focus:outline-none"
          />
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (opcional)"
            className="min-h-11 flex-1 rounded-tile border border-sand-dark bg-white px-3 text-ink focus:border-terracotta-500 focus:outline-none"
          />
          <Button type="submit" size="sm" loading={busy === 'add'}>
            <CalendarOff size={16} aria-hidden="true" />
            Fechar dia
          </Button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          Não foi possível salvar. Confira a internet e tente de novo.
        </p>
      )}

      {!lista ? (
        <Skeleton className="h-32 w-full rounded-card" />
      ) : lista.length === 0 ? (
        <p className="rounded-card border border-sand bg-white px-4 py-8 text-center text-sm text-clay">
          Nenhum dia fechado daqui para frente.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-sand rounded-card border border-sand bg-white">
          {lista.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{formatData(b.data)}</p>
                <p className="truncate text-sm text-clay">{[b.motivo, escopo(b)].filter(Boolean).join(' · ')}</p>
              </div>
              <button
                type="button"
                onClick={() => run(b.id, () => removeBloqueio(b.id))}
                disabled={busy === b.id}
                aria-label={`Reabrir ${formatData(b.data)}`}
                className="flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={15} aria-hidden="true" />
                Reabrir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
