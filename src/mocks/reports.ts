export type ReportItem = {
  id: string
  nome: string
  categoria: 'Vendas' | 'Usuários' | 'Financeiro'
  tipo:
    | 'Performance'
    | 'Financeiro'
    | 'Conversão'
    | 'Retenção'
    | 'Tendência'
    | 'TopN'
    | 'Sazonalidade'
    | 'Segmentação'
  valorPrincipal: number
  valorSecundario: number
  segmento: 'SMB' | 'MidMarket' | 'Enterprise'
  atualizadoEm: string // ISO date
}

export const reportsMock: ReportItem[] = [
  {
    id: 'REP-001',
    nome: 'Vendas por período',
    categoria: 'Vendas',
    tipo: 'Tendência',
    valorPrincipal: 186540,
    valorSecundario: 12.4,
    segmento: 'Enterprise',
    atualizadoEm: '2026-03-18',
  },
  {
    id: 'REP-002',
    nome: 'Usuários ativos',
    categoria: 'Usuários',
    tipo: 'Retenção',
    valorPrincipal: 78.2,
    valorSecundario: 3.6,
    segmento: 'MidMarket',
    atualizadoEm: '2026-03-12',
  },
  {
    id: 'REP-003',
    nome: 'Receita mensal',
    categoria: 'Financeiro',
    tipo: 'Financeiro',
    valorPrincipal: 92000,
    valorSecundario: 32000,
    segmento: 'Enterprise',
    atualizadoEm: '2026-03-10',
  },
  {
    id: 'REP-004',
    nome: 'Tempo de resposta da API',
    categoria: 'Usuários',
    tipo: 'Performance',
    valorPrincipal: 342,
    valorSecundario: -11.7,
    segmento: 'SMB',
    atualizadoEm: '2026-03-16',
  },
  {
    id: 'REP-005',
    nome: 'Funil de conversão trimestral',
    categoria: 'Vendas',
    tipo: 'Conversão',
    valorPrincipal: 22.4,
    valorSecundario: 2.1,
    segmento: 'MidMarket',
    atualizadoEm: '2026-03-11',
  },
  {
    id: 'REP-006',
    nome: 'Top 10 clientes por receita',
    categoria: 'Financeiro',
    tipo: 'TopN',
    valorPrincipal: 10,
    valorSecundario: 64.2,
    segmento: 'Enterprise',
    atualizadoEm: '2026-03-09',
  },
  {
    id: 'REP-007',
    nome: 'Sazonalidade de vendas',
    categoria: 'Vendas',
    tipo: 'Sazonalidade',
    valorPrincipal: 1.34,
    valorSecundario: 0.12,
    segmento: 'SMB',
    atualizadoEm: '2026-03-08',
  },
  {
    id: 'REP-008',
    nome: 'Segmentação de receita por plano',
    categoria: 'Financeiro',
    tipo: 'Segmentação',
    valorPrincipal: 3,
    valorSecundario: 48.7,
    segmento: 'MidMarket',
    atualizadoEm: '2026-03-07',
  },
]

