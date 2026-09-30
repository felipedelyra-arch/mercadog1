import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { ToastContext } from './toast'

let seq = 0

const TONS = {
  ok: 'bg-ink text-white',
  info: 'bg-terracotta-600 text-white',
  erro: 'bg-red-600 text-white',
}

/**
 * Pilha de avisos no rodapé do painel. Cada aviso some sozinho depois de
 * `duration` ms (padrão 5 s) — tempo para um "Desfazer".
 */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ message, tone = 'ok', actions = [], duration = 5000 }) => {
      const id = ++seq
      // no máximo 3 na tela: o mais antigo sai
      setToasts((list) => [...list.slice(-2), { id, message, tone, actions }])
      if (duration) timers.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 px-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-6"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl py-2.5 pr-2 pl-4 shadow-warm-xl ${TONS[t.tone]}`}
            >
              <p className="min-w-0 flex-1 text-sm font-semibold">{t.message}</p>
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.onClick()
                    dismiss(t.id)
                  }}
                  className="min-h-9 shrink-0 rounded-full bg-white/15 px-3 text-sm font-bold transition-colors hover:bg-white/25"
                >
                  {a.label}
                </button>
              ))}
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() => dismiss(t.id)}
                className="grid size-8 shrink-0 place-items-center rounded-full opacity-70 hover:bg-white/15 hover:opacity-100"
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
