/**
 * Cabeçalho de seção: título display + subtítulo. Sem etiqueta em cima e
 * sem animação de entrada — o título fala por si.
 * `id` vai no título para a seção poder se rotular com aria-labelledby.
 * `as="h1"` no título principal de cada página.
 */
export default function SectionHeading({ id, title, subtitle, align = 'center', as: Titulo = 'h2' }) {
  const alignment = align === 'left' ? 'text-left items-start' : 'text-center items-center'
  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      <Titulo id={id} className="max-w-2xl font-display text-display-md font-semibold text-ink">
        {title}
      </Titulo>
      {subtitle && <p className="max-w-xl text-base leading-relaxed text-clay">{subtitle}</p>}
    </div>
  )
}
