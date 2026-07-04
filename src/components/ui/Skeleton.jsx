/**
 * Placeholder animado de carregamento.
 * `motion-reduce:animate-none` desliga o pulso para quem prefere menos movimento.
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-sand motion-reduce:animate-none ${className}`}
    />
  )
}

/** Skeleton com o formato dos cards de serviço/produto. */
export function CardSkeleton() {
  return (
    <div className="rounded-card border border-sand bg-white p-6 shadow-warm">
      <Skeleton className="mb-4 size-12 rounded-arch" />
      <Skeleton className="mb-2 h-5 w-2/3" />
      <Skeleton className="mb-1 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-4/5" />
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
  )
}
