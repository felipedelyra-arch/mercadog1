/**
 * Identidade visual central — logo oficial em /public.
 * `variant="light"` usa a versão branca (para fundos escuros, ex.: navbar).
 * Ambas com fundo transparente, upscale 3x do arquivo original.
 */
export default function Logo({ className = 'h-14', variant = 'color' }) {
  // BASE_URL garante o caminho certo também no GitHub Pages (/mercadog/)
  const base = import.meta.env.BASE_URL
  return (
    <img
      src={`${base}${variant === 'light' ? 'logo-white.png' : 'logo.png'}`}
      alt="Mercadog"
      className={`w-auto object-contain ${className}`}
    />
  )
}
