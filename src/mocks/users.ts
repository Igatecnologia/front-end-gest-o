export type UserRole = 'admin' | 'manager' | 'viewer'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'inactive'
  // Mock-only: senha em texto puro apenas para demonstrar o fluxo completo.
  password: string
  createdAt: string // ISO
}

export const usersSeed: User[] = [
  {
    id: 'usr_001',
    name: 'Administrador',
    email: 'admin@admin.com',
    role: 'admin',
    status: 'active',
    password: 'admin',
    createdAt: '2026-01-10',
  },
  {
    id: 'usr_002',
    name: 'Maria Souza',
    email: 'maria@empresa.com',
    role: 'manager',
    status: 'active',
    password: 'admin',
    createdAt: '2026-02-02',
  },
  {
    id: 'usr_003',
    name: 'João Lima',
    email: 'joao@empresa.com',
    role: 'viewer',
    status: 'inactive',
    password: 'admin',
    createdAt: '2026-02-20',
  },
]

