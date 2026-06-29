export interface Organization {
  id: number
  name: string
  created_at: string
}

export interface User {
  id: number
  org_id: number
  email: string
  name: string
  role: 'user' | 'admin' | 'superadmin'
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Subscription {
  id: number
  org_id: number
  plan: 'free' | 'basico' | 'pro'
  status: 'active' | 'cancelled' | 'expired'
  activated_by: number | null
  stripe_customer_id: string | null
  expires_at: string | null
  program_code: string | null
  created_at: string
  updated_at: string
}

export interface DailyUsage {
  id: number
  user_id: number
  org_id: number
  usage_date: string
  template_count: number
}

export interface SubscriptionStatus {
  subscription: Subscription | null
  daily_usage: DailyUsage | null
  free_limit: number
}

export interface ConductorType {
  id: number
  code: string
  display_name: string
  material: string
  line_type: string
  r_ohm_km: number
  x_ohm_km: number
  rn_ohm_km: number
  xn_ohm_km: number
  rpn_ohm_km: number
  xpn_ohm_km: number
  b_us_km: number
  b0_us_km: number
  bn_us_km: number
  bpn_us_km: number
  i_ground_ka: number
  i_air_ka: number
  active: boolean
  created_at: string
}

export interface CalcInput {
  nombre: string
  descripcion?: string
  subtipo: string
  fase_conexion: string
  voltaje_kv: number
  conductor_code: string
  configuracion: string
  circuito: string
  tipo_uso: string
  circuitos: string
  distancia_m: number
  template_program_code: string
}

export interface Calculation {
  id?: number
  inputs: CalcInput
  result_data: Record<string, unknown> | null
  result_text: string | null
  result_html: string | null
  download_count: number
  template_program_id: number
  created_at: string
}

export interface ApiError {
  error: string
  message: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  org_name?: string
}

export interface LoginRequest {
  email: string
  password: string
}
