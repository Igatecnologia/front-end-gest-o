export type FinanceEntry = {
  id: string
  date: string
  category: 'Receita' | 'Custo Fixo' | 'Custo Variável' | 'Imposto'
  description: string
  amount: number
}

export type FinanceOverview = {
  receita: number
  custos: number
  lucro: number
  margemPct: number
  linhasCount?: number
  monthlyFlow: Array<{
    month: string
    receita: number
    custos: number
    lucro: number
  }>
  entries: FinanceEntry[]
}

export const financeMock: FinanceOverview = {
  receita: 486000,
  custos: 327500,
  lucro: 158500,
  margemPct: 32.6,
  monthlyFlow: [
    { month: 'Out', receita: 72000, custos: 51000, lucro: 21000 },
    { month: 'Nov', receita: 76000, custos: 54000, lucro: 22000 },
    { month: 'Dez', receita: 82000, custos: 57500, lucro: 24500 },
    { month: 'Jan', receita: 79000, custos: 56000, lucro: 23000 },
    { month: 'Fev', receita: 85000, custos: 59000, lucro: 26000 },
    { month: 'Mar', receita: 92000, custos: 60000, lucro: 32000 },
  ],
  entries: [
    {
      id: 'FIN-000',
      date: '2026-02-25',
      category: 'Receita',
      description: 'Recebimento recorrente - Plano Pro',
      amount: 18900,
    },
    {
      id: 'FIN-001',
      date: '2026-03-03',
      category: 'Receita',
      description: 'Recebimento mensal - Plano Enterprise',
      amount: 24000,
    },
    {
      id: 'FIN-002',
      date: '2026-03-05',
      category: 'Custo Fixo',
      description: 'Folha de pagamento',
      amount: -18000,
    },
    {
      id: 'FIN-003',
      date: '2026-03-08',
      category: 'Imposto',
      description: 'Tributos sobre faturamento',
      amount: -7400,
    },
    {
      id: 'FIN-004',
      date: '2026-03-12',
      category: 'Custo Variável',
      description: 'Comissão comercial',
      amount: -3200,
    },
    {
      id: 'FIN-005',
      date: '2026-03-18',
      category: 'Receita',
      description: 'Recebimento avulso - Serviços',
      amount: 11700,
    },
    {
      id: 'FIN-006',
      date: '2026-03-20',
      category: 'Custo Fixo',
      description: 'Infraestrutura cloud',
      amount: -9200,
    },
    {
      id: 'FIN-007',
      date: '2026-03-22',
      category: 'Receita',
      description: 'Upgrade de contrato anual',
      amount: 28400,
    },
    {
      id: 'FIN-008',
      date: '2026-03-25',
      category: 'Custo Variável',
      description: 'Bonificação comercial',
      amount: -4100,
    },
    {
      id: 'FIN-009',
      date: '2026-03-27',
      category: 'Imposto',
      description: 'DAS e tributos municipais',
      amount: -3800,
    },
  ],
}
