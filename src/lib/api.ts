import type {
  Aluguer,
  Cliente,
  DashboardStats,
  Pagamento,
  Usuario,
  Veiculo,
} from '../types'

// Em produção (Vercel) os pedidos vão para "/api", que o vercel.json reencaminha
// para o backend no Render. Em desenvolvimento usa VITE_API_URL (.env.development).
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '/api')

const TOKEN_KEY = 'rentacar_token'
const USER_KEY = 'rentacar_user'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

export function setStoredUser(user: Usuario | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    let message = 'Ocorreu um erro. Tente novamente.'
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail: unknown }).detail
      message = typeof detail === 'string' ? detail : JSON.stringify(detail)
    }
    if (response.status === 401) {
      setToken(null)
      setStoredUser(null)
    }
    throw new ApiError(message, response.status)
  }

  return data as T
}

export interface LoginResponse {
  access_token: string
  token_type: string
  usuario: Usuario
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    profile: () => request<Usuario>('/auth/profile'),
  },

  dashboard: {
    stats: () => request<DashboardStats>('/dashboard/stats'),
  },

  veiculos: {
    listar: (params?: { q?: string; estado?: string }) => {
      const search = new URLSearchParams()
      if (params?.q) search.set('q', params.q)
      if (params?.estado) search.set('estado', params.estado)
      const qs = search.toString()
      return request<Veiculo[]>(`/veiculos${qs ? `?${qs}` : ''}`)
    },
    criar: (payload: Partial<Veiculo>) =>
      request<Veiculo>('/veiculos', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    atualizar: (id: string, payload: Partial<Veiculo>) =>
      request<Veiculo>(`/veiculos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    eliminar: (id: string) =>
      request<{ ok: boolean; id: string }>(`/veiculos/${id}`, {
        method: 'DELETE',
      }),
  },

  clientes: {
    listar: (q?: string) =>
      request<Cliente[]>(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    criar: (payload: Partial<Cliente>) =>
      request<Cliente>('/clientes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    atualizar: (id: string, payload: Partial<Cliente>) =>
      request<Cliente>(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    eliminar: (id: string) =>
      request<{ ok: boolean; id: string }>(`/clientes/${id}`, {
        method: 'DELETE',
      }),
  },

  alugueres: {
    listar: (params?: { q?: string; estado?: string; cliente_id?: string; veiculo_id?: string }) => {
      const search = new URLSearchParams()
      if (params?.q) search.set('q', params.q)
      if (params?.estado) search.set('estado', params.estado)
      if (params?.cliente_id) search.set('cliente_id', params.cliente_id)
      if (params?.veiculo_id) search.set('veiculo_id', params.veiculo_id)
      const qs = search.toString()
      return request<Aluguer[]>(`/alugueres${qs ? `?${qs}` : ''}`)
    },
    criar: (payload: Record<string, unknown>) =>
      request<Aluguer>('/alugueres', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    atualizar: (id: string, payload: Record<string, unknown>) =>
      request<Aluguer>(`/alugueres/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    eliminar: (id: string) =>
      request<{ ok: boolean; id: string }>(`/alugueres/${id}`, {
        method: 'DELETE',
      }),
  },

  pagamentos: {
    listar: (aluguerId?: string) =>
      request<Pagamento[]>(
        `/pagamentos${aluguerId ? `?aluguer_id=${aluguerId}` : ''}`,
      ),
    criar: (payload: Record<string, unknown>) =>
      request<Pagamento>('/pagamentos', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    eliminar: (id: string) =>
      request<{ ok: boolean; id: string }>(`/pagamentos/${id}`, {
        method: 'DELETE',
      }),
  },
}
