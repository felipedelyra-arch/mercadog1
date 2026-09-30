import { lazy, Suspense, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/layout/ScrollToTop'
import WhatsAppFloat from './components/WhatsAppFloat'
import CartDrawer from './components/CartDrawer'
import CartBar from './components/CartBar'
import ErrorBoundary from './components/ErrorBoundary'
import { CartProvider } from './context/CartContext'
import { desligarRolagemSuave, ligarRolagemSuave } from './lib/smoothScroll'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

// Home vai junto com o site (é a porta de entrada); as outras páginas baixam
// só quando alguém abre — a primeira visita fica mais leve no 4G.
const Agendamento = lazy(() => import('./pages/Agendamento'))
const Consultas = lazy(() => import('./pages/Consultas'))
const Loja = lazy(() => import('./pages/Loja'))
const Privacidade = lazy(() => import('./pages/Privacidade'))

// Painel da equipe: baixado só por quem abre /admin — o cliente não paga por ele
const AdminApp = lazy(() => import('./admin/AdminApp'))

/**
 * Rotas com transição de página: o AnimatePresence precisa da location como
 * key para animar a saída da página anterior antes de montar a nova.
 */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense key={location.pathname} fallback={<div className="min-h-screen pt-20" />}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/agendamento" element={<Agendamento />} />
          <Route path="/consultas" element={<Consultas />} />
          <Route path="/loja" element={<Loja />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

/** Site público: navbar, rodapé, carrinho e botão flutuante do WhatsApp. */
function PublicSite() {
  // rolagem suave só no site público; o painel fica com a nativa
  useEffect(() => {
    ligarRolagemSuave()
    return desligarRolagemSuave
  }, [])

  return (
    <CartProvider>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-terracotta-500 focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <div id="conteudo">
        <AnimatedRoutes />
        <Footer />
      </div>
      <WhatsAppFloat />
      <CartBar />
      <CartDrawer />
    </CartProvider>
  )
}

export default function App() {
  return (
    // reducedMotion="user" faz TODAS as animações respeitarem prefers-reduced-motion
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense
                  fallback={
                    <div className="grid min-h-dvh place-items-center bg-cream">
                      <Loader2 className="animate-spin text-terracotta-500" size={32} aria-label="Carregando" />
                    </div>
                  }
                >
                  <AdminApp />
                </Suspense>
              }
            />
            <Route path="*" element={<PublicSite />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </MotionConfig>
  )
}
