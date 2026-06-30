import type {
  AuthResponse,
  Calculation,
  CalcInput,
  ConductorType,
  LoginRequest,
  Organization,
  RegisterRequest,
  Subscription,
  SubscriptionStatus,
  User,
} from './types'

const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? `Error ${res.status}`, body.error)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register: (body: RegisterRequest) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: LoginRequest) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    me: () => request<User>('/auth/me'),

    updateMe: (body: { name?: string; email?: string; avatar_url?: string; current_password?: string; new_password?: string }) =>
      request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  conductors: {
    list: () => request<ConductorType[]>('/conductors'),
  },

  calculations: {
    create: (body: CalcInput) =>
      request<Calculation>('/calculations', { method: 'POST', body: JSON.stringify(body) }),

    list: (page = 1) => request<Calculation[]>(`/calculations?page=${page}`),

    get: (id: number) => request<Calculation>(`/calculations/${id}`),

    download: (id: number) =>
      request<{ download_count: number }>(`/calculations/${id}/download`, { method: 'POST' }),
  },

  subscription: {
    get: () => request<SubscriptionStatus>('/subscription'),
  },

  admin: {
    listUsers: () => request<User[]>('/admin/users'),
    listOrganizations: () => request<Organization[]>('/admin/organizations'),
    listSubscriptions: () => request<Subscription[]>('/admin/subscriptions'),
    updateSubscription: (id: number, body: { plan: string; status: string; program_code?: string | null }) =>
      request<Subscription>(`/admin/subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
}
