import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Rolagem suave da roda do mouse/trackpad (Lenis), só no site público.
 *
 * - Celular e tablet ficam com a rolagem nativa (já é suave e o usuário
 *   espera o "peso" do próprio aparelho) — só liga com ponteiro fino.
 * - Desliga para quem pede menos movimento no sistema.
 * - Menu e carrinho chamam pausar/retomar para a página de trás não rolar.
 */
let lenis = null

export function ligarRolagemSuave() {
  if (lenis || typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!window.matchMedia('(pointer: fine)').matches) return
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true, autoRaf: true })
}

export function desligarRolagemSuave() {
  lenis?.destroy()
  lenis = null
}

export const pausarRolagem = () => lenis?.stop()
export const retomarRolagem = () => lenis?.start()

/** Topo da página na hora (troca de rota), sem animar. */
export function irParaOTopo() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo({ top: 0, behavior: 'instant' })
}
