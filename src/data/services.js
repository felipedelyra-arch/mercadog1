/**
 * Serviços de banho e tosa (mock).
 * `precos` por porte alimenta o formulário; o card mostra "a partir de" (menor valor).
 */
export const PET_SIZES = [
  { id: 'pequeno', label: 'Pequeno', hint: 'até 10kg' },
  { id: 'medio', label: 'Médio', hint: '10 a 25kg' },
  { id: 'grande', label: 'Grande', hint: 'acima de 25kg' },
]

export const SERVICES = [
  {
    id: 'banho',
    nome: 'Banho',
    descricao:
      'Banho completo com produtos hipoalergênicos, secagem, escovação e perfume suave.',
    duracao: 60,
    icon: 'Droplets',
    precos: { pequeno: 55, medio: 75, grande: 95 },
  },
  {
    id: 'tosa',
    nome: 'Tosa',
    descricao:
      'Tosa higiênica ou completa, na máquina ou tesoura, com acabamento cuidadoso.',
    duracao: 75,
    icon: 'Scissors',
    precos: { pequeno: 65, medio: 85, grande: 110 },
  },
  {
    id: 'banho-tosa',
    nome: 'Banho e Tosa',
    descricao:
      'Combo completo: banho, tosa, corte de unhas e limpeza de ouvidos. O dia de spa do seu pet.',
    duracao: 120,
    icon: 'Sparkles',
    precos: { pequeno: 100, medio: 135, grande: 170 },
  },
]

export const getServiceById = (id) => SERVICES.find((s) => s.id === id)

export const minPrice = (service) => Math.min(...Object.values(service.precos))
