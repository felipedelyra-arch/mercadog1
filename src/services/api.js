/**
 * Camada de serviços — única porta de entrada de dados para as páginas.
 *
 * Do Supabase: loja (produtos e categorias), serviços de banho e tosa,
 * pedidos, agenda (grade, bloqueios e horários já confirmados) e equipe
 * veterinária. De `src/data/consultas.js`: a consulta genérica.
 *
 * Carrinho e agendamento são gravados como pedido "pendente" e seguem pelo
 * WhatsApp com o número do pedido; a equipe confirma no painel (/admin).
 */
import { supabase } from '../lib/supabase'
import { generateSchedule } from '../data/schedule'

/** Serviços de banho e tosa ativos, na ordem definida no painel. */
export async function getServices() {
  const { data, error } = await supabase
    .from('servicos')
    .select('id, nome, descricao, duracao, icon, precos')
    .eq('ativo', true)
    .order('ordem')
    .order('nome')
  if (error) throw error
  return data
}

/** Veterinários ativos, na ordem definida no painel. */
export async function getVets() {
  const { data, error } = await supabase
    .from('veterinarios')
    .select('id, nome, crmv, especialidade')
    .eq('ativo', true)
    .order('ordem')
    .order('nome')
  if (error) throw error
  return data
}

/** Catálogo completo, já com label e ícone da categoria (join). */
export async function getProducts() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(label, icon)')
    .order('nome')
  if (error) throw error
  return data
}

/** Categorias na ordem dos filtros da loja. */
export async function getCategories() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, label, icon')
    .order('ordem')
    .order('label')
  if (error) throw error
  return data
}

/** Tipo do pedido no banco para cada agenda do site. */
export const TIPO_AGENDA = { servico: 'banho_tosa', consulta: 'consulta' }

/**
 * Horários exibidos por contexto ('servico' | 'consulta'), já sem os dias
 * fechados, os horários bloqueados e os confirmados para outro cliente.
 * Grade, bloqueios e hora atual vêm do banco (agenda_publica) — é a mesma
 * fonte que o painel edita e que o criar_pedido usa para validar.
 */
export async function getAvailableSlots(context) {
  const { data, error } = await supabase.rpc('agenda_publica', { p_tipo: TIPO_AGENDA[context] })
  if (error) throw error
  if (!data?.config) return []
  return generateSchedule(data)
}

/** Mensagens de erro do criar_pedido traduzidas para o cliente. */
const PEDIDO_ERROS = {
  horario_ocupado: 'Esse horário acabou de ser reservado. Escolha outro, por favor.',
  horario_bloqueado: 'Esse horário acabou de ser fechado pela equipe. Escolha outro, por favor.',
  horario_fora_da_agenda: 'A agenda mudou enquanto você escolhia. Escolha o horário de novo, por favor.',
  horario_em_cima_da_hora: 'Esse horário está muito próximo. Escolha um um pouco mais tarde.',
  muitos_pedidos: 'Recebemos vários pedidos deste telefone. Fale com a gente pelo WhatsApp.',
  limite_pedidos: 'Recebemos muitos pedidos em pouco tempo. Fale com a gente pelo WhatsApp.',
  produto_sem_estoque: 'Um item do carrinho acabou de sair de estoque. Confira o carrinho.',
  produto_inexistente: 'Um item do carrinho não está mais na loja. Confira o carrinho.',
  telefone_invalido: 'Confira o telefone com DDD.',
  endereco_invalido: 'Informe o endereço de entrega completo.',
}

/**
 * Grava o pedido (carrinho ou agendamento) e devolve { id, numero }.
 * O preço dos produtos é recalculado no banco — o carrinho manda só id e
 * quantidade.
 */
export async function criarPedido(pedido) {
  const { data, error } = await supabase.rpc('criar_pedido', { p: pedido })
  if (error) {
    const code = Object.keys(PEDIDO_ERROS).find((k) => error.message?.includes(k))
    throw new Error(
      PEDIDO_ERROS[code] ?? 'Não conseguimos registrar o pedido. Tente de novo em instantes.',
    )
  }
  return data
}

const CANCELAMENTO_ERROS = {
  pedido_inexistente: 'Não encontramos este pedido. Confira o link.',
  nao_cancelavel:
    'Este pedido não pode mais ser cancelado pelo site. Fale com a gente pelo WhatsApp.',
}

/** Pedido pelo código secreto do link /pedido/<código>; null se não existir. */
export async function verPedido(codigo) {
  const { data, error } = await supabase.rpc('ver_pedido', { p_codigo: codigo })
  if (error) throw new Error('Não conseguimos carregar o pedido. Tente de novo em instantes.')
  return data
}

/** Cancela pelo código e devolve o pedido já atualizado. */
export async function cancelarPedido(codigo, motivo) {
  const { data, error } = await supabase.rpc('cancelar_pedido', { p_codigo: codigo, p_motivo: motivo })
  if (error) {
    const code = Object.keys(CANCELAMENTO_ERROS).find((k) => error.message?.includes(k))
    throw new Error(CANCELAMENTO_ERROS[code] ?? 'Não conseguimos cancelar agora. Tente de novo em instantes.')
  }
  return data
}
