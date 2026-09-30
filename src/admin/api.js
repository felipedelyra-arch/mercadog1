/**
 * Dados do painel da equipe. Tudo aqui exige login de alguém cadastrado na
 * tabela `equipe` — as policies do banco recusam o resto (ver
 * supabase/002_equipe_pedidos.sql).
 */
import { PRODUCTS_BUCKET, supabase } from '../lib/supabase'

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

/* ---------------------------------------------------------------- sessão */

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
    if (error) throw error
  })

export const signOut = () => supabase.auth.signOut()

/** Registro do usuário logado na equipe, ou null se ele não faz parte. */
export async function getMembro(userId) {
  return unwrap(
    await supabase.from('equipe').select('nome, papel').eq('user_id', userId).maybeSingle(),
  )
}

/* --------------------------------------------------------------- pedidos */

export async function listPedidos(status) {
  let query = supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)
  return unwrap(await query)
}

export async function countPendentes() {
  const { count, error } = await supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')
  if (error) throw error
  return count
}

export async function getPedido(id) {
  return unwrap(await supabase.from('pedidos').select('*').eq('id', id).maybeSingle())
}

/** Outros agendamentos confirmados no mesmo dia e horário (aviso de conflito). */
export async function conflitos(pedido) {
  if (!pedido.data) return []
  return unwrap(
    await supabase
      .from('pedidos')
      .select('id, numero, cliente_nome')
      .eq('tipo', pedido.tipo)
      .eq('data', pedido.data)
      .eq('horario', pedido.horario)
      .eq('status', 'confirmado')
      .neq('id', pedido.id),
  )
}

export async function responderPedido(id, status, notaInterna) {
  const { data: auth } = await supabase.auth.getUser()
  return unwrap(
    await supabase
      .from('pedidos')
      .update({
        status,
        nota_interna: notaInterna?.trim() || null,
        respondido_por: auth.user?.id ?? null,
        respondido_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single(),
  )
}

/**
 * Avisa quando qualquer pedido muda (novo, confirmado…). Devolve o "desligar".
 * Cada chamada precisa de canal com nome próprio: com nome repetido o
 * Supabase devolve o canal já inscrito, e adicionar ouvinte nele lança erro.
 */
export function onPedidosChange(callback) {
  const channel = supabase
    .channel(`pedidos-painel-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

/** Só pedidos novos (INSERT) — dispara o alerta de som e notificação. */
export function onPedidoNovo(callback) {
  const channel = supabase
    .channel(`pedidos-novos-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, ({ new: pedido }) =>
      callback(pedido),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

/** Volta um pedido exatamente como estava antes de uma resposta (botão "Desfazer"). */
export async function desfazerResposta(anterior) {
  return unwrap(
    await supabase
      .from('pedidos')
      .update({
        status: anterior.status,
        nota_interna: anterior.nota_interna,
        respondido_por: anterior.respondido_por,
        respondido_em: anterior.respondido_em,
      })
      .eq('id', anterior.id)
      .select()
      .single(),
  )
}

/** Pedidos criados de `desde` (ISO) em diante — base dos relatórios. */
export async function listPedidosDesde(desde) {
  return unwrap(
    await supabase
      .from('pedidos')
      .select('id, numero, tipo, status, itens, total, servico, data, created_at')
      .gte('created_at', desde)
      .order('created_at')
      .limit(5000),
  )
}

export async function countSemEstoque() {
  const { count, error } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .eq('disponivel', false)
  if (error) throw error
  return count
}

/* ------------------------------------------------------------ categorias */

export async function listCategorias() {
  return unwrap(await supabase.from('categorias').select('*, produtos(count)').order('ordem').order('label'))
}

export async function saveCategoria(categoria, { nova = false } = {}) {
  const { id, label, icon, ordem } = categoria
  const query = nova
    ? supabase.from('categorias').insert({ id, label, icon, ordem })
    : supabase.from('categorias').update({ label, icon, ordem }).eq('id', id)
  return unwrap(await query.select('*, produtos(count)').single())
}

/** Só apaga categoria vazia — o banco recusa se ainda houver produto nela. */
export async function deleteCategoria(id) {
  unwrap(await supabase.from('categorias').delete().eq('id', id))
}

/* ------------------------------------------------------- dados da loja */

export async function getSiteConfig() {
  return unwrap(await supabase.from('site_config').select('dados').eq('id', 1).single()).dados
}

export async function saveSiteConfig(dados) {
  return unwrap(await supabase.from('site_config').update({ dados }).eq('id', 1).select('dados').single()).dados
}

/* --------------------------------------------------- equipe veterinária */

export async function listVeterinarios() {
  return unwrap(await supabase.from('veterinarios').select('*').order('ordem').order('nome'))
}

export async function saveVeterinario(vet) {
  const { id, nome, crmv, especialidade, ordem, ativo } = vet
  const row = { nome, crmv, especialidade, ordem, ativo }
  const query = id
    ? supabase.from('veterinarios').update(row).eq('id', id)
    : supabase.from('veterinarios').insert(row)
  return unwrap(await query.select().single())
}

export async function deleteVeterinario(id) {
  unwrap(await supabase.from('veterinarios').delete().eq('id', id))
}

/** Quem tem acesso ao painel (só leitura — incluir gente nova é pelo Supabase). */
export async function listEquipe() {
  return unwrap(await supabase.from('equipe').select('nome, papel, created_at').order('created_at'))
}

/* -------------------------------------------------------------- produtos */

export async function listProdutos() {
  return unwrap(
    await supabase
      .from('produtos')
      .select('*, categorias(label, icon)')
      .order('nome'),
  )
}

const PRODUTO_CAMPOS = ['nome', 'detalhes', 'categoria', 'preco', 'destaque', 'disponivel', 'image', 'exige_receita']

/** Cria (sem id) ou atualiza (com id) um produto. */
export async function saveProduto(produto) {
  const row = Object.fromEntries(PRODUTO_CAMPOS.filter((k) => k in produto).map((k) => [k, produto[k]]))
  const query = produto.id
    ? supabase.from('produtos').update(row).eq('id', produto.id)
    : supabase.from('produtos').insert(row)
  return unwrap(await query.select('*, categorias(label, icon)').single())
}

export async function deleteProduto(produto) {
  unwrap(await supabase.from('produtos').delete().eq('id', produto.id))
  if (produto.image && !/^https?:/.test(produto.image)) {
    await supabase.storage.from(PRODUCTS_BUCKET).remove([produto.image])
  }
}

/**
 * Sobe a foto para o bucket e devolve o caminho a gravar em `produtos.image`.
 * Espera o arquivo já passado por prepararFoto (./foto.js).
 */
export async function uploadFoto(file) {
  const ext = { 'image/webp': 'webp', 'image/png': 'png' }[file.type] ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  unwrap(
    await supabase.storage
      .from(PRODUCTS_BUCKET)
      .upload(path, file, { cacheControl: '31536000', contentType: file.type }),
  )
  return path
}

export async function removeFoto(path) {
  if (path && !/^https?:/.test(path)) await supabase.storage.from(PRODUCTS_BUCKET).remove([path])
}

/* ---------------------------------------------------------------- agenda */

/*
 * Uma grade só (linha 'geral' de agenda_config) vale para banho/tosa e
 * consultas; a ocupação é separada por tipo (atendentes x veterinário).
 */

export async function getAgendaConfig() {
  return unwrap(await supabase.from('agenda_config').select('*').eq('tipo', 'geral').single())
}

export async function saveAgendaConfig(config) {
  const { slot_minutos, antecedencia_minutos, dias_exibidos, semana } = config
  return unwrap(
    await supabase
      .from('agenda_config')
      .update({ slot_minutos, antecedencia_minutos, dias_exibidos, semana })
      .eq('tipo', 'geral')
      .select()
      .single(),
  )
}

/** Bloqueios de `desde` em diante — dos dois tipos e os que valem para ambos (tipo null). */
export async function listBloqueios(desde) {
  return unwrap(
    await supabase
      .from('agenda_bloqueios')
      .select('*')
      .gte('data', desde)
      .order('data')
      .order('horario', { nullsFirst: true }),
  )
}

/** tipo null = vale para banho/tosa e consultas. */
export async function addBloqueio({ tipo = null, data, horario = null, motivo = null }) {
  return unwrap(
    await supabase.from('agenda_bloqueios').insert({ tipo, data, horario, motivo }).select().single(),
  )
}

export async function removeBloqueio(id) {
  unwrap(await supabase.from('agenda_bloqueios').delete().eq('id', id))
}

/** Agendamentos (banho/tosa e consultas) aguardando ou confirmados entre duas datas. */
export async function listAgendamentos(de, ate) {
  return unwrap(
    await supabase
      .from('pedidos')
      .select('id, numero, tipo, status, cliente_nome, cliente_telefone, pet_nome, servico, observacoes, data, horario')
      .in('tipo', ['banho_tosa', 'consulta'])
      .in('status', ['pendente', 'confirmado'])
      .gte('data', de)
      .lte('data', ate)
      .order('data')
      .order('horario'),
  )
}

/** Hora local da loja (mesma que o site usa), para o painel não depender do relógio do aparelho. */
export async function getAgoraLoja() {
  const data = unwrap(await supabase.rpc('agenda_publica', { p_tipo: 'banho_tosa' }))
  return data.agora
}

/* -------------------------------------------------------------- serviços */

/** Todos os serviços de banho e tosa, inclusive os desativados. */
export async function listServicos() {
  return unwrap(await supabase.from('servicos').select('*').order('ordem').order('nome'))
}

const SERVICO_CAMPOS = ['nome', 'descricao', 'duracao', 'icon', 'precos', 'ordem', 'ativo']

/** Cria (novo = true, com `id` já gerado) ou atualiza um serviço. */
export async function saveServico(servico, { novo = false } = {}) {
  const row = Object.fromEntries(SERVICO_CAMPOS.filter((k) => k in servico).map((k) => [k, servico[k]]))
  const query = novo
    ? supabase.from('servicos').insert({ id: servico.id, ...row })
    : supabase.from('servicos').update(row).eq('id', servico.id)
  return unwrap(await query.select().single())
}

export async function deleteServico(id) {
  unwrap(await supabase.from('servicos').delete().eq('id', id))
}
