export type SavedView = {
  id: string
  name: string
  params: string // URLSearchParams string
  createdAt: string // ISO
}

type Store = Record<string, SavedView[]>

const KEY = 'app.savedViews.v1'

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Store
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(KEY, JSON.stringify(store))
}

function uid() {
  return `sv_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function listSavedViews(pageKey: string): SavedView[] {
  const store = readStore()
  return store[pageKey] ?? []
}

export function saveView(pageKey: string, name: string, params: URLSearchParams): SavedView {
  const store = readStore()
  const next: SavedView = {
    id: uid(),
    name: name.trim(),
    params: params.toString(),
    createdAt: new Date().toISOString(),
  }
  const current = store[pageKey] ?? []
  store[pageKey] = [next, ...current]
  writeStore(store)
  return next
}

export function deleteView(pageKey: string, id: string) {
  const store = readStore()
  store[pageKey] = (store[pageKey] ?? []).filter((v) => v.id !== id)
  writeStore(store)
}

