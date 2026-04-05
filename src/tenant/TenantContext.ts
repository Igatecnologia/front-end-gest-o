import { createContext, useContext } from 'react'

export type TenantConfig = {
  /** Identificador único do tenant (ex: slug, UUID) */
  tenantId: string
  /** Nome de exibição da empresa */
  companyName: string
  /** URL do logo (pode ser data-url ou URL absoluta) */
  logoUrl: string
  /** Subtítulo do sistema (ex: "Gestão e Análise de Dados") */
  subtitle: string
  /** Cor primária em hex (ex: "#1A7AB5") — sobrescreve o tema padrão */
  primaryColor?: string
}

export type TenantContextValue = {
  tenant: TenantConfig
}

/** Tenant padrão — usado quando nenhum tenant é resolvido */
export const DEFAULT_TENANT: TenantConfig = {
  tenantId: 'default',
  companyName: 'IGA',
  logoUrl: '',
  subtitle: 'Automação & Tecnologia',
}

export const TenantContext = createContext<TenantContextValue | null>(null)

export function useTenant(): TenantConfig {
  const ctx = useContext(TenantContext)
  return ctx?.tenant ?? DEFAULT_TENANT
}
