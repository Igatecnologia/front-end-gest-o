import type { ConciliacaoRow, ContaPagar, ContaReceber, EstoqueMateriaPrima, EstoqueEspuma, VendaEspuma } from '../types/models'
import { getValidated } from '../api/validatedHttp'
import {
  conciliacaoResponseSchema,
  contasPagarResponseSchema,
  contasReceberResponseSchema,
  estoqueMateriaPrimaResponseSchema,
  estoqueEspumaResponseSchema,
  vendasEspumaResponseSchema,
} from '../api/schemas'
import { http } from './http'

export async function getConciliacao(): Promise<ConciliacaoRow[]> {
  return getValidated(http, '/finance/conciliacao', conciliacaoResponseSchema) as Promise<ConciliacaoRow[]>
}

export async function getContasPagar(): Promise<ContaPagar[]> {
  return getValidated(http, '/finance/contas-pagar', contasPagarResponseSchema) as Promise<ContaPagar[]>
}

export async function getContasReceber(): Promise<ContaReceber[]> {
  return getValidated(http, '/finance/contas-receber', contasReceberResponseSchema) as Promise<ContaReceber[]>
}

export async function getEstoqueMateriaPrima(): Promise<EstoqueMateriaPrima[]> {
  return getValidated(http, '/finance/estoque-materia-prima', estoqueMateriaPrimaResponseSchema) as Promise<EstoqueMateriaPrima[]>
}

export async function getEstoqueEspuma(): Promise<EstoqueEspuma[]> {
  return getValidated(http, '/finance/estoque-espuma', estoqueEspumaResponseSchema) as Promise<EstoqueEspuma[]>
}

export async function getVendasEspuma(): Promise<VendaEspuma[]> {
  return getValidated(http, '/finance/vendas-espuma', vendasEspumaResponseSchema) as Promise<VendaEspuma[]>
}
