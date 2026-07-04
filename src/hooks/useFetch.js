import { useEffect, useState } from 'react'

/**
 * Hook mínimo de busca de dados para a fase mockada.
 * `fetcher` deve ser estável (função importada de src/services/api).
 * Quando houver backend real, este hook pode ser trocado por react-query
 * sem alterar as páginas (mesma forma: { data, loading, error }).
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    fetcher()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
