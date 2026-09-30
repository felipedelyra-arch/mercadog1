/**
 * Banho e tosa: portes e regras de preço.
 *
 * Os serviços (nome, descrição, duração, preço por porte) vivem na tabela
 * `servicos` do Supabase e a equipe edita pelo painel (/admin/servicos).
 * `precos[porte]` null = valor combinado na hora para aquele porte.
 */
export const PET_SIZES = [
  { id: 'pequeno', label: 'Pequeno', hint: 'até 10kg' },
  { id: 'medio', label: 'Médio', hint: '10 a 25kg' },
  { id: 'grande', label: 'Grande', hint: 'acima de 25kg' },
]

/** Menor preço cadastrado ("a partir de"), ou null se nenhum porte tem preço. */
export const minPrice = (service) => {
  const valores = Object.values(service.precos ?? {}).filter((v) => v != null)
  return valores.length ? Math.min(...valores) : null
}

/** Preço exibido no card: "a partir de" o menor, ou "Sob consulta". */
export const cardPrice = (service) => {
  const min = minPrice(service)
  return min == null ? null : { from: min }
}
