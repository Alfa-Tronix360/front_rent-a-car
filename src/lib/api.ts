import type { Cliente, Painel, Proposta, Usuario, Venda, Viatura } from '../types'

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

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/auth/login', json('POST', { email, password })),
    profile: () => request<Usuario>('/auth/profile'),
  },

  dashboard: {
    stats: () => request<Painel>('/dashboard/stats'),
  },

  viaturas: {
    listar: (estado?: string) =>
      request<Viatura[]>(`/viaturas${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`),
    obter: (id: string) => request<Viatura>(`/viaturas/${id}`),
    criar: (payload: Record<string, unknown>) => request<Viatura>('/viaturas', json('POST', payload)),
    atualizar: (id: string, payload: Record<string, unknown>) =>
      request<Viatura>(`/viaturas/${id}`, json('PUT', payload)),
    eliminar: (id: string) => request<{ ok: boolean }>(`/viaturas/${id}`, json('DELETE')),
    adicionarCusto: (id: string, payload: Record<string, unknown>) =>
      request<Viatura>(`/viaturas/${id}/custos`, json('POST', payload)),
    eliminarCusto: (id: string, custoId: string) =>
      request<Viatura>(`/viaturas/${id}/custos/${custoId}`, json('DELETE')),
  },

  clientes: {
    listar: () => request<Cliente[]>('/clientes'),
    criar: (payload: Partial<Cliente>) => request<Cliente>('/clientes', json('POST', payload)),
    atualizar: (id: string, payload: Partial<Cliente>) => request<Cliente>(`/clientes/${id}`, json('PUT', payload)),
    eliminar: (id: string) => request<{ ok: boolean }>(`/clientes/${id}`, json('DELETE')),
  },

  propostas: {
    listar: () => request<Proposta[]>('/propostas'),
    criar: (payload: Record<string, unknown>) => request<Proposta>('/propostas', json('POST', payload)),
    mudarEstado: (id: string, estado: string) =>
      request<Proposta>(`/propostas/${id}/estado`, json('PATCH', { estado })),
    eliminar: (id: string) => request<{ ok: boolean }>(`/propostas/${id}`, json('DELETE')),
  },

  vendas: {
    listar: () => request<Venda[]>('/vendas'),
    obter: (id: string) => request<Venda>(`/vendas/${id}`),
    criar: (payload: Record<string, unknown>) => request<Venda>('/vendas', json('POST', payload)),
    anular: (id: string) => request<{ ok: boolean }>(`/vendas/${id}`, json('DELETE')),
  },

  utilizadores: {
    listar: () => request<Usuario[]>('/utilizadores'),
    criar: (payload: Record<string, unknown>) => request<Usuario>('/utilizadores', json('POST', payload)),
    atualizar: (id: string, payload: Record<string, unknown>) =>
      request<Usuario>(`/utilizadores/${id}`, json('PUT', payload)),
    eliminar: (id: string) => request<{ ok: boolean }>(`/utilizadores/${id}`, json('DELETE')),
  },
}
