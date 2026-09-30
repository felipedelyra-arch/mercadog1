import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { staggerContainer } from '../../animations/variants'
import { CardSkeleton } from '../ui/Skeleton'
import ServiceCard from '../ServiceCard'
import SlotPicker from './SlotPicker'
import BookingForm from './BookingForm'

/**
 * Orquestra os passos do agendamento (escolher → data/horário → dados),
 * compartilhado entre banho/tosa e consultas veterinárias.
 *
 * @param {'servico'|'consulta'} kind - muda a agenda e os campos do formulário
 * @param {Array} [items] - serviços para escolher (banho e tosa)
 * @param {object} [fixedItem] - item único já escolhido (consulta genérica):
 *   o passo "escolha" some e o fluxo começa na data
 * @param {boolean} loading - mostra skeletons dos cards
 * @param {(item) => number|{from:number}} priceFor - preço exibido no card
 * @param {(item, form) => string} serviceLabel - descrição do serviço gravada no pedido
 * @param {(item, slot, form, pedido) => string} buildWhatsMessage - mensagem enviada à equipe
 * @param {string} [initialItemId] - pré-seleciona um item (ex.: vindo de card da Home)
 * @param {string} [initialNote] - pré-preenche observações/motivo no formulário
 */
export default function BookingFlow({
  kind,
  items = [],
  fixedItem,
  loading,
  priceFor,
  serviceLabel,
  buildWhatsMessage,
  initialItemId,
  initialNote,
}) {
  const [selectedItem, setSelectedItem] = useState(fixedItem ?? null)
  const [slot, setSlot] = useState({ day: null, time: null })
  const stepTwoRef = useRef(null)
  const stepThreeRef = useRef(null)

  // Pré-seleção vinda de outra página (ex.: clique no card da Home)
  useEffect(() => {
    if (!initialItemId || selectedItem || items.length === 0) return
    const item = items.find((i) => i.id === initialItemId)
    if (item) setSelectedItem(item)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItemId, items])

  const scrollTo = (ref) =>
    // pequeno atraso para o passo montar antes de rolar
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setSlot({ day: null, time: null })
    scrollTo(stepTwoRef)
  }

  const handleSlotChange = (next) => {
    setSlot(next)
    if (next.time) scrollTo(stepThreeRef)
  }

  const stepLabel = (n, text, done) => (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${
          done
            ? 'bg-terracotta-500 text-white'
            : 'border border-terracotta-200 bg-terracotta-50 text-terracotta-600'
        }`}
      >
        {done ? <Check size={16} aria-hidden="true" /> : n}
      </span>
      <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{text}</h2>
      <span aria-hidden="true" className="h-px flex-1 bg-sand" />
    </div>
  )

  // com item fixo não há passo de escolha: data vira o passo 1
  const offset = fixedItem ? 1 : 0

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {/* Passo 1 — escolha */}
      {!fixedItem && (
        <section aria-label="Passo 1: escolha">
          {stepLabel(1, 'Escolha o serviço', Boolean(selectedItem))}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((item) => (
                <ServiceCard
                  key={item.id}
                  item={item}
                  price={priceFor(item)}
                  selected={selectedItem?.id === item.id}
                  onSelect={handleSelectItem}
                />
              ))}
            </motion.div>
          )}
        </section>
      )}

      {/* Passo 2 — data e horário */}
      <AnimatePresence>
        {selectedItem && (
          <motion.section
            ref={stepTwoRef}
            key={`slots-${selectedItem.id}`}
            aria-label={`Passo ${2 - offset}: data e horário`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="scroll-mt-24"
          >
            {stepLabel(2 - offset, 'Escolha data e horário', Boolean(slot.time))}
            <SlotPicker context={kind} onChange={handleSlotChange} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Passo 3 — dados */}
      <AnimatePresence>
        {selectedItem && slot.time && (
          <motion.section
            ref={stepThreeRef}
            key="form"
            aria-label={`Passo ${3 - offset}: seus dados`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="scroll-mt-24"
          >
            {stepLabel(3 - offset, 'Complete os dados', false)}
            <BookingForm
              kind={kind}
              summary={{
                itemId: selectedItem.id,
                itemLabel: selectedItem.nome,
                day: slot.day,
                time: slot.time,
              }}
              initialNote={initialNote}
              serviceLabel={(form) => serviceLabel(selectedItem, form)}
              buildWhatsMessage={(form, pedido) =>
                buildWhatsMessage(selectedItem, slot, form, pedido)
              }
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
