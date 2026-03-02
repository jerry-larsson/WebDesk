import type { AuthAdapter, AuthCredentials, AuthSession, AuthUser } from './types'

const DEMO_AUTH_STORAGE_KEY = 'wd:demo-auth-user:v1'

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readStoredUser = (): AuthUser | null => {
  if (!canUseStorage()) return null
  const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (typeof parsed.id !== 'string' || !parsed.id.trim()) return null
    return parsed as AuthUser
  } catch {
    return null
  }
}

const writeStoredUser = (user: AuthUser | null) => {
  if (!canUseStorage()) return
  if (!user) {
    window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(user))
}

const toSession = (user: AuthUser | null): AuthSession => ({
  user,
  authenticated: Boolean(user),
})

const buildUserFromCredentials = (credentials: AuthCredentials): AuthUser => {
  const email = typeof credentials.email === 'string' ? credentials.email.trim() : ''
  const username = typeof credentials.username === 'string' ? credentials.username.trim() : ''
  const displayName = username || email.split('@')[0] || 'WebDesk User'
  const id = email || username || 'demo-user'

  return {
    id,
    displayName,
    email: email || undefined,
  }
}

export const demoAuthAdapter: AuthAdapter = {
  async getSession() {
    return toSession(readStoredUser())
  },

  async login(credentials) {
    const password = typeof credentials.password === 'string' ? credentials.password : ''
    if (!password.trim()) {
      throw {
        code: 'invalid_credentials',
        message: 'Password is required',
        status: 401,
      }
    }

    const user = buildUserFromCredentials(credentials)
    writeStoredUser(user)
    return toSession(user)
  },

  async logout() {
    writeStoredUser(null)
  },

  async refreshSession() {
    return toSession(readStoredUser())
  },
}

