import { Component } from 'react'

/**
 * Rede de segurança: se algum componente quebrar, mostra uma mensagem com
 * botão de recarregar em vez de deixar a página inteira em branco.
 * O detalhe técnico fica visível para a equipe copiar e mandar para o suporte.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[mercadog] erro na tela:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-dvh place-items-center bg-cream px-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-card border border-sand bg-white p-8 text-center shadow-warm">
          <h1 className="font-display text-2xl font-semibold text-ink">Algo deu errado</h1>
          <p className="text-sm text-clay">
            Recarregue a página. Se continuar, fale com a gente pelo WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-11 rounded-full bg-terracotta-500 px-6 font-semibold text-white hover:bg-terracotta-600"
          >
            Recarregar
          </button>
          <details className="w-full text-left text-xs text-clay">
            <summary className="cursor-pointer">Detalhes técnicos</summary>
            <pre className="mt-2 overflow-auto rounded-xl bg-cream p-3 whitespace-pre-wrap">
              {String(error?.stack || error)}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
