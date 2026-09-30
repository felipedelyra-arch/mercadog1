/**
 * Alerta de pedido novo: som curto + notificação do navegador/celular.
 * A preferência de som fica no aparelho (cada pessoa liga ou desliga no seu).
 */
const SOM_KEY = 'mercadog:alerta-som'

export function somLigado() {
  try {
    return localStorage.getItem(SOM_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSomLigado(ligado) {
  try {
    localStorage.setItem(SOM_KEY, ligado ? 'on' : 'off')
  } catch {
    // sem storage: vale só até recarregar
  }
}

/** "Plim-plim" gerado na hora — sem arquivo de áudio para baixar. */
export function tocarSom() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[
      [880, 0],
      [1320, 0.18],
    ].forEach(([freq, start]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.4)
    })
    setTimeout(() => ctx.close(), 1000)
  } catch {
    // navegador sem áudio: segue só com o aviso visual
  }
}

export const notificacoesSuportadas = () => typeof window !== 'undefined' && 'Notification' in window

export const notificacoesPermitidas = () =>
  notificacoesSuportadas() && Notification.permission === 'granted'

/** Pede permissão (precisa vir de um toque do usuário). Devolve true se liberou. */
export async function pedirPermissaoNotificacao() {
  if (!notificacoesSuportadas()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

/** Notificação do sistema — só quando o painel não está na frente da pessoa. */
export function notificar(titulo, corpo, onClick) {
  if (!notificacoesPermitidas() || document.visibilityState === 'visible') return
  try {
    const n = new Notification(titulo, { body: corpo, icon: '/favicon.png', tag: titulo })
    n.onclick = () => {
      window.focus()
      onClick?.()
      n.close()
    }
  } catch {
    // alguns celulares só notificam via service worker: fica o som e o aviso na tela
  }
}
