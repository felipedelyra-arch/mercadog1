/**
 * Tipos de atendimento veterinário e equipe.
 * Serviços reais do Mercadog: consultas, vacinas, cirurgias e
 * ortopedia veterinária especializada, com clínica 24h.
 * `aPartir: true` exibe o preço como "a partir de".
 */
export const CONSULTA_TYPES = [
  {
    id: 'clinica-geral',
    nome: 'Consulta clínica',
    descricao:
      'Check-up completo, avaliação de sintomas e orientação de cuidados do dia a dia.',
    duracao: 30,
    preco: 150,
    aPartir: false,
    icon: 'Stethoscope',
  },
  {
    id: 'vacinas',
    nome: 'Vacinas',
    descricao:
      'Aplicação de vacinas com carteirinha atualizada e lembrete das próximas doses.',
    duracao: 20,
    preco: 90,
    aPartir: false,
    icon: 'Syringe',
  },
  {
    id: 'cirurgias',
    nome: 'Cirurgias',
    descricao:
      'Procedimentos cirúrgicos com avaliação pré-operatória, estrutura completa e acompanhamento.',
    duracao: 120,
    preco: 400,
    aPartir: true,
    icon: 'Cross',
  },
  {
    id: 'ortopedia',
    nome: 'Ortopedia especializada',
    descricao:
      'Ortopedia veterinária especializada: fraturas, articulações e reabilitação do seu pet.',
    duracao: 40,
    preco: 250,
    aPartir: false,
    icon: 'Bone',
  },
]

export const VETS = [
  {
    nome: 'Dr. Wilson',
    crmv: 'CRMV-SP',
    especialidade: 'Clínica 24h · Ortopedia veterinária especializada',
  },
]

export const getConsultaTypeById = (id) => CONSULTA_TYPES.find((c) => c.id === id)
