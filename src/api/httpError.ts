import axios from 'axios'
import { ApiContractError } from './validatedHttp'

const statusMessages: Record<number, string> = {
  400: 'Requisicao invalida. Revise os filtros e tente novamente.',
  401: 'Sua sessao expirou. Faca login novamente.',
  403: 'Voce nao tem permissao para executar esta acao.',
  404: 'Recurso nao encontrado.',
  409: 'Conflito de dados. Atualize a pagina e tente novamente.',
  422: 'Dados invalidos. Corrija os campos informados.',
  429: 'Muitas requisicoes. Aguarde alguns segundos.',
  500: 'Erro interno do servidor. Tente novamente em instantes.',
  502: 'Servico temporariamente indisponivel.',
  503: 'Servico em manutencao. Tente novamente mais tarde.',
}

export function getHttpStatusMessage(status?: number): string {
  if (!status) return 'Falha de conexao com o servidor.'
  return statusMessages[status] ?? `Erro HTTP ${status}.`
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiContractError) {
    return 'Resposta da API fora do contrato esperado.'
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as { message?: string } | undefined
    return data?.message?.trim() || getHttpStatusMessage(status)
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
