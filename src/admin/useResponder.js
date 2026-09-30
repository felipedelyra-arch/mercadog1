import { useCallback } from 'react'
import { desfazerResposta, responderPedido } from './api'
import { mensagemCliente, whatsCliente } from './pedidoInfo'
import { useToast } from './toast'

const VERBO = {
  confirmado: 'confirmado',
  recusado: 'recusado',
  concluido: 'marcado como concluído',
  pendente: 'reaberto',
}

/**
 * Responder um pedido de qualquer tela do painel. Depois de salvar, mostra
 * um aviso com "Avisar no WhatsApp" (resposta já escrita) e "Desfazer".
 * `onChange(pedidoAtualizado)` é chamado depois de salvar e depois de desfazer.
 */
export function useResponder(onChange) {
  const toast = useToast()

  return useCallback(
    async (pedido, status, nota = pedido.nota_interna) => {
      try {
        const atualizado = await responderPedido(pedido.id, status, nota)
        onChange?.(atualizado)

        const actions = []
        if (status === 'confirmado' || status === 'recusado') {
          actions.push({
            label: 'Avisar no WhatsApp',
            onClick: () =>
              window.open(whatsCliente(atualizado, mensagemCliente(atualizado, status)), '_blank', 'noopener'),
          })
        }
        actions.push({
          label: 'Desfazer',
          onClick: async () => {
            try {
              onChange?.(await desfazerResposta(pedido))
              toast({ message: `Pedido #${pedido.numero} voltou como estava.`, tone: 'info' })
            } catch {
              toast({ message: 'Não foi possível desfazer. Confira a internet.', tone: 'erro' })
            }
          },
        })

        toast({ message: `Pedido #${pedido.numero} ${VERBO[status]}.`, actions, duration: 8000 })
        return atualizado
      } catch {
        toast({ message: 'Não foi possível salvar. Confira a internet e tente de novo.', tone: 'erro' })
        return null
      }
    },
    [onChange, toast],
  )
}
