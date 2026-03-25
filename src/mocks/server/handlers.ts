import { delay, http, HttpResponse } from 'msw'
import { auditMock } from '../audit'
import { dashboardMock } from '../dashboard'
import { financeMock } from '../finance'
import { reportsMock } from '../reports'
import { usersSeed, type User } from '../users'

let usersDb: User[] = [...usersSeed]

function uid() {
  return `usr_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export const handlers = [
  http.get('*/finance', async () => {
    await delay(450)
    return HttpResponse.json(financeMock)
  }),

  http.get('*/dashboard', async ({ request }) => {
    const url = new URL(request.url)
    const delayMs = Number(url.searchParams.get('delayMs') ?? 700)
    await delay(Number.isFinite(delayMs) ? delayMs : 700)
    return HttpResponse.json(dashboardMock)
  }),

  http.get('*/reports', async ({ request }) => {
    const url = new URL(request.url)
    const delayMs = Number(url.searchParams.get('delayMs') ?? 500)
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const cat = url.searchParams.get('cat') ?? 'all'
    const type = url.searchParams.get('type') ?? 'all'
    const logic = url.searchParams.get('logic') ?? 'and'
    const startDate = url.searchParams.get('startDate') ?? ''
    const endDate = url.searchParams.get('endDate') ?? ''
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') ?? 8))
    const sortBy = url.searchParams.get('sortBy') ?? 'atualizadoEm'
    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc'
    await delay(Number.isFinite(delayMs) ? delayMs : 500)

    const start = startDate ? new Date(startDate).getTime() : Number.NaN
    const end = endDate ? new Date(endDate).getTime() : Number.NaN

    const filtered = reportsMock.filter((r) => {
      const textMatch =
        !q || r.id.toLowerCase().includes(q) || r.nome.toLowerCase().includes(q)
      const catMatch = cat === 'all' || r.categoria === cat
      const typeMatch = type === 'all' || r.tipo === type
      const at = new Date(r.atualizadoEm).getTime()
      const dateMatch =
        (Number.isNaN(start) || at >= start) && (Number.isNaN(end) || at <= end)

      if (logic === 'or') return (textMatch || catMatch || typeMatch) && dateMatch
      return textMatch && catMatch && typeMatch && dateMatch
    })

    const sorted = filtered.slice().sort((a, b) => {
      const aValue = String(a[sortBy as keyof typeof a] ?? '')
      const bValue = String(b[sortBy as keyof typeof b] ?? '')
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    })

    const startIndex = (page - 1) * pageSize
    const items = sorted.slice(startIndex, startIndex + pageSize)
    return HttpResponse.json({ items, total: sorted.length, page, pageSize })
  }),

  http.get('*/audit', async ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const action = url.searchParams.get('action') ?? 'all'
    await delay(450)
    const filtered = auditMock
      .filter((l) => {
        const matchQ =
          !q ||
          l.id.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          (l.target ?? '').toLowerCase().includes(q)
        const matchAction = action === 'all' || l.action === action
        return matchQ && matchAction
      })
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at))
    return HttpResponse.json(filtered)
  }),

  http.get('*/users', async () => {
    await delay(350)
    const sorted = usersDb.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json(sorted)
  }),

  http.post('*/users', async ({ request }) => {
    await delay(350)
    const body = (await request.json()) as Omit<User, 'id' | 'createdAt'>
    const next: User = {
      id: uid(),
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role,
      status: body.status,
      password: body.password,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    usersDb = [next, ...usersDb]
    return HttpResponse.json(next, { status: 201 })
  }),

  http.put('*/users/:id', async ({ params, request }) => {
    await delay(350)
    const id = String(params.id)
    const patch = (await request.json()) as Partial<Omit<User, 'id' | 'createdAt'>>
    const index = usersDb.findIndex((u) => u.id === id)
    if (index < 0) {
      return HttpResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 })
    }
    const current = usersDb[index]
    const next: User = {
      ...current,
      ...patch,
      name: (patch.name ?? current.name).trim(),
      email: (patch.email ?? current.email).trim().toLowerCase(),
    }
    usersDb = usersDb.map((u, i) => (i === index ? next : u))
    return HttpResponse.json(next)
  }),

  http.delete('*/users/:id', async ({ params }) => {
    await delay(350)
    const id = String(params.id)
    usersDb = usersDb.filter((u) => u.id !== id)
    return HttpResponse.json({ ok: true })
  }),
]
