export type ReportSchedule = {
  id: string
  reportId: string
  reportName: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'csv' | 'xlsx' | 'pdf'
  nextRunAt: string
  createdAt: string
}

const KEY = 'app.reports.schedules.v1'

function uid() {
  return `sch_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function readAll(): ReportSchedule[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as ReportSchedule[]
  } catch {
    return []
  }
}

function writeAll(schedules: ReportSchedule[]) {
  window.localStorage.setItem(KEY, JSON.stringify(schedules))
}

export function listReportSchedules() {
  return readAll().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createReportSchedule(input: Omit<ReportSchedule, 'id' | 'createdAt'>) {
  const current = readAll()
  const next: ReportSchedule = {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  writeAll([next, ...current])
  return next
}

export function deleteReportSchedule(id: string) {
  const current = readAll()
  writeAll(current.filter((x) => x.id !== id))
}
