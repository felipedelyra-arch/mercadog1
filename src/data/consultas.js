/**
 * Tipos de atendimento veterinário e equipe.
 * A ordem do array é a ordem exata dos cards na página de consultas.
 * `aPartir: true` exibe o preço como "a partir de";
 * `preco: null` exibe "Sob consulta" (valor depende da avaliação).
 */
export const CONSULTA_TYPES = [
  {
    id: 'clinica-geral',
    nome: 'Consulta clínica geral',
    descricao:
      'Check-up completo, avaliação de sintomas e orientação de cuidados do dia a dia.',
    duracao: 30,
    preco: 150,
    aPartir: false,
    icon: 'Stethoscope',
  },
  {
    id: 'ortopedia',
    nome: 'Ortopédica especializada',
    descricao:
      'Ortopedia veterinária especializada: fraturas, articulações e reabilitação do seu pet.',
    duracao: 40,
    preco: 250,
    aPartir: false,
    icon: 'Bone',
  },
  {
    id: 'exames-imagem',
    nome: 'Exames por imagem',
    descricao:
      'Diagnóstico por imagem com laudo do especialista para fechar o quadro do seu pet.',
    duracao: 40,
    preco: null,
    aPartir: false,
    icon: 'Scan',
  },
  {
    id: 'ultrassom',
    nome: 'Ultrassom',
    descricao:
      'Ultrassonografia abdominal e gestacional, sem dor e sem necessidade de sedação.',
    duracao: 40,
    preco: null,
    aPartir: false,
    icon: 'AudioWaveform',
  },
  {
    id: 'raio-x-digital',
    nome: 'Raio X digital',
    descricao:
      'Radiografia digital com imagem em alta definição e resultado na hora.',
    duracao: 30,
    preco: null,
    aPartir: false,
    icon: 'Radiation',
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
]

export const VETS = [
  {
    nome: 'Dr. Wilson',
    crmv: 'CRMV-SP',
    especialidade: 'Clínica 24h · Ortopedia veterinária especializada',
  },
]

export const getConsultaTypeById = (id) => CONSULTA_TYPES.find((c) => c.id === id)
