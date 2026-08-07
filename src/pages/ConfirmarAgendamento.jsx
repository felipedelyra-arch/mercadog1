import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarCheck, CalendarClock, Clock, PawPrint, Phone, User } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'
import { scaleIn } from '../animations/variants'
import { getBookingByToken, respondBooking } from '../services/api'
import { buildWhatsAppUrl } from '../config/whatsapp'
import { toWhatsAppNumber } from '../utils/format'

const STATUS_LABEL = {
  pendente: 'Aguardando confirmação',
  confirmado: 'Confirmado',
  remarcar: 'Precisa remarcar',
}

/** Mensagem que a clínica manda de volta para o tutor, num toque. */
const retornoTutor = (booking, status) =>
  status === 'confirmado'
    ? `Olá, ${booking.tutor}! Aqui é do Mercadog. Seu horário está confirmado:\n` +
      `• ${booking.item_nome}\n` +
      `• ${booking.data_label} às ${booking.horario}\n` +
      `• Pet: ${booking.pet}\n` +
      `Protocolo ${booking.protocolo}. Até lá!`
    : `Olá, ${booking.tutor}! Aqui é do Mercadog, sobre o protocolo ${booking.protocolo} ` +
      `(${booking.item_nome}, ${booking.data_label} às ${booking.horario}).\n` +
      `Precisamos remarcar esse horário. Qual outro dia fica bom para você?`

/**
 * Página que a equipe abre pelo link enviado no WhatsApp (`/a/:token`).
 * O token identifica o agendamento; o PIN da clínica é o que autoriza a
 * resposta — sem ele o tutor conseguiria confirmar o próprio pedido.
 */
export default function ConfirmarAgendamento() {
  const { token } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(null)
  const [sending, setSending] = useState(null)
  const [resposta, setResposta] = useState(null)

  useEffect(() => {
    let ativo = true
    getBookingByToken(token).then((data) => {
      if (!ativo) return
      setBooking(data)
      setLoading(false)
    })
    return () => {
      ativo = false
    }
  }, [token])

  const responder = async (status) => {
    if (pin.trim().length < 4) {
      setErro('Digite o PIN da clínica.')
      return
    }
    setErro(null)
    setSending(status)
    const res = await respondBooking(token, status, pin.trim())
    setSending(null)
    if (!res?.ok) {
      setErro(res?.erro ?? 'Não foi possível registrar a resposta.')
      return
    }
    setResposta(res)
  }

  const linha = (Icon, label, valor) =>
    valor ? (
      <p className="flex items-start gap-2 text-sm text-clay">
        <Icon size={16} className="mt-0.5 shrink-0 text-terracotta-500" aria-hidden="true" />
        <span>
          {label}: <strong className="text-ink">{valor}</strong>
        </span>
      </p>
    ) : null

  return (
    <PageWrapper>
      <div className="bg-glow mx-auto flex max-w-lg flex-col gap-6 px-4 py-16 sm:px-6">
        {loading ? (
          <p className="text-center text-clay">Carregando agendamento…</p>
        ) : !booking ? (
          <div className="rounded-card border border-sand bg-white p-8 text-center shadow-warm">
            <h1 className="font-display text-2xl font-semibold text-ink">Link inválido</h1>
            <p className="mt-2 text-sm text-clay">
              Este link não corresponde a nenhum agendamento. Confira se ele veio completo na
              mensagem.
            </p>
          </div>
        ) : (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5 rounded-card border border-sand bg-white p-5 shadow-warm sm:p-8"
          >
            <div>
              <p className="text-xs font-bold tracking-wide text-terracotta-600 uppercase">
                Mercadog · protocolo {booking.protocolo}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                {booking.item_nome}
              </h1>
              <p className="mt-1 text-sm text-clay">
                {booking.data_label} às {booking.horario}
              </p>
            </div>

            <div className="flex flex-col gap-2 border-t border-sand pt-4">
              {linha(User, 'Tutor', booking.tutor)}
              {linha(PawPrint, 'Pet', booking.pet)}
              {linha(Clock, 'Porte', booking.porte)}
              {linha(Phone, 'Telefone', booking.telefone_mascarado)}
              {booking.observacoes && (
                <p className="mt-1 rounded-xl bg-cream px-4 py-3 text-sm text-clay">
                  {booking.observacoes}
                </p>
              )}
            </div>

            {/* Já respondido (agora ou em outro acesso) */}
            {resposta || booking.status !== 'pendente' ? (
              <div className="flex flex-col gap-4 border-t border-sand pt-5">
                <p className="font-display text-lg font-semibold text-terracotta-600">
                  {STATUS_LABEL[resposta?.status ?? booking.status]}
                </p>
                {resposta?.telefone ? (
                  <>
                    <p className="text-sm text-clay">
                      Falta avisar o tutor — a mensagem já vai pronta.
                    </p>
                    <Button
                      variant="whatsapp"
                      href={buildWhatsAppUrl(
                        toWhatsAppNumber(resposta.telefone),
                        retornoTutor(booking, resposta.status),
                      )}
                    >
                      <WhatsAppIcon size={18} aria-hidden="true" />
                      Avisar {booking.tutor.split(' ')[0]} no WhatsApp
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-clay">
                    Este agendamento já foi respondido. Para mudar, fale com a equipe.
                  </p>
                )}
              </div>
            ) : (
              /* Pendente: PIN + resposta */
              <div className="flex flex-col gap-3 border-t border-sand pt-5">
                <label htmlFor="pin" className="text-sm font-bold text-ink">
                  PIN da clínica
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value)
                    setErro(null)
                  }}
                  className="w-full rounded-tile border border-sand-dark bg-white px-4 py-3 text-ink transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 focus:outline-none"
                />
                {erro && (
                  <p role="alert" className="text-sm font-semibold text-red-500">
                    {erro}
                  </p>
                )}
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={() => responder('confirmado')}
                    loading={sending === 'confirmado'}
                    className="flex-1"
                  >
                    <CalendarCheck size={18} aria-hidden="true" />
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => responder('remarcar')}
                    loading={sending === 'remarcar'}
                    className="flex-1"
                  >
                    <CalendarClock size={18} aria-hidden="true" />
                    Remarcar
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
