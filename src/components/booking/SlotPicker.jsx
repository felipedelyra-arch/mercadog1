import { AnimatePresence, motion } from 'framer-motion'
import { CalendarX2 } from 'lucide-react'
import { useState } from 'react'
import { fadeUp, staggerContainer } from '../../animations/variants'
import { useFetch } from '../../hooks/useFetch'
import { getAvailableSlots } from '../../services/api'
import { Skeleton } from '../ui/Skeleton'

/**
 * Seleção de data e horário — compartilhado entre banho/tosa e consultas.
 * `context` muda a agenda mockada ('servico' | 'consulta').
 * Chama `onChange({ day, time })`; `time` fica null até o usuário escolher.
 */
export default function SlotPicker({ context = 'servico', onChange }) {
  const { data: days, loading } = useFetch(() => getAvailableSlots(context), [context])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  const pickDay = (day) => {
    setSelectedDay(day)
    setSelectedTime(null)
    onChange?.({ day, time: null })
  }

  const pickTime = (time) => {
    setSelectedTime(time)
    onChange?.({ day: selectedDay, time })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-16 shrink-0 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Dias */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">Escolha o dia</legend>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2"
          role="listbox"
          aria-label="Dias disponíveis"
        >
          {days.map((day) => {
            const active = selectedDay?.iso === day.iso
            return (
              <motion.button
                key={day.iso}
                type="button"
                variants={fadeUp}
                whileTap={{ scale: 0.94 }}
                role="option"
                aria-selected={active}
                onClick={() => pickDay(day)}
                className={`flex w-[4.25rem] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-tile border px-2 py-3 transition-colors ${
                  active
                    ? 'border-terracotta-500 bg-terracotta-500 text-white shadow-warm'
                    : 'border-sand bg-white text-clay hover:border-terracotta-300'
                }`}
              >
                <span className="text-[11px] font-bold tracking-wide uppercase">{day.weekday}</span>
                <span className={`text-sm font-semibold ${active ? '' : 'text-ink'}`}>
                  {day.label}
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </fieldset>

      {/* Horários do dia escolhido */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.fieldset
            key={selectedDay.iso}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <legend className="mb-2 text-sm font-bold text-ink">
              Horários para {selectedDay.full}
            </legend>
            {selectedDay.slots.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-cream px-4 py-3 text-sm text-clay">
                <CalendarX2 size={16} className="text-terracotta-500" aria-hidden="true" />
                Sem horários neste dia. Escolha outra data.
              </p>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5"
                role="listbox"
                aria-label="Horários disponíveis"
              >
                {selectedDay.slots.map((time) => {
                  const active = selectedTime === time
                  return (
                    <motion.button
                      key={time}
                      type="button"
                      variants={fadeUp}
                      whileTap={{ scale: 0.94 }}
                      role="option"
                      aria-selected={active}
                      onClick={() => pickTime(time)}
                      className={`min-h-11 rounded-full border text-sm font-semibold transition-colors ${
                        active
                          ? 'border-terracotta-500 bg-terracotta-500 text-white shadow-warm'
                          : 'border-sand bg-white text-ink hover:border-terracotta-300 hover:bg-terracotta-50'
                      }`}
                    >
                      {time}
                    </motion.button>
                  )
                })}
              </motion.div>
            )}
          </motion.fieldset>
        )}
      </AnimatePresence>
    </div>
  )
}
