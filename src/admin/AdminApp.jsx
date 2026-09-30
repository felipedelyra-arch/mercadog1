import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Home,
  Loader2,
  LogOut,
  Menu,
  Package,
  Scissors,
  Settings,
  ShieldAlert,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from '../components/ui/Logo'
import Button from '../components/ui/Button'
import { countPendentes, getMembro, onPedidoNovo, onPedidosChange, signIn, signOut } from './api'
import { notificar, somLigado, tocarSom } from './alertas'
import { TIPO_LABEL } from './pedidoInfo'
import { useToast } from './toast'
import ToastProvider from './Toasts'
import Inicio from './Inicio'
import Relatorios from './Relatorios'
import Ajustes from './Ajustes'
import Pedidos from './Pedidos'
import Pedido from './Pedido'
import Produtos from './Produtos'
import Agenda from './Agenda'
import Servicos from './Servicos'

/**
 * Painel da equipe em /admin — carregado só quando alguém abre essa rota.
 *
 * O link que chega no WhatsApp (/admin/pedidos/:id) cai aqui: sem login
 * mostra a tela de entrada e, depois de entrar, abre o próprio pedido.
 * O login fica salvo no aparelho, então no dia a dia é só tocar no link.
 */
export default function AdminApp() {
  const [session, setSession] = useState(undefined) // undefined = carregando
  const [membro, setMembro] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setMembro(session === null ? null : undefined)
      return
    }
    setMembro(undefined)
    getMembro(session.user.id)
      .then(setMembro)
      .catch(() => setMembro(null))
  }, [session])

  if (session === undefined || (session && membro === undefined)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream">
        <Loader2 className="animate-spin text-terracotta-500" size={32} aria-label="Carregando" />
      </div>
    )
  }

  if (!session) return <Login />

  if (!membro) {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream px-4">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-card border border-sand bg-white p-8 text-center shadow-warm">
          <ShieldAlert size={36} className="text-terracotta-500" aria-hidden="true" />
          <h1 className="font-display text-2xl font-semibold text-ink">Sem acesso ao painel</h1>
          <p className="text-sm text-clay">
            O e-mail <strong className="text-ink">{session.user.email}</strong> entrou, mas não está
            cadastrado na equipe do Mercadog.
          </p>
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
    <AdminShell membro={membro} email={session.user.email}>
      <Routes>
        <Route index element={<Inicio membro={membro} />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/:id" element={<Pedido />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="servicos" element={<Servicos />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminShell>
    </ToastProvider>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
    } catch {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
    }
  }

  const input =
    'w-full rounded-tile border border-sand-dark bg-white px-4 py-3 text-ink transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none'

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-sand bg-white p-6 shadow-warm sm:p-8"
      >
        <Logo className="h-12 self-center" />
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Painel da equipe</h1>
          <p className="text-sm text-clay">Entre para ver pedidos e cuidar da loja.</p>
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-bold text-ink">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="senha" className="mb-1 block text-sm font-bold text-ink">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>
    </div>
  )
}

function AdminShell({ membro, email, children }) {
  const [pendentes, setPendentes] = useState(0)
  const toast = useToast()
  const navigate = useNavigate()

  // contador de pendentes na aba, atualizado em tempo real
  useEffect(() => {
    const refresh = () => countPendentes().then(setPendentes).catch(() => {})
    refresh()
    return onPedidosChange(refresh)
  }, [])

  // pedido novo: som, notificação do aparelho e aviso na tela, em qualquer aba do painel
  useEffect(
    () =>
      onPedidoNovo((p) => {
        const abrir = () => navigate(`/admin/pedidos/${p.id}`)
        const texto = `${TIPO_LABEL[p.tipo]} · ${p.cliente_nome}`
        if (somLigado()) tocarSom()
        notificar(`Novo pedido #${p.numero}`, texto, abrir)
        toast({
          message: `Novo pedido #${p.numero} — ${texto}`,
          tone: 'info',
          actions: [{ label: 'Abrir', onClick: abrir }],
          duration: 15000,
        })
      }),
    [navigate, toast],
  )

  useEffect(() => {
    document.title = pendentes ? `(${pendentes}) Painel · Mercadog` : 'Painel · Mercadog'
  }, [pendentes])

  const tab = ({ isActive }) =>
    `flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
      isActive ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white'
    }`

  const badge = pendentes > 0 && (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-terracotta-500 px-1 text-[11px] font-bold text-white">
      {pendentes}
    </span>
  )

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-40 bg-ink">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 lg:py-3">
          <Link to="/" aria-label="Ver o site" className="shrink-0">
            <Logo className="h-9 lg:h-10" variant="light" />
          </Link>
          {/* computador: abas no topo */}
          <nav aria-label="Painel" className="hidden gap-1 lg:flex">
            {ABAS.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={tab}>
                <Icon size={17} aria-hidden="true" />
                {label}
                {to === '/admin/pedidos' && badge}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span className="min-w-0 text-right text-xs leading-tight text-white/70">
              <strong className="block truncate text-sm text-white">{membro.nome}</strong>
              <span className="hidden truncate sm:block">{email}</span>
            </span>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sair do painel"
              className="tap hidden size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 lg:grid"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:py-8 lg:pb-24">
        {children}
      </main>
      <BarraInferior badge={badge} />
    </div>
  )
}

const ABAS = [
  { to: '/admin', label: 'Início', Icon: Home, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', Icon: ClipboardList },
  { to: '/admin/agenda', label: 'Agenda', Icon: CalendarDays },
  { to: '/admin/servicos', label: 'Serviços', Icon: Scissors },
  { to: '/admin/produtos', label: 'Produtos', Icon: Package },
  { to: '/admin/relatorios', label: 'Relatórios', Icon: BarChart3 },
  { to: '/admin/ajustes', label: 'Ajustes', Icon: Settings },
]
// no celular, as quatro do dia a dia ficam na barra; o resto vai no "Mais"
const NA_BARRA = ['/admin', '/admin/pedidos', '/admin/agenda', '/admin/produtos']

/** Barra de abas fixa no rodapé do celular, ao alcance do polegar. */
function BarraInferior({ badge }) {
  const { pathname } = useLocation()
  const [maisAberto, setMaisAberto] = useState(false)
  const extras = ABAS.filter((a) => !NA_BARRA.includes(a.to))
  const emExtra = extras.some((a) => pathname.startsWith(a.to))

  // fecha o "Mais" ao trocar de tela
  useEffect(() => setMaisAberto(false), [pathname])

  const item = (ativo) =>
    `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
      ativo ? 'text-terracotta-600' : 'text-clay'
    }`

  return (
    <>
      <nav
        aria-label="Painel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-lg">
          {ABAS.filter((a) => NA_BARRA.includes(a.to)).map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => item(isActive)}>
              <span className="relative">
                <Icon size={22} aria-hidden="true" />
                {to === '/admin/pedidos' && badge && <span className="absolute -top-2 -right-3">{badge}</span>}
              </span>
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            aria-expanded={maisAberto}
            onClick={() => setMaisAberto((v) => !v)}
            className={item(emExtra || maisAberto)}
          >
            <Menu size={22} aria-hidden="true" />
            Mais
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {maisAberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMaisAberto(false)}
              className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-card border border-sand bg-white shadow-warm-xl lg:hidden"
            >
              <ul className="flex flex-col divide-y divide-sand">
                {extras.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `flex min-h-13 items-center gap-3 px-4 font-semibold ${isActive ? 'text-terracotta-600' : 'text-ink'}`
                      }
                    >
                      <Icon size={20} aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <Link to="/" className="flex min-h-13 items-center gap-3 px-4 font-semibold text-ink">
                    <ExternalLink size={20} aria-hidden="true" />
                    Ver o site
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex min-h-13 w-full items-center gap-3 px-4 font-semibold text-red-600"
                  >
                    <LogOut size={20} aria-hidden="true" />
                    Sair do painel
                  </button>
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
