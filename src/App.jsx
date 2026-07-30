import { AnimatePresence, MotionConfig } from 'framer-motion'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/layout/ScrollToTop'
import WhatsAppFloat from './components/WhatsAppFloat'
import Home from './pages/Home'
import Agendamento from './pages/Agendamento'
import Consultas from './pages/Consultas'
import Loja from './pages/Loja'
import ConfirmarAgendamento from './pages/ConfirmarAgendamento'
import NotFound from './pages/NotFound'

/**
 * Rotas com transição de página: o AnimatePresence precisa da location como
 * key para animar a saída da página anterior antes de montar a nova.
 */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/agendamento" element={<Agendamento />} />
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/loja" element={<Loja />} />
        {/* Link que a clínica recebe no WhatsApp para confirmar o horário */}
        <Route path="/a/:token" element={<ConfirmarAgendamento />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    // reducedMotion="user" faz TODAS as animações respeitarem prefers-reduced-motion
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
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
      </BrowserRouter>
    </MotionConfig>
  )
}
