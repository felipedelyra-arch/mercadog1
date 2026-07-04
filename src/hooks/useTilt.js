import {
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'

/**
 * Tilt 3D + spotlight que seguem o cursor — dá profundidade tátil aos cards.
 * Uso:
 *   const tilt = useTilt()
 *   <motion.div {...tilt.handlers} style={tilt.style}>
 *     <motion.div className="absolute inset-0" style={{ background: tilt.spotlight }} />
 *
 * Desligado para quem prefere menos movimento (useReducedMotion).
 */
export function useTilt({ max = 3.5 } = {}) {
  const reduced = useReducedMotion()

  // posição do cursor relativa ao card (0 a 1); 0.5 = centro
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  // mola bem macia: quando o cursor entra pela borda o card INCLINA gradualmente,
  // sem o tranco de reagir na hora — e assenta sem oscilar
  const spring = { stiffness: 100, damping: 22, mass: 0.8 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring)

  const spotX = useTransform(px, (v) => `${v * 100}%`)
  const spotY = useTransform(py, (v) => `${v * 100}%`)
  // brilho quente em terracota, bem sutil
  const spotlight = useMotionTemplate`radial-gradient(340px circle at ${spotX} ${spotY}, rgb(168 75 58 / 0.09), transparent 70%)`

  const onMouseMove = (e) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  const onMouseLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return {
    handlers: { onMouseMove, onMouseLeave },
    // willChange promove o card a camada própria de GPU — transform não repinta o conteúdo
    style: reduced
      ? {}
      : { rotateX, rotateY, transformPerspective: 900, willChange: 'transform' },
    spotlight,
  }
}
