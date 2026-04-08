import { z } from 'zod'

export const kpiSchema = z.object({
  key: z.enum(['vendas', 'usuarios', 'faturamento']),
  label: z.string().min(1),
  value: z.number(),
  previousValue: z.number(),
  deltaPct: z.number(),
  trend: z.array(z.number()),
})

export const salesPointSchema = z.object({
  date: z.string().min(1),
  value: z.number(),
})

export const revenuePointSchema = z.object({
  month: z.string().min(1),
  value: z.number(),
})

export const heatmapPointSchema = z.object({
  day: z.string().min(1),
  hour: z.number().int().min(0).max(23),
  value: z.number().min(0),
})

export const dashboardLatestRowSchema = z.object({
  id: z.string().min(1),
  cliente: z.string().min(1),
  total: z.number(),
  status: z.enum(['pago', 'pendente', 'cancelado']),
  data: z.string().min(1),
  produto: z.string().default(''),
  codprod: z.union([z.number(), z.string()]).default(''),
  codcliente: z.union([z.number(), z.string()]).default(''),
  qtde: z.number().default(0),
  valorunit: z.number().default(0),
  custounit: z.number().default(0),
  margem: z.number().default(0),
})

export const dashboardResponseSchema = z.object({
  kpis: z.array(kpiSchema),
  sales: z.array(salesPointSchema),
  revenue: z.array(revenuePointSchema),
  heatmap: z.array(heatmapPointSchema),
  latest: z.array(dashboardLatestRowSchema),
})

export const financeEntrySchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  category: z.enum(['Receita', 'Custo Fixo', 'Custo Variável', 'Imposto']),
  description: z.string().min(1),
  amount: z.number(),
})

export const financeOverviewSchema = z.object({
  receita: z.number(),
  custos: z.number(),
  lucro: z.number(),
  margemPct: z.number(),
  /** Presente quando a visão é montada a partir de `vendas/analitico` (contagem de linhas retornadas). */
  linhasCount: z.number().int().nonnegative().optional(),
  monthlyFlow: z.array(
    z.object({
      month: z.string().min(1),
      receita: z.number(),
      custos: z.number(),
      lucro: z.number(),
    }),
  ),
  entries: z.array(financeEntrySchema),
})

export const reportItemSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  categoria: z.enum(['Vendas', 'Usuários', 'Financeiro']),
  tipo: z.enum([
    'Performance',
    'Financeiro',
    'Conversão',
    'Retenção',
    'Tendência',
    'TopN',
    'Sazonalidade',
    'Segmentação',
  ]),
  valorPrincipal: z.number(),
  valorSecundario: z.number(),
  segmento: z.enum(['SMB', 'MidMarket', 'Enterprise']),
  atualizadoEm: z.string().min(1),
})

export const reportsResponseSchema = z.array(reportItemSchema)

export const reportsPagedResponseSchema = z.object({
  items: z.array(reportItemSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})

export const userRoleSchema = z.enum(['admin', 'manager', 'viewer'])
export const userStatusSchema = z.enum(['active', 'inactive'])

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().optional(),
}).passthrough()

export const usersResponseSchema = z.array(userSchema)

export const userCreateInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  password: z.string().min(1),
})

export const auditActionSchema = z.enum([
  'login',
  'logout',
  'users.create',
  'users.update',
  'users.delete',
  'reports.export',
  'pii.reveal',
])

export const auditLogSchema = z.object({
  id: z.string().min(1),
  at: z.string().min(1),
  actor: z.string().min(1),
  action: auditActionSchema,
  target: z.string().optional(),
  piiMasked: z.boolean().optional(),
  sensitiveAccessLogged: z.boolean().optional(),
  diff: z
    .object({
      before: z.record(z.string(), z.unknown()),
      after: z.record(z.string(), z.unknown()),
    })
    .optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export const auditResponseSchema = z.array(auditLogSchema)

/** Resposta de `POST /sgbrbi/usuario/login` */
export const sgbrUsuarioLoginResponseSchema = z.object({
  id_usuario: z.number().int(),
  nome_usuario: z.string(),
  email: z.string().nullable().optional(),
  celular: z.string().nullable().optional(),
  data_cadastro: z.string().optional(),
  token: z.string().min(1),
})

/** Resposta de `POST /api/v1/auth/login` (login local) */
export const localLoginResponseSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'manager', 'viewer']),
  }),
})

/** Item de `GET /sgbrbi/vendas/analitico` */
export const vendaAnaliticaRowSchema = z
  .object({
    data: z.string(),
    codvendedor: z.union([z.number(), z.string()]).optional(),
    nomevendedor: z.string().optional(),
    codprod: z.union([z.number(), z.string()]),
    decprod: z.string(),
    qtdevendida: z.number(),
    und: z.string(),
    qtdeconvertidavd: z.number(),
    precocustoitem: z.number(),
    valorunit: z.number(),
    total: z.number(),
    codcliente: z.union([z.number(), z.string()]),
    nomecliente: z.string(),
    cepcliente: z.string().optional().nullable(),
    totalprodutos: z.number(),
    statuspedido: z.string(),
    datafec: z.string(),
  })
  .passthrough()

export const vendasAnaliticoResponseSchema = z.array(vendaAnaliticaRowSchema)

export type VendaAnaliticaRow = z.infer<typeof vendaAnaliticaRowSchema>

/* ── Schemas dos relatórios financeiros ── */

export const conciliacaoRowSchema = z.object({
  id: z.string().min(1),
  cliente: z.string().min(1),
  dataVenda: z.string().min(1),
  valorVenda: z.number(),
  dataPagamento: z.string().nullable(),
  valorPago: z.number(),
  diferenca: z.number(),
  status: z.enum(['Conciliado', 'Pendente', 'Divergente']),
})
export const conciliacaoResponseSchema = z.array(conciliacaoRowSchema)

export const contaPagarSchema = z.object({
  id: z.string().min(1),
  fornecedor: z.string().min(1),
  descricao: z.string().min(1),
  categoria: z.enum(['Matéria Prima', 'Energia', 'Folha', 'Impostos', 'Frete', 'Outros']),
  valor: z.number(),
  dataEmissao: z.string().min(1),
  dataVencimento: z.string().min(1),
  dataPagamento: z.string().nullable(),
  status: z.enum(['Pago', 'A vencer', 'Vencido']),
})
export const contasPagarResponseSchema = z.array(contaPagarSchema)

export const contaReceberSchema = z.object({
  id: z.string().min(1),
  cliente: z.string().min(1),
  descricao: z.string().min(1),
  valor: z.number(),
  dataEmissao: z.string().min(1),
  dataVencimento: z.string().min(1),
  dataRecebimento: z.string().nullable(),
  status: z.enum(['Recebido', 'A vencer', 'Vencido']),
})
export const contasReceberResponseSchema = z.array(contaReceberSchema)

export const estoqueMateriaPrimaSchema = z.object({
  id: z.string().min(1),
  material: z.string().min(1),
  unidade: z.string().min(1),
  qtdeAtual: z.number(),
  qtdeMinima: z.number(),
  custoUnitario: z.number(),
  custoTotal: z.number(),
  ultimaEntrada: z.string().min(1),
  fornecedor: z.string().min(1),
  status: z.enum(['Normal', 'Baixo', 'Crítico']),
})
export const estoqueMateriaPrimaResponseSchema = z.array(estoqueMateriaPrimaSchema)

export const estoqueEspumaSchema = z.object({
  id: z.string().min(1),
  produto: z.string().min(1),
  tipo: z.enum(['Espuma', 'Aglomerado']),
  densidade: z.string(),
  unidade: z.string().min(1),
  qtdeAtual: z.number(),
  qtdeMinima: z.number(),
  custoUnitario: z.number(),
  custoTotal: z.number(),
  ultimaEntrada: z.string().min(1),
  status: z.enum(['Normal', 'Baixo', 'Crítico']),
})
export const estoqueEspumaResponseSchema = z.array(estoqueEspumaSchema)

export const estoqueProdutoFinalSchema = z.object({
  id: z.string().min(1),
  produto: z.string().min(1),
  tipo: z.enum(['Espuma', 'Aglomerado']),
  densidade: z.string(),
  dimensoes: z.string(),
  unidade: z.string().min(1),
  qtdeAtual: z.number(),
  qtdeMinima: z.number(),
  custoUnitario: z.number(),
  custoTotal: z.number(),
  precoVenda: z.number(),
  ultimaEntrada: z.string().min(1),
  status: z.enum(['Normal', 'Baixo', 'Crítico']),
})
export const estoqueProdutoFinalResponseSchema = z.array(estoqueProdutoFinalSchema)

export const vendaEspumaSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  cliente: z.string().min(1),
  produto: z.string().min(1),
  tipo: z.enum(['Espuma', 'Aglomerado']),
  densidade: z.string(),
  qtde: z.number(),
  unidade: z.string().min(1),
  precoUnitario: z.number(),
  total: z.number(),
  formaPagamento: z.enum(['Dinheiro', 'PIX', 'Cartão', 'Boleto', 'Prazo']),
})
export const vendasEspumaResponseSchema = z.array(vendaEspumaSchema)

/* ═══════════════════════ ERP — Sprint 8 ═══════════════════════ */

export const compraMateriaPrimaSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  fornecedor: z.string().min(1),
  material: z.string().min(1),
  unidade: z.string().min(1),
  quantidade: z.number(),
  custoUnitario: z.number(),
  custoTotal: z.number(),
  classificacao: z.enum(['Produção', 'Despesa Operacional']),
  notaFiscal: z.string(),
  status: z.enum(['Recebido', 'Pendente', 'Cancelado']),
})
export const comprasMateriaPrimaResponseSchema = z.array(compraMateriaPrimaSchema)

export const loteProducaoSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  tipo: z.enum(['Espuma', 'Aglomerado']),
  densidade: z.string(),
  volumeTotalM3: z.number(),
  custoMateriaPrima: z.number(),
  custoEnergia: z.number(),
  custoMaoDeObra: z.number(),
  custoPerdas: z.number(),
  custoIndiretos: z.number(),
  custoTotalLote: z.number(),
  custoPorM3: z.number(),
  rendimentoPct: z.number(),
  operador: z.string(),
  status: z.enum(['Pendente', 'Em Produção', 'Concluído', 'Faturado', 'Cancelado']),
  observacoes: z.string(),
})
export const lotesProducaoResponseSchema = z.array(loteProducaoSchema)

export const fichaTecnicaSchema = z.object({
  id: z.string().min(1),
  produto: z.string().min(1),
  tipo: z.enum(['Espuma', 'Aglomerado']),
  densidade: z.string(),
  alturaM: z.number().positive(),
  larguraM: z.number().positive(),
  comprimentoM: z.number().positive(),
  volumeM3: z.number(),
  pesoEstimadoKg: z.number(),
  consumoMateriaPrimaKg: z.number(),
  custoMateriaPrima: z.number(),
  custoConversao: z.number(),
  custoEstimado: z.number(),
  custoPorM3: z.number(),
  precoSugerido: z.number(),
  margemAlvoPct: z.number(),
  ativo: z.boolean(),
})
export const fichasTecnicasResponseSchema = z.array(fichaTecnicaSchema)

export const itemPedidoSchema = z.object({
  fichaTecnicaId: z.string(),
  produto: z.string(),
  quantidade: z.number(),
  volumeM3Unitario: z.number(),
  volumeM3Total: z.number(),
  precoUnitario: z.number(),
  precoTotal: z.number(),
})

export const pedidoSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  cliente: z.string().min(1),
  itens: z.array(itemPedidoSchema),
  totalPecas: z.number(),
  totalM3: z.number(),
  totalValor: z.number(),
  formaPagamento: z.enum(['Dinheiro', 'PIX', 'Cartão', 'Boleto', 'Prazo']),
  status: z.enum(['Pendente', 'Em Produção', 'Concluído', 'Faturado', 'Cancelado']),
  observacoes: z.string(),
})
export const pedidosResponseSchema = z.array(pedidoSchema)

export const ordemProducaoSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  pedidoIds: z.array(z.string()),
  produtos: z.array(z.string()),
  totalPecas: z.number(),
  totalM3: z.number(),
  consumoEstimadoM3: z.number(),
  loteIds: z.array(z.string()),
  status: z.enum(['Pendente', 'Em Produção', 'Concluído', 'Faturado', 'Cancelado']),
  dataPrevista: z.string(),
  dataConclusao: z.string().nullable(),
  observacoes: z.string(),
})
export const ordensProducaoResponseSchema = z.array(ordemProducaoSchema)

export const faturamentoSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  pedidoId: z.string(),
  cliente: z.string().min(1),
  numeroNF: z.string(),
  valorProdutos: z.number(),
  valorFrete: z.number(),
  valorImpostos: z.number(),
  valorTotal: z.number(),
  formaPagamento: z.enum(['Dinheiro', 'PIX', 'Cartão', 'Boleto', 'Prazo']),
  status: z.enum(['Emitida', 'Cancelada', 'Pendente']),
})
export const faturamentosResponseSchema = z.array(faturamentoSchema)

export const movimentoEstoqueSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  nivelEstoque: z.enum(['Insumo', 'Produto Base']),
  item: z.string().min(1),
  tipoMovimento: z.enum(['Entrada', 'Saída']),
  origem: z.enum(['Compra', 'Produção', 'Venda', 'OP', 'Ajuste', 'Devolução']),
  referenciaId: z.string(),
  quantidade: z.number(),
  unidade: z.string(),
  custoUnitario: z.number(),
  custoTotal: z.number(),
  saldoAnterior: z.number(),
  saldoAtual: z.number(),
})
export const movimentosEstoqueResponseSchema = z.array(movimentoEstoqueSchema)

export const custoRealProdutoSchema = z.object({
  fichaTecnicaId: z.string(),
  produto: z.string().min(1),
  densidade: z.string(),
  custoMateriaPrima: z.number(),
  custoEnergia: z.number(),
  custoMaoDeObra: z.number(),
  custoPerdas: z.number(),
  custoIndiretos: z.number(),
  custoRealTotal: z.number(),
  custoRealPorM3: z.number(),
  precoVenda: z.number(),
  margemRealPct: z.number(),
  margemAlvoPct: z.number(),
  alertaMargem: z.boolean(),
})
export const custoRealProdutosResponseSchema = z.array(custoRealProdutoSchema)

export const alertaOperacionalSchema = z.object({
  id: z.string().min(1),
  data: z.string().min(1),
  tipo: z.enum(['margem_baixa', 'estoque_critico', 'vazamento_lucro', 'producao_atrasada', 'inadimplencia']),
  severidade: z.enum(['alta', 'media', 'baixa']),
  titulo: z.string().min(1),
  descricao: z.string(),
  referenciaId: z.string(),
  lido: z.boolean(),
})
export const alertasOperacionaisResponseSchema = z.array(alertaOperacionalSchema)

/* ═══════════════════════ Fontes de Dados (Data Source Connector) ═══════════════════════ */

export const fieldMappingSchema = z.object({
  standardField: z.string().min(1),
  sourceField: z.string().min(1),
  transform: z.enum(['none', 'uppercase', 'lowercase', 'trim', 'number', 'date_iso']).default('none'),
})

export const dataSourceSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['rest_api', 'sgbr_bi', 'database_view', 'custom']),
  apiUrl: z.string().url(),
  authMethod: z.enum(['none', 'bearer_token', 'api_key', 'basic_auth']),
  authCredentialsMasked: z.string().nullable().optional(),
  status: z.enum(['connected', 'error', 'pending', 'disabled']),
  lastCheckedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  fieldMappings: z.array(fieldMappingSchema),
  erpEndpoints: z.array(z.string()),
  /** Marca esta fonte como provedora de autenticacao (login) */
  isAuthSource: z.boolean().default(false),
  /** Endpoint de login relativo a apiUrl (ex: /sgbrbi/usuario/login) */
  loginEndpoint: z.string().optional(),
  /** Endpoint de dados principal (ex: /sgbrbi/vendas/analitico) */
  dataEndpoint: z.string().optional(),
  /** Como a senha e enviada ao servidor */
  passwordMode: z.enum(['plain', 'sha256', 'md5']).default('plain'),
  /** Nome do campo de usuario no body do login (ex: login, username, email) */
  loginFieldUser: z.string().default('login'),
  /** Nome do campo de senha no body do login (ex: senha, password, pass) */
  loginFieldPassword: z.string().default('senha'),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough()

export const dataSourceListSchema = z.array(dataSourceSchema)

export const dataSourceTestResultSchema = z.object({
  success: z.boolean(),
  latencyMs: z.number(),
  message: z.string(),
  sampleFields: z.array(z.string()).optional(),
}).passthrough()

export const dataSourceCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['rest_api', 'sgbr_bi', 'database_view', 'custom']),
  apiUrl: z.string().url(),
  authMethod: z.enum(['none', 'bearer_token', 'api_key', 'basic_auth']),
  authCredentials: z.string().optional(),
  apiLogin: z.string().optional(),
  apiPassword: z.string().optional(),
  fieldMappings: z.array(fieldMappingSchema).default([]),
  erpEndpoints: z.array(z.string()).default([]),
  isAuthSource: z.boolean().default(false),
  loginEndpoint: z.string().optional(),
  dataEndpoint: z.string().optional(),
  passwordMode: z.enum(['plain', 'sha256', 'md5']).default('plain'),
  loginFieldUser: z.string().default('login'),
  loginFieldPassword: z.string().default('senha'),
})
