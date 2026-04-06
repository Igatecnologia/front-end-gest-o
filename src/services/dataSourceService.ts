import { z } from 'zod'
import {
  dataSourceSchema,
  dataSourceListSchema,
  dataSourceCreateSchema,
  dataSourceTestResultSchema,
} from '../api/schemas'
import { http } from './http'
import { getValidated, postValidated, putValidated } from '../api/validatedHttp'
import { tenantStorage } from '../tenant/tenantStorage'

const BASE = '/api/v1/datasources'
const STORAGE_KEY = 'datasources'

export type DataSource = z.infer<typeof dataSourceSchema>
export type DataSourceCreatePayload = z.infer<typeof dataSourceCreateSchema>
export type DataSourceUpdatePayload = Partial<DataSourceCreatePayload>
export type DataSourceTestResult = z.infer<typeof dataSourceTestResultSchema>

// ─── Cache local (para hasAnySources funcionar antes do fetch) ──────────────

function readCache(): DataSource[] {
  try {
    const raw = tenantStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writeCache(items: DataSource[]) {
  tenantStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function hasAnySources(): boolean {
  return readCache().length > 0
}

export function getAuthDataSource(): DataSource | null {
  return readCache().find((ds) => ds.isAuthSource) ?? null
}

// ─── CRUD via backend ───────────────────────────────────────────────────────

export async function listDataSources(): Promise<DataSource[]> {
  try {
    return await listDataSourcesFromApi()
  } catch {
    return readCache()
  }
}

export async function listDataSourcesFromApi(): Promise<DataSource[]> {
  const list = await getValidated(http, BASE, dataSourceListSchema)
  writeCache(list)
  return list
}

export async function createDataSource(payload: DataSourceCreatePayload): Promise<DataSource> {
  const ds = await postValidated(http, BASE, payload, dataSourceSchema)
  const all = [...readCache().filter((d) => d.id !== ds.id), ds]
  writeCache(all)
  return ds
}

export async function updateDataSource(id: string, payload: DataSourceUpdatePayload): Promise<DataSource> {
  const ds = await putValidated(http, `${BASE}/${id}`, payload, dataSourceSchema)
  writeCache(readCache().map((d) => d.id === id ? ds : d))
  return ds
}

export async function deleteDataSource(id: string): Promise<void> {
  await http.delete(`${BASE}/${id}`)
  writeCache(readCache().filter((d) => d.id !== id))
}

export async function testDataSourceConnection(id: string): Promise<DataSourceTestResult> {
  const result = await postValidated(http, `${BASE}/${id}/test`, {}, dataSourceTestResultSchema)
  // Atualiza cache com novo status
  const all = readCache()
  const idx = all.findIndex((d) => d.id === id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], status: result.success ? 'connected' : 'error', lastCheckedAt: new Date().toISOString(), lastError: result.success ? null : result.message }
    writeCache(all)
  }
  return result
}

export async function testDataSourceDraft(payload: DataSourceCreatePayload): Promise<DataSourceTestResult> {
  return postValidated(http, `${BASE}/test`, payload, dataSourceTestResultSchema)
}
