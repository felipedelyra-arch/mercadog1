import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, FileText, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pausarRolagem, retomarRolagem } from '../lib/smoothScroll'
import { EASE } from '../animations/variants'
import { useCart } from '../context/CartContext'
import { WHATSAPP_MESSAGES, WHATSAPP_NUMBERS, buildWhatsAppUrl } from '../config/whatsapp'
import { criarPedido } from '../services/api'
import { formatPrice, parsePreco } from '../utils/format'
import Button from './ui/Button'
import WhatsAppIcon from './ui/WhatsAppIcon'

const INITIAL_FORM = {
  nome: '',
  telefone: '',
  entrega: 'retirada',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: 'Tupã',
  referencia: '',
  pagamento: 'pix',
  troco: '',
  semTroco: false,
  observacoes: '',
}

const PAGAMENTOS = [
  ['pix', 'Pix'],
  ['cartao', 'Cartão'],
  ['dinheiro', 'Dinheiro'],
]

/** "17600070" → "17600-070" enquanto digita. */
const maskCep = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

/** Endereço numa linha só: é o que vai para o banco, o painel e o WhatsApp. */
const montarEndereco = (f) =>
  `${f.rua.trim()}, ${f.numero.trim()}${f.complemento.trim() ? ` - ${f.complemento.trim()}` : ''}` +
  ` - ${f.bairro.trim()}, ${f.cidade.trim()} - CEP ${f.cep}` +
  (f.referencia.trim() ? ` (ref.: ${f.referencia.trim()})` : '')

const montarPagamento = (f) => {
  if (f.pagamento === 'pix') return 'Pix'
  if (f.pagamento === 'cartao') return 'Cartão na entrega'
  if (f.semTroco) return 'Dinheiro, sem troco'
  return `Dinheiro, troco para ${formatPrice(parsePreco(f.troco))}`
}

/**
 * Gaveta do carrinho, pela direita. Três telas:
 * itens → dados do cliente → pedido registrado (botão do WhatsApp).
 *
 * O pedido é gravado antes de abrir o WhatsApp: a mensagem leva o número,
 * que a equipe usa para achar o pedido no painel e confirmar.
 */
export default function CartDrawer() {
  const cart = useCart()
  const [step, setStep] = useState('itens')
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  // { numero, codigo, message } do pedido recém-gravado
  const [pedido, setPedido] = useState(null)

  const close = () => {
    cart.setOpen(false)
    // depois de enviado, a próxima abertura começa do zero
    if (step === 'enviado') {
      setStep('itens')
      setPedido(null)
    }
  }

  // Esc fecha + trava o scroll do body enquanto a gaveta está aberta
  useEffect(() => {
    if (!cart.open) return
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    pausarRolagem()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      retomarRolagem()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.open, step])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  // CEP completo → busca rua, bairro e cidade no ViaCEP. Se falhar, o
  // cliente só preenche à mão; nada trava o pedido.
  const [buscandoCep, setBuscandoCep] = useState(false)
  const setCep = async (e) => {
    const cep = maskCep(e.target.value)
    setForm((f) => ({ ...f, cep }))
    setErrors((errs) => ({ ...errs, cep: undefined }))
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setErrors((errs) => ({ ...errs, cep: 'CEP não encontrado. Confira ou preencha o endereço abaixo.' }))
        return
      }
      setForm((f) => ({
        ...f,
        rua: data.logradouro || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
      }))
      setErrors((errs) => ({ ...errs, rua: undefined, bairro: undefined, cidade: undefined }))
    } catch {
      // sem internet / ViaCEP fora: segue no preenchimento manual
    } finally {
      setBuscandoCep(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (form.nome.trim().length < 3) errs.nome = 'Informe o seu nome completo.'
    if (form.telefone.replace(/\D/g, '').length < 10) errs.telefone = 'Informe um telefone com DDD.'
    if (form.entrega === 'entrega') {
      if (form.cep.replace(/\D/g, '').length !== 8) errs.cep = 'Informe o CEP com 8 dígitos.'
      if (form.rua.trim().length < 3) errs.rua = 'Informe a rua.'
      if (!form.numero.trim()) errs.numero = 'Informe o número (ou "s/n").'
      if (form.bairro.trim().length < 2) errs.bairro = 'Informe o bairro.'
      if (form.cidade.trim().length < 2) errs.cidade = 'Informe a cidade.'
      if (form.pagamento === 'dinheiro' && !form.semTroco) {
        const troco = parsePreco(form.troco)
        if (troco == null || Number.isNaN(troco)) errs.troco = 'Informe para quanto precisa de troco.'
        else if (troco <= cart.total) errs.troco = `O valor precisa ser maior que ${formatPrice(cart.total)}.`
      }
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const entrega = form.entrega === 'entrega'
    const endereco = entrega ? montarEndereco(form) : ''
    const pagamento = entrega ? montarPagamento(form) : null
    const observacoes = [pagamento && `Pagamento: ${pagamento}`, form.observacoes.trim()]
      .filter(Boolean)
      .join('\n')

    setSending(true)
    setSubmitError(null)
    try {
      const { numero, codigo } = await criarPedido({
        tipo: 'loja',
        cliente_nome: form.nome,
        cliente_telefone: form.telefone,
        entrega: form.entrega,
        endereco,
        observacoes,
        itens: cart.items.map((i) => ({ produto_id: i.id, quantidade: i.quantidade })),
      })
      const message = WHATSAPP_MESSAGES.pedidoLoja({
        numero,
        itens: cart.items,
        total: formatPrice(cart.total),
        sobConsulta: cart.sobConsulta,
        entrega: form.entrega,
        endereco,
        pagamento,
      })
      setPedido({ numero, codigo, message })
      setStep('enviado')
      cart.clear()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSending(false)
    }
  }

  const inputClass = (field) =>
    `w-full rounded-tile border bg-white px-4 py-3 text-ink placeholder:text-clay/60 transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none ${
      errors[field] ? 'border-red-500 bg-red-50/40' : 'border-sand-dark'
    }`

  const labelClass = 'mb-1 block text-sm font-bold text-ink'

  const optionClass = (active) =>
    `min-h-11 flex-1 rounded-tile border text-sm font-semibold transition-colors ${
      active
        ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-500'
        : 'border-sand-dark text-clay hover:border-terracotta-300 hover:bg-terracotta-50'
    }`

  const fieldError = (field) =>
    errors[field] && (
      <p className="mt-1 text-xs font-semibold text-red-500" role="alert">
        {errors[field]}
      </p>
    )

  const totalLine = (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm font-semibold text-clay">Total</span>
      <span className="text-right">
        <span className="font-display text-2xl font-semibold text-ink">
          {formatPrice(cart.total)}
        </span>
        {cart.sobConsulta && (
          <span className="block text-xs text-clay">+ itens com preço sob consulta</span>
        )}
      </span>
    </div>
  )

  return (
    <AnimatePresence>
      {cart.open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-y-0 right-0 z-[70] flex w-[26rem] max-w-full flex-col bg-white shadow-warm-xl"
          >
            {/* Cabeçalho */}
            <div className="flex items-center gap-2 border-b border-sand px-4 py-3.5">
              {step === 'dados' && (
                <button
                  type="button"
                  aria-label="Voltar para os itens"
                  onClick={() => setStep('itens')}
                  className="tap grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-terracotta-50"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h2 className="flex-1 font-display text-xl font-semibold text-ink">
                {step === 'dados' ? 'Finalizar pedido' : step === 'enviado' ? 'Pedido' : 'Seu carrinho'}
              </h2>
              <button
                type="button"
                autoFocus
                aria-label="Fechar carrinho"
                onClick={close}
                className="tap grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-terracotta-50"
              >
                <X size={22} />
              </button>
            </div>

            {/* ---- Itens ---- */}
            {step === 'itens' &&
              (cart.items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <ShoppingBag size={40} className="text-terracotta-300" aria-hidden="true" />
                  <p className="font-display text-xl font-semibold text-ink">Carrinho vazio</p>
                  <p className="max-w-xs text-sm text-clay">
                    Toque em um produto da loja para adicionar.
                  </p>
                  <Button to="/loja" variant="outline" size="sm" onClick={close}>
                    Ver a loja
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="flex-1 divide-y divide-sand overflow-y-auto px-4">
                    {cart.items.map((item) => (
                      <li key={item.id} className="flex gap-3 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug font-semibold text-ink">{item.nome}</p>
                          {item.detalhes && <p className="text-xs text-clay">{item.detalhes}</p>}
                          {item.exige_receita && (
                            <p className="text-xs font-semibold text-terracotta-700">Exige receita veterinária</p>
                          )}
                          <p className="mt-1 text-sm font-semibold text-terracotta-600">
                            {item.preco == null ? 'Sob consulta' : formatPrice(item.preco)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-2">
                          <button
                            type="button"
                            aria-label={`Remover ${item.nome}`}
                            onClick={() => cart.remove(item.id)}
                            className="grid size-8 place-items-center rounded-full text-clay transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="flex items-center rounded-full border border-sand-dark">
                            <button
                              type="button"
                              aria-label={`Diminuir ${item.nome}`}
                              onClick={() => cart.setQuantity(item.id, item.quantidade - 1)}
                              className="grid size-9 place-items-center rounded-full text-ink hover:bg-terracotta-50"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="w-7 text-center text-sm font-bold text-ink" aria-live="polite">
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              aria-label={`Aumentar ${item.nome}`}
                              onClick={() => cart.setQuantity(item.id, item.quantidade + 1)}
                              className="grid size-9 place-items-center rounded-full text-ink hover:bg-terracotta-50"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3 border-t border-sand bg-cream px-4 py-4 pb-safe">
                    {cart.comReceita.length > 0 && (
                      <p className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-sm text-ink">
                        <FileText size={16} className="mt-0.5 shrink-0 text-terracotta-600" aria-hidden="true" />
                        <span>
                          {cart.comReceita.length === 1 ? 'Um item exige' : `${cart.comReceita.length} itens exigem`} receita
                          veterinária. Envie a foto da receita no WhatsApp ou apresente na retirada.
                        </span>
                      </p>
                    )}
                    {totalLine}
                    <Button onClick={() => setStep('dados')} className="w-full">
                      Finalizar pedido
                    </Button>
                  </div>
                </>
              ))}

            {/* ---- Dados do cliente ---- */}
            {step === 'dados' && (
              <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                  <div>
                    <label htmlFor="cart-nome" className="mb-1 block text-sm font-bold text-ink">
                      Seu nome
                    </label>
                    <input
                      id="cart-nome"
                      autoComplete="name"
                      value={form.nome}
                      onChange={set('nome')}
                      aria-invalid={Boolean(errors.nome)}
                      className={inputClass('nome')}
                    />
                    {fieldError('nome')}
                  </div>
                  <div>
                    <label htmlFor="cart-telefone" className="mb-1 block text-sm font-bold text-ink">
                      Telefone (WhatsApp)
                    </label>
                    <input
                      id="cart-telefone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(14) 99999-0000"
                      value={form.telefone}
                      onChange={set('telefone')}
                      aria-invalid={Boolean(errors.telefone)}
                      className={inputClass('telefone')}
                    />
                    {fieldError('telefone')}
                  </div>

                  <fieldset>
                    <legend className="mb-1 text-sm font-bold text-ink">Como prefere receber?</legend>
                    <div className="flex gap-2" role="radiogroup">
                      {[
                        ['retirada', 'Retiro na loja'],
                        ['entrega', 'Entrega em casa'],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={form.entrega === id}
                          onClick={() => {
                            setForm((f) => ({ ...f, entrega: id }))
                            setErrors({})
                          }}
                          className={optionClass(form.entrega === id)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {form.entrega === 'entrega' && (
                    <>
                      <div className="grid grid-cols-[8.5rem_1fr] gap-3">
                        <div>
                          <label htmlFor="cart-cep" className={labelClass}>
                            CEP
                          </label>
                          <input
                            id="cart-cep"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            placeholder="17600-000"
                            value={form.cep}
                            onChange={setCep}
                            aria-invalid={Boolean(errors.cep)}
                            className={inputClass('cep')}
                          />
                        </div>
                        <div>
                          <label htmlFor="cart-cidade" className={labelClass}>
                            Cidade
                          </label>
                          <input
                            id="cart-cidade"
                            autoComplete="address-level2"
                            maxLength={40}
                            value={form.cidade}
                            onChange={set('cidade')}
                            aria-invalid={Boolean(errors.cidade)}
                            className={inputClass('cidade')}
                          />
                        </div>
                      </div>
                      {buscandoCep && <p className="-mt-2 text-xs text-clay">Buscando endereço…</p>}
                      {fieldError('cep')}
                      {fieldError('cidade')}

                      <div>
                        <label htmlFor="cart-rua" className={labelClass}>
                          Rua
                        </label>
                        <input
                          id="cart-rua"
                          autoComplete="address-line1"
                          maxLength={100}
                          value={form.rua}
                          onChange={set('rua')}
                          aria-invalid={Boolean(errors.rua)}
                          className={inputClass('rua')}
                        />
                        {fieldError('rua')}
                      </div>

                      <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                        <div>
                          <label htmlFor="cart-numero" className={labelClass}>
                            Número
                          </label>
                          <input
                            id="cart-numero"
                            maxLength={10}
                            value={form.numero}
                            onChange={set('numero')}
                            aria-invalid={Boolean(errors.numero)}
                            className={inputClass('numero')}
                          />
                        </div>
                        <div>
                          <label htmlFor="cart-complemento" className={labelClass}>
                            Complemento <span className="font-normal text-clay">(opcional)</span>
                          </label>
                          <input
                            id="cart-complemento"
                            autoComplete="address-line2"
                            placeholder="Apto, bloco, casa 2…"
                            maxLength={40}
                            value={form.complemento}
                            onChange={set('complemento')}
                            className={inputClass('complemento')}
                          />
                        </div>
                      </div>
                      {fieldError('numero')}

                      <div>
                        <label htmlFor="cart-bairro" className={labelClass}>
                          Bairro
                        </label>
                        <input
                          id="cart-bairro"
                          autoComplete="address-level3"
                          maxLength={50}
                          value={form.bairro}
                          onChange={set('bairro')}
                          aria-invalid={Boolean(errors.bairro)}
                          className={inputClass('bairro')}
                        />
                        {fieldError('bairro')}
                      </div>

                      <div>
                        <label htmlFor="cart-referencia" className={labelClass}>
                          Ponto de referência <span className="font-normal text-clay">(opcional)</span>
                        </label>
                        <input
                          id="cart-referencia"
                          placeholder="Perto de…, portão verde…"
                          maxLength={60}
                          value={form.referencia}
                          onChange={set('referencia')}
                          className={inputClass('referencia')}
                        />
                      </div>

                      <fieldset>
                        <legend className={labelClass}>Pagamento na entrega</legend>
                        <div className="flex gap-2" role="radiogroup">
                          {PAGAMENTOS.map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              role="radio"
                              aria-checked={form.pagamento === id}
                              onClick={() => {
                                setForm((f) => ({ ...f, pagamento: id }))
                                setErrors((errs) => ({ ...errs, troco: undefined }))
                              }}
                              className={optionClass(form.pagamento === id)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      {form.pagamento === 'dinheiro' && (
                        <div>
                          <label htmlFor="cart-troco" className={labelClass}>
                            Troco para quanto?
                          </label>
                          <input
                            id="cart-troco"
                            inputMode="decimal"
                            placeholder="R$ 100,00"
                            disabled={form.semTroco}
                            value={form.troco}
                            onChange={set('troco')}
                            aria-invalid={Boolean(errors.troco)}
                            className={`${inputClass('troco')} disabled:opacity-50`}
                          />
                          {fieldError('troco')}
                          <label className="mt-2 flex items-center gap-2 text-sm text-ink">
                            <input
                              type="checkbox"
                              checked={form.semTroco}
                              onChange={(e) => {
                                setForm((f) => ({ ...f, semTroco: e.target.checked }))
                                setErrors((errs) => ({ ...errs, troco: undefined }))
                              }}
                              className="size-4 accent-terracotta-500"
                            />
                            Não preciso de troco
                          </label>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label htmlFor="cart-obs" className="mb-1 block text-sm font-bold text-ink">
                      Observações <span className="font-normal text-clay">(opcional)</span>
                    </label>
                    <textarea
                      id="cart-obs"
                      rows={2}
                      placeholder="Horário para entrega, recado para a equipe…"
                      value={form.observacoes}
                      onChange={set('observacoes')}
                      className={inputClass('observacoes')}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-sand bg-cream px-4 py-4 pb-safe">
                  {totalLine}
                  {submitError && (
                    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                      {submitError}
                    </p>
                  )}
                  <p className="text-xs text-clay">
                    Usamos seus dados só para atender este pedido.{' '}
                    <Link to="/privacidade" onClick={close} className="underline underline-offset-2 hover:text-ink">
                      Política de privacidade
                    </Link>
                  </p>
                  <Button type="submit" loading={sending} className="w-full">
                    Registrar pedido
                  </Button>
                </div>
              </form>
            )}

            {/* ---- Pedido registrado ---- */}
            {step === 'enviado' && pedido && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-terracotta-100 text-terracotta-600">
                  <CheckCircle2 size={34} aria-hidden="true" />
                </span>
                <h3 className="font-display text-2xl font-semibold text-ink">
                  Pedido nº {pedido.numero} registrado
                </h3>
                <p className="rounded-xl bg-cream px-4 py-3 text-sm text-clay">
                  Falta um passo: <strong className="text-ink">envie a mensagem no WhatsApp</strong>{' '}
                  para avisar a loja. A equipe confirma por lá.
                </p>
                <Button
                  variant="whatsapp"
                  href={buildWhatsAppUrl(WHATSAPP_NUMBERS.atendimento, pedido.message)}
                  className="w-full"
                >
                  <WhatsAppIcon size={18} aria-hidden="true" />
                  Enviar pedido no WhatsApp
                </Button>
                {pedido.codigo && (
                  <Button to={`/pedido/${pedido.codigo}`} variant="outline" onClick={close} className="w-full">
                    Acompanhar ou cancelar o pedido
                  </Button>
                )}
                <Link to="/loja" onClick={close} className="text-sm font-semibold text-clay underline">
                  Voltar para a loja
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
