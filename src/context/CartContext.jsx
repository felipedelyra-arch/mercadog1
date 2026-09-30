import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Carrinho da loja.
 *
 * Guarda uma cópia do produto (nome, detalhes, preço, foto) só para exibir;
 * no envio vai para o banco apenas id + quantidade, e o preço é relido lá.
 * Fica salvo no navegador para sobreviver a um recarregar de página.
 */
const STORAGE_KEY = 'mercadog:carrinho'
const MAX_QTD = 99

const CartContext = createContext(null)

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadItems)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // navegador sem storage (aba anônima bloqueada): carrinho vive só na sessão
    }
  }, [items])

  const add = useCallback((product) => {
    setItems((current) => {
      const found = current.find((i) => i.id === product.id)
      if (found) {
        return current.map((i) =>
          i.id === product.id ? { ...i, quantidade: Math.min(i.quantidade + 1, MAX_QTD) } : i,
        )
      }
      const { id, nome, detalhes, preco, image, categorias, exige_receita } = product
      return [...current, { id, nome, detalhes, preco, image, categorias, exige_receita, quantidade: 1 }]
    })
  }, [])

  const setQuantity = useCallback((id, quantidade) => {
    setItems((current) =>
      quantidade <= 0
        ? current.filter((i) => i.id !== id)
        : current.map((i) => (i.id === id ? { ...i, quantidade: Math.min(quantidade, MAX_QTD) } : i)),
    )
  }, [])

  const remove = useCallback((id) => setItems((c) => c.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantidade, 0)
    const total = items.reduce((sum, i) => sum + (i.preco ?? 0) * i.quantidade, 0)
    const sobConsulta = items.some((i) => i.preco == null)
    const comReceita = items.filter((i) => i.exige_receita)
    const quantityOf = (id) => items.find((i) => i.id === id)?.quantidade ?? 0
    return {
      items,
      count,
      total,
      sobConsulta,
      comReceita,
      quantityOf,
      add,
      setQuantity,
      remove,
      clear,
      open,
      setOpen,
    }
  }, [items, open, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return ctx
}
