import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, FileText, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pausarRolagem, retomarRolagem } from '../lib/smoothScroll'
import { EASE } from '../animations/variants'
import { useCart } from '../context/CartContext'
import { WHATSAPP_MESSAGES, WHATSAPP_NUMBERS, buildWhatsAppUrl } from '../config/whatsapp'
import { criarPedido } from '../services/api'
import { formatPrice } from '../utils/format'
import Button from './ui/Button'
import WhatsAppIcon from './ui/WhatsAppIcon'

const INITIAL_FORM = { nome: '', telefone: '', entrega: 'retirada', endereco: '', observacoes: '' }

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
  // { numero, message } do pedido recém-gravado
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

  const validate = () => {
    const errs = {}
    if (form.nome.trim().length < 3) errs.nome = 'Informe o seu nome completo.'
    if (form.telefone.replace(/\D/g, '').length < 10) errs.telefone = 'Informe um telefone com DDD.'
    if (form.entrega === 'entrega' && form.endereco.trim().length < 8)
      errs.endereco = 'Informe rua, número e bairro.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSending(true)
    setSubmitError(null)
    try {
      const { numero } = await criarPedido({
        tipo: 'loja',
        cliente_nome: form.nome,
        cliente_telefone: form.telefone,
        entrega: form.entrega,
        endereco: form.endereco,
        observacoes: form.observacoes,
        itens: cart.items.map((i) => ({ produto_id: i.id, quantidade: i.quantidade })),
      })
      const message = WHATSAPP_MESSAGES.pedidoLoja({
        numero,
        itens: cart.items,
        total: formatPrice(cart.total),
        sobConsulta: cart.sobConsulta,
        entrega: form.entrega,
        endereco: form.endereco.trim(),
      })
      setPedido({ numero, message })
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
                          onClick={() => setForm((f) => ({ ...f, entrega: id }))}
                          className={`min-h-11 flex-1 rounded-tile border text-sm font-semibold transition-colors ${
                            form.entrega === id
                              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-500'
                              : 'border-sand-dark text-clay hover:border-terracotta-300 hover:bg-terracotta-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {form.entrega === 'entrega' && (
                    <div>
                      <label htmlFor="cart-endereco" className="mb-1 block text-sm font-bold text-ink">
                        Endereço de entrega
                      </label>
                      <input
                        id="cart-endereco"
                        autoComplete="street-address"
                        placeholder="Rua, número, bairro"
                        value={form.endereco}
                        onChange={set('endereco')}
                        aria-invalid={Boolean(errors.endereco)}
                        className={inputClass('endereco')}
                      />
                      {fieldError('endereco')}
                    </div>
                  )}

                  <div>
                    <label htmlFor="cart-obs" className="mb-1 block text-sm font-bold text-ink">
                      Observações <span className="font-normal text-clay">(opcional)</span>
                    </label>
                    <textarea
                      id="cart-obs"
                      rows={2}
                      placeholder="Troco, horário para entrega…"
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
