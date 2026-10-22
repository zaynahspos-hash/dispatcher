export interface UserProfile {
  id: string
  email: string
  role: string
  status?: string // 'active' | 'suspended'
  is_blocked?: boolean
  created_at: string
  settings?: {
    settings: any
  } | null
}

export interface LogEntry {
  id: string
  user_id: string
  action: string
  details: string | null
  created_at: string
}

export interface CustomerEntry {
  id: string
  user_id: string
  phone: string
  name: string
  source?: 'app' | 'postex_portal' | string
  created_at: string
  updated_at?: string
  user?: {
    email: string
  } | null
}
