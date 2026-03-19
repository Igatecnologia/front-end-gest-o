export type DashboardSharePermission = 'view' | 'edit'

export type DashboardShareEntry = {
  id: string
  target: string
  permission: DashboardSharePermission
  createdAt: string
}

export type DashboardPrefs = {
  favorite: boolean
  shares: DashboardShareEntry[]
}

const KEY = 'app.dashboard.prefs.v1'

function uid() {
  return `share_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function getDashboardPrefs(): DashboardPrefs {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { favorite: false, shares: [] }
    const parsed = JSON.parse(raw) as DashboardPrefs
    return {
      favorite: Boolean(parsed.favorite),
      shares: Array.isArray(parsed.shares) ? parsed.shares : [],
    }
  } catch {
    return { favorite: false, shares: [] }
  }
}

export function setDashboardFavorite(next: boolean) {
  const current = getDashboardPrefs()
  const updated: DashboardPrefs = { ...current, favorite: next }
  window.localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function addDashboardShare(
  target: string,
  permission: DashboardSharePermission,
): DashboardPrefs {
  const current = getDashboardPrefs()
  const entry: DashboardShareEntry = {
    id: uid(),
    target: target.trim(),
    permission,
    createdAt: new Date().toISOString(),
  }
  const updated: DashboardPrefs = {
    ...current,
    shares: [entry, ...current.shares],
  }
  window.localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function removeDashboardShare(id: string): DashboardPrefs {
  const current = getDashboardPrefs()
  const updated: DashboardPrefs = {
    ...current,
    shares: current.shares.filter((x) => x.id !== id),
  }
  window.localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}
