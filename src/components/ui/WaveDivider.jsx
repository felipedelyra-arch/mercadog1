/**
 * Divisor de seção ondulado e orgânico (inspiração PetsStar).
 * Herda a cor via currentColor — envolva com text-cream/text-white
 * na cor da seção que vem DEPOIS dele.
 * `flip` espelha verticalmente para fechar uma seção colorida.
 */
export default function WaveDivider({ flip = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 1440 56"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-10 w-full sm:h-14 ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <path
        fill="currentColor"
        d="M0 30 C 90 8 210 46 350 34 C 480 23 560 40 700 30 C 830 21 930 44 1080 32 C 1210 22 1330 34 1440 24 L 1440 56 L 0 56 Z"
      />
    </svg>
  )
}
