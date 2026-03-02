export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated' | 'error'

export interface AuthUser {
  id: string
  displayName?: string
  email?: string
  avatar?: string
  roles?: string[]
  [key: string]: unknown
}

export interface AuthSession {
  user: AuthUser | null
  authenticated: boolean
}

export type AuthCredentials = Record<string, unknown>

export interface AuthError {
  code: string
  message: string
  status?: number
  cause?: unknown
}

export interface AuthAdapter {
  getSession: () => Promise<AuthSession>
  login: (credentials: AuthCredentials) => Promise<AuthSession>
  logout: () => Promise<void>
  refreshSession?: () => Promise<AuthSession>
}

export interface AuthStateSnapshot {
  status: AuthStatus
  user: AuthUser | null
  error: AuthError | null
  initialized: boolean
  isAuthenticated: boolean
}

export interface LoginFieldSpec {
  id: string
  label: string
  type?: string
  autocomplete?: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
  props?: Record<string, unknown>
}

