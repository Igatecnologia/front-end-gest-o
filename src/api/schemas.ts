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
  password: z.string().min(1),
  createdAt: z.string().min(1),
})

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

/** Item de `GET /sgbrbi/vendas/analitico` */
export const vendaAnaliticaRowSchema = z
  .object({
    data: z.string(),
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
