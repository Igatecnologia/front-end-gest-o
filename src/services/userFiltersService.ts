export type UserSavedFilter = {
  id: string
  userId: string
  page: 'reports'
  name: string
  params: string
  createdAt: string
}

const KEY = 'app.user.savedFilters.v1'

function uid() {
  return `flt_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function readAll(): UserSavedFilter[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as UserSavedFilter[]
  } catch {
    return []
  }
}

function writeAll(filters: UserSavedFilter[]) {
  window.localStorage.setItem(KEY, JSON.stringify(filters))
}

export function listUserSavedFilters(userId: string, page: UserSavedFilter['page']) {
  return readAll()
    .filter((x) => x.userId === userId && x.page === page)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createUserSavedFilter(input: Omit<UserSavedFilter, 'id' | 'createdAt'>) {
  const current = readAll()
  const next: UserSavedFilter = {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  writeAll([next, ...current])
  return next
}

export function deleteUserSavedFilter(id: string) {
  writeAll(readAll().filter((x) => x.id !== id))
}
