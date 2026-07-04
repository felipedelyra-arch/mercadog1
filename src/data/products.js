/**
 * Catálogo de produtos (mock).
 * `image` fica null nesta fase — o ProductCard mostra um tile com o ícone da
 * categoria. Quando a API entregar fotos, basta preencher a URL.
 */
export const PRODUCT_CATEGORIES = [
  { id: 'racao', label: 'Ração', icon: 'Beef' },
  { id: 'brinquedos', label: 'Brinquedos', icon: 'ToyBrick' },
  { id: 'acessorios', label: 'Acessórios', icon: 'Tag' },
  { id: 'higiene', label: 'Higiene', icon: 'Bath' },
]

export const PRODUCTS = [
  { id: 'p01', nome: 'Ração Premium Cães Adultos 10kg', categoria: 'racao', preco: 189.9, destaque: true, image: null },
  { id: 'p02', nome: 'Ração Gatos Castrados Salmão 3kg', categoria: 'racao', preco: 98.5, destaque: false, image: null },
  { id: 'p03', nome: 'Ração Filhotes Frango e Arroz 2,5kg', categoria: 'racao', preco: 74.9, destaque: false, image: null },
  { id: 'p04', nome: 'Sachê Cães Sabor Carne 85g', categoria: 'racao', preco: 4.9, destaque: false, image: null },
  { id: 'p05', nome: 'Bolinha Maciça Super Resistente', categoria: 'brinquedos', preco: 24.9, destaque: true, image: null },
  { id: 'p06', nome: 'Corda Trançada para Cabo de Guerra', categoria: 'brinquedos', preco: 29.9, destaque: false, image: null },
  { id: 'p07', nome: 'Arranhador para Gatos com Plataforma', categoria: 'brinquedos', preco: 149.9, destaque: true, image: null },
  { id: 'p08', nome: 'Mordedor de Nylon Sabor Bacon', categoria: 'brinquedos', preco: 39.9, destaque: false, image: null },
  { id: 'p09', nome: 'Coleira Ajustável com Plaquinha', categoria: 'acessorios', preco: 49.9, destaque: true, image: null },
  { id: 'p10', nome: 'Guia Retrátil 5m para Cães', categoria: 'acessorios', preco: 89.9, destaque: false, image: null },
  { id: 'p11', nome: 'Caminha Redonda Aconchego M', categoria: 'acessorios', preco: 159.9, destaque: false, image: null },
  { id: 'p12', nome: 'Comedouro Duplo Inox Antiderrapante', categoria: 'acessorios', preco: 59.9, destaque: false, image: null },
  { id: 'p13', nome: 'Shampoo Neutro Hipoalergênico 500ml', categoria: 'higiene', preco: 34.9, destaque: false, image: null },
  { id: 'p14', nome: 'Tapete Higiênico 30 unidades', categoria: 'higiene', preco: 79.9, destaque: false, image: null },
  { id: 'p15', nome: 'Escova Removedora de Pelos', categoria: 'higiene', preco: 44.9, destaque: false, image: null },
  { id: 'p16', nome: 'Kit Dental Pasta e Escova para Cães', categoria: 'higiene', preco: 42.9, destaque: false, image: null },
]

export const getCategoryById = (id) => PRODUCT_CATEGORIES.find((c) => c.id === id)
