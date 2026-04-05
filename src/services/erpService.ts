import type {
  CompraMateriaPrima,
  LoteProducao,
  FichaTecnica,
  Pedido,
  OrdemProducao,
  Faturamento,
  MovimentoEstoque,
  CustoRealProduto,
  AlertaOperacional,
} from '../types/models'
import { getValidated } from '../api/validatedHttp'
import {
  comprasMateriaPrimaResponseSchema,
  lotesProducaoResponseSchema,
  fichasTecnicasResponseSchema,
  pedidosResponseSchema,
  ordensProducaoResponseSchema,
  faturamentosResponseSchema,
  movimentosEstoqueResponseSchema,
  custoRealProdutosResponseSchema,
  alertasOperacionaisResponseSchema,
} from '../api/schemas'
import { http } from './http'

export async function getComprasMateriaPrima(): Promise<CompraMateriaPrima[]> {
  return getValidated(http, '/erp/compras-materia-prima', comprasMateriaPrimaResponseSchema) as Promise<CompraMateriaPrima[]>
}

export async function getLotesProducao(): Promise<LoteProducao[]> {
  return getValidated(http, '/erp/lotes-producao', lotesProducaoResponseSchema) as Promise<LoteProducao[]>
}

export async function getFichasTecnicas(): Promise<FichaTecnica[]> {
  return getValidated(http, '/erp/fichas-tecnicas', fichasTecnicasResponseSchema) as Promise<FichaTecnica[]>
}

export async function getPedidos(): Promise<Pedido[]> {
  return getValidated(http, '/erp/pedidos', pedidosResponseSchema) as Promise<Pedido[]>
}

export async function getOrdensProducao(): Promise<OrdemProducao[]> {
  return getValidated(http, '/erp/ordens-producao', ordensProducaoResponseSchema) as Promise<OrdemProducao[]>
}

export async function getFaturamentos(): Promise<Faturamento[]> {
  return getValidated(http, '/erp/faturamentos', faturamentosResponseSchema) as Promise<Faturamento[]>
}

export async function getMovimentosEstoque(): Promise<MovimentoEstoque[]> {
  return getValidated(http, '/erp/movimentos-estoque', movimentosEstoqueResponseSchema) as Promise<MovimentoEstoque[]>
}

export async function getCustoRealProdutos(): Promise<CustoRealProduto[]> {
  return getValidated(http, '/erp/custo-real', custoRealProdutosResponseSchema) as Promise<CustoRealProduto[]>
}

export async function getAlertasOperacionais(): Promise<AlertaOperacional[]> {
  return getValidated(http, '/erp/alertas', alertasOperacionaisResponseSchema) as Promise<AlertaOperacional[]>
}
