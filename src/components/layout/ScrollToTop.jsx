import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { irParaOTopo } from '../../lib/smoothScroll'

/** Volta ao topo a cada troca de rota (comportamento esperado de site multi-página). */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    irParaOTopo()
  }, [pathname])
  return null
}
