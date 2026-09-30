import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '../components/ui/Skeleton'
import { formatPrice } from '../utils/format'
import { listPedidosDesde } from './api'

const PERIODOS = [
  [7, '7 dias'],
  [30, '30 dias'],
  [90, '90 dias'],
]

// dia do pedido no horário da loja (o banco guarda em UTC)
const DIA_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
const CURTO_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
const diaLoja = (ts) => DIA_FMT.format(new Date(ts))

const atendido = (p) => p.status === 'confirmado' || p.status === 'concluido'

/**
 * Números do período: quanto chegou, quanto foi atendido, vendas da loja
 * (estimadas pelos pedidos confirmados), o que mais sai e agendamentos.
 */
export default function Relatorios() {
  const [dias, setDias] = useState(30)
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setPedidos(null)
    const desde = new Date(Date.now() - dias * 86_400_000).toISOString()
    listPedidosDesde(desde).then(setPedidos).catch(setError)
  }, [dias])

  const r = useMemo(() => (pedidos ? calcular(pedidos, dias) : null), [pedidos, dias])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Relatórios</h1>
          <p className="text-sm text-clay">Pedidos recebidos pelo site nos últimos {dias} dias.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-sand bg-white p-1" role="tablist" aria-label="Período">
          {PERIODOS.map(([n, label]) => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={dias === n}
              onClick={() => setDias(n)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                dias === n ? 'bg-terracotta-500 text-white' : 'text-clay hover:bg-terracotta-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-card bg-red-50 p-4 text-sm font-semibold text-red-600">
          Não foi possível carregar os relatórios. Confira a internet e recarregue a página.
        </p>
      ) : !r ? (
        <Skeleton className="h-96 w-full rounded-card" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            <Numero label="Pedidos recebidos" valor={r.total} />
            <Numero
              label="Atendidos"
              valor={r.atendidos}
              detalhe={r.total ? `${Math.round((r.atendidos / r.total) * 100)}% dos recebidos` : null}
            />
            <Numero label="Vendas da loja" valor={formatPrice(r.vendas)} detalhe="pedidos confirmados, estimado" />
            <Numero label="Agendamentos" valor={r.banho + r.consulta} detalhe={`${r.banho} banho e tosa · ${r.consulta} consultas`} />
          </div>

          <section className="rounded-card border border-sand bg-white p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Pedidos por dia</h2>
            <p className="mb-3 text-sm text-clay">Toque ou passe o mouse numa barra para ver o dia.</p>
            <BarrasPorDia serie={r.porDia} />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Ranking
              titulo="Produtos mais pedidos"
              subtitulo="Unidades em pedidos atendidos"
              itens={r.topProdutos}
              vazio="Nenhum produto vendido no período."
            />
            <Ranking
              titulo="Banho e tosa mais agendados"
              subtitulo="Agendamentos que não foram recusados"
              itens={r.topServicos}
              vazio="Nenhum banho ou tosa no período."
            />
          </div>
        </>
      )}
    </div>
  )
}

function calcular(pedidos, dias) {
  const validos = pedidos.filter((p) => p.status !== 'recusado')
  const atendidos = pedidos.filter(atendido)

  // série diária contínua (dias sem pedido aparecem com zero)
  const contagem = pedidos.reduce((acc, p) => {
    const d = diaLoja(p.created_at)
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})
  const porDia = Array.from({ length: dias }, (_, i) => {
    const d = diaLoja(Date.now() - (dias - 1 - i) * 86_400_000)
    return { dia: d, valor: contagem[d] ?? 0 }
  })

  const produtos = {}
  for (const p of atendidos.filter((x) => x.tipo === 'loja')) {
    for (const i of p.itens ?? []) produtos[i.nome] = (produtos[i.nome] ?? 0) + i.quantidade
  }

  const servicos = {}
  for (const p of validos.filter((x) => x.tipo === 'banho_tosa')) {
    // "Banho (porte médio, R$ 75,00)" → "Banho"
    const nome = (p.servico ?? 'Serviço').split(' (')[0]
    servicos[nome] = (servicos[nome] ?? 0) + 1
  }

  const top = (obj) =>
    Object.entries(obj)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)

  return {
    total: pedidos.length,
    atendidos: atendidos.length,
    vendas: atendidos.filter((p) => p.tipo === 'loja').reduce((s, p) => s + Number(p.total ?? 0), 0),
    banho: validos.filter((p) => p.tipo === 'banho_tosa').length,
    consulta: validos.filter((p) => p.tipo === 'consulta').length,
    porDia,
    topProdutos: top(produtos),
    topServicos: top(servicos),
  }
}

function Numero({ label, valor, detalhe }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-card border border-sand bg-white p-3.5 sm:p-4">
      <span className="text-xs font-semibold text-clay sm:text-sm">{label}</span>
      <span className="font-display text-2xl font-semibold text-ink sm:text-3xl">{valor}</span>
      {detalhe && <span className="text-xs text-clay">{detalhe}</span>}
    </div>
  )
}

/** Barras verticais, uma por dia; o dia em foco mostra data e número. */
function BarrasPorDia({ serie }) {
  const [foco, setFoco] = useState(null)
  const max = Math.max(1, ...serie.map((d) => d.valor))
  const ativo = foco ?? serie.length - 1
  const d = serie[ativo]
  // rótulos do eixo: primeiro, meio e último dia
  const marcas = new Set([0, Math.floor((serie.length - 1) / 2), serie.length - 1])

  return (
    <div>
      <p className="mb-2 text-sm text-ink" aria-live="polite">
        <strong>{CURTO_FMT.format(new Date(`${d.dia}T00:00:00Z`))}</strong>:{' '}
        {d.valor} {d.valor === 1 ? 'pedido' : 'pedidos'}
      </p>
      <div
        className="flex h-40 items-end gap-[2px] border-b border-sand"
        onMouseLeave={() => setFoco(null)}
        role="img"
        aria-label={`Pedidos por dia: ${serie.map((x) => `${x.dia} ${x.valor}`).join(', ')}`}
      >
        {serie.map((x, i) => (
          <button
            key={x.dia}
            type="button"
            tabIndex={-1}
            onMouseEnter={() => setFoco(i)}
            onClick={() => setFoco(i)}
            aria-label={`${x.dia}: ${x.valor}`}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={`w-full rounded-t-[4px] transition-colors ${
                i === ativo ? 'bg-terracotta-600' : 'bg-terracotta-300 group-hover:bg-terracotta-400'
              }`}
              style={{ height: x.valor ? `${Math.max(4, (x.valor / max) * 100)}%` : '2px' }}
            />
          </button>
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-clay">
        {/* primeiro rótulo colado à esquerda e último à direita: não vazam da tela no celular */}
        {[...marcas].map((i) => (
          <span
            key={i}
            className={`absolute whitespace-nowrap ${i === 0 ? '' : i === serie.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: i === 0 ? 0 : i === serie.length - 1 ? '100%' : `${((i + 0.5) / serie.length) * 100}%` }}
          >
            {CURTO_FMT.format(new Date(`${serie[i].dia}T00:00:00Z`))}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Lista ordenada com barra proporcional — o número fica escrito ao lado. */
function Ranking({ titulo, subtitulo, itens, vazio }) {
  const max = Math.max(1, ...itens.map((i) => i.valor))
  return (
    <section className="rounded-card border border-sand bg-white p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold text-ink">{titulo}</h2>
      <p className="mb-3 text-sm text-clay">{subtitulo}</p>
      {itens.length === 0 ? (
        <p className="py-6 text-center text-sm text-clay">{vazio}</p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {itens.map((i) => (
            <li key={i.nome} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">{i.nome}</span>
                <span className="shrink-0 font-semibold text-ink">{i.valor}</span>
              </div>
              <span className="h-2 w-full overflow-hidden rounded-full bg-cream">
                <span className="block h-full rounded-full bg-terracotta-400" style={{ width: `${(i.valor / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
