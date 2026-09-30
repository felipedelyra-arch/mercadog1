import { createContext, useContext } from 'react'

/**
 * Avisos rápidos do painel ("Pedido confirmado", "Salvo"…), com botões de
 * ação como "Desfazer" ou "Avisar no WhatsApp". O componente que desenha fica
 * em Toasts.jsx; aqui só o contexto e o hook.
 *
 * toast({ message, tone: 'ok' | 'erro' | 'info', actions: [{ label, onClick }], duration })
 */
export const ToastContext = createContext(() => {})

export const useToast = () => useContext(ToastContext)
