import { useEffect, useState } from 'react'

/** true enquanto a media query casar (ex.: '(min-width: 640px)'). */
export function useMediaQuery(query) {
  const [casa, setCasa] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setCasa(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return casa
}
