import { AnimatePresence, motion } from 'framer-motion'
import {CheckCircle2} from 'lucide-react'
import { useState } from 'react'
import { scaleIn } from '../../animations/variants'
import { PET_SIZES } from '../../data/services'
import { createBooking } from '../../services/api'
import { WHATSAPP_NUMBERS, buildWhatsAppUrl } from '../../config/whatsapp'
import Button from '../ui/Button'
import WhatsAppIcon from '../ui/WhatsAppIcon'

const INITIAL_FORM = { tutor: '', pet: '', porte: '', telefone: '', observacoes: '' }

/**
 * Formulário final do agendamento (frontend only).
 * `kind` = 'servico' exige o porte do pet (afeta o preço);
 * na 'consulta' o porte aparece igual, só que opcional.
 * `summary` = { itemLabel, day, time } vindos dos passos anteriores.
 * `buildWhatsMessage(form)` gera a mensagem de confirmação contextual.
 */
export default function BookingForm({ kind = 'servico', summary, buildWhatsMessage }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (form.tutor.trim().length < 3) errs.tutor = 'Informe o seu nome completo.'
    if (!form.pet.trim()) errs.pet = 'Informe o nome do pet.'
    if (kind === 'servico' && !form.porte) errs.porte = 'Escolha o porte do pet.'
    if (form.telefone.replace(/\D/g, '').length < 10)
      errs.telefone = 'Informe um telefone com DDD.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSending(true)
    const response = await createBooking({ kind, ...form, ...summary })
    setSending(false)
    if (!response.ok) {
      setErrors({ envio: response.erro ?? 'Tente novamente em instantes.' })
      return
    }
    setResult(response)
  }

  const inputClass = (field) =>
    `w-full rounded-tile border bg-white px-4 py-3 text-ink placeholder:text-clay/60 transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none ${
      errors[field] ? 'border-red-500 bg-red-50/40' : 'border-sand-dark'
    }`

  const fieldError = (field) =>
    errors[field] && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-xs font-semibold text-red-500"
        role="alert"
      >
        {errors[field]}
      </motion.p>
    )

  return (
    <AnimatePresence mode="wait">
      {result ? (
        /* ---- Feedback de sucesso ---- */
        <motion.div
          key="success"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-4 rounded-card border border-sand bg-white p-6 text-center shadow-warm sm:p-8"
        >
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            className="grid size-16 place-items-center rounded-full bg-terracotta-100 text-terracotta-600"
          >
            <CheckCircle2 size={34} aria-hidden="true" />
          </motion.span>
          <div>
            <h3 className="font-display text-2xl font-semibold text-ink">
              Pedido registrado!
            </h3>
            <p className="mt-1 text-sm text-clay">
              {summary.itemLabel} · {summary.day?.full} às {summary.time}
            </p>
            <p className="mt-2 text-xs text-clay">
              Protocolo <strong className="text-terracotta-600">{result.protocolo}</strong>
            </p>
            {/* O pedido só vira agendamento quando a equipe confirma —
                não prometemos horário garantido antes disso. */}
            <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-sm text-clay">
              Falta um passo: <strong className="text-ink">envie a mensagem no WhatsApp</strong>{' '}
              para a equipe receber o pedido. A confirmação chega para você logo depois.
            </p>
          </div>
          <Button
            variant="whatsapp"
            href={buildWhatsAppUrl(
              kind === 'consulta' ? WHATSAPP_NUMBERS.veterinario : WHATSAPP_NUMBERS.banhoTosa,
              buildWhatsMessage(form, result),
            )}
          >
            <WhatsAppIcon size={18} aria-hidden="true" />
            Enviar pedido no WhatsApp
          </Button>
        </motion.div>
      ) : (
        /* ---- Formulário ---- */
        <motion.form
          key="form"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-card border border-sand bg-white p-4 shadow-warm sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tutor" className="mb-1 block text-sm font-bold text-ink">
                Seu nome
              </label>
              <input
                id="tutor"
                type="text"
                autoComplete="name"
                placeholder="Nome do tutor"
                value={form.tutor}
                onChange={set('tutor')}
                aria-invalid={Boolean(errors.tutor)}
                className={inputClass('tutor')}
              />
              {fieldError('tutor')}
            </div>
            <div>
              <label htmlFor="telefone" className="mb-1 block text-sm font-bold text-ink">
                Telefone (WhatsApp)
              </label>
              <input
                id="telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-0000"
                value={form.telefone}
                onChange={set('telefone')}
                aria-invalid={Boolean(errors.telefone)}
                className={inputClass('telefone')}
              />
              {fieldError('telefone')}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pet" className="mb-1 block text-sm font-bold text-ink">
                Nome do pet
              </label>
              <input
                id="pet"
                type="text"
                placeholder="Como ele(a) se chama?"
                value={form.pet}
                onChange={set('pet')}
                aria-invalid={Boolean(errors.pet)}
                className={inputClass('pet')}
              />
              {fieldError('pet')}
            </div>

            {/* Porte: obrigatório no banho e tosa (muda o preço), opcional na consulta */}
            <fieldset>
              <legend className="mb-1 text-sm font-bold text-ink">
                Porte do pet{' '}
                {kind === 'consulta' && <span className="font-normal text-clay">(opcional)</span>}
              </legend>
              <div className="flex gap-2" role="radiogroup" aria-label="Porte do pet">
                {PET_SIZES.map(({ id, label, hint }) => (
                  <motion.button
                    key={id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    role="radio"
                    aria-checked={form.porte === id}
                    title={hint}
                    onClick={() => {
                      // clicar de novo no mesmo porte limpa a escolha (útil no opcional)
                      setForm((f) => ({ ...f, porte: f.porte === id ? '' : id }))
                      setErrors((errs) => ({ ...errs, porte: undefined }))
                    }}
                    className={`min-h-11 flex-1 rounded-tile border text-sm font-semibold transition-colors ${
                      form.porte === id
                        ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600 ring-1 ring-terracotta-500'
                        : 'border-sand-dark text-clay hover:border-terracotta-300 hover:bg-terracotta-50'
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
              {fieldError('porte')}
            </fieldset>
          </div>

          <div>
            <label htmlFor="observacoes" className="mb-1 block text-sm font-bold text-ink">
              Observações <span className="font-normal text-clay">(opcional)</span>
            </label>
            <textarea
              id="observacoes"
              rows={3}
              placeholder="Alergias, comportamento, preferências…"
              value={form.observacoes}
              onChange={set('observacoes')}
              className={inputClass('observacoes')}
            />
          </div>

          {/* Resumo do que foi escolhido nos passos anteriores */}
          <p className="rounded-xl bg-cream px-4 py-3 text-sm text-clay">
            <strong className="text-ink">{summary.itemLabel}</strong> · {summary.day?.full} às{' '}
            <strong className="text-ink">{summary.time}</strong>
          </p>

          {errors.envio && (
            <p role="alert" className="text-sm font-semibold text-red-500">
              {errors.envio}
            </p>
          )}

          <Button type="submit" loading={sending} className="w-full sm:w-auto sm:self-end">
            {sending ? 'Enviando…' : 'Enviar pedido de agendamento'}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
