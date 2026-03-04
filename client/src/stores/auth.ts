import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getWebDeskAuthConfig } from '../auth/config'
import type { AuthCredentials, AuthError, AuthSession, AuthStateSnapshot, AuthStatus, AuthUser } from '../auth/types'

const AUTH_USER_SNAPSHOT_STORAGE_KEY = 'wd:auth-user-snapshot:v1'

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const toDefaultAuthError = (error: unknown): AuthError => {
  if (typeof error === 'object' && error !== null) {
    const message = 'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : 'Authentication request failed'
    const code = 'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : 'auth_error'
    const status = 'status' in error && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : undefined

    return { code, message, status, cause: error }
  }

  return {
    code: 'auth_error',
    message: 'Authentication request failed',
    cause: error,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('idle')
  const user = ref<AuthUser | null>(null)
  const error = ref<AuthError | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => {
    const config = getWebDeskAuthConfig()
    return status.value === 'authenticated' || Boolean(config?.allowAnonymous)
  })
  const isChecking = computed(() => status.value === 'checking')

  const getSnapshot = (): AuthStateSnapshot => ({
    status: status.value,
    user: user.value,
    error: error.value,
    initialized: initialized.value,
    isAuthenticated: isAuthenticated.value,
  })

  const notifyAuthStateChange = () => {
    const config = getWebDeskAuthConfig()
    config?.onAuthStateChange?.(getSnapshot())
  }

  const persistUserSnapshot = () => {
    const config = getWebDeskAuthConfig()
    if (!canUseStorage()) return

    if (!config?.persistUserSnapshot || !user.value) {
      window.localStorage.removeItem(AUTH_USER_SNAPSHOT_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(AUTH_USER_SNAPSHOT_STORAGE_KEY, JSON.stringify(user.value))
  }

  const normalizeError = (rawError: unknown): AuthError => {
    const config = getWebDeskAuthConfig()
    return config?.mapError ? config.mapError(rawError) : toDefaultAuthError(rawError)
  }

  const applySession = (session: AuthSession) => {
    if (session.authenticated && session.user) {
      status.value = 'authenticated'
      user.value = session.user
      error.value = null
      initialized.value = true
      persistUserSnapshot()
      notifyAuthStateChange()
      return
    }

    status.value = 'unauthenticated'
    user.value = null
    error.value = null
    initialized.value = true
    persistUserSnapshot()
    notifyAuthStateChange()
  }

  const bootstrap = async (force = false) => {
    if (initialized.value && !force) return getSnapshot()

    const config = getWebDeskAuthConfig()
    if (!config) {
      status.value = 'unauthenticated'
      user.value = null
      error.value = null
      initialized.value = true
      notifyAuthStateChange()
      return getSnapshot()
    }

    status.value = 'checking'
    error.value = null
    notifyAuthStateChange()

    try {
      const session = await config.adapter.getSession()
      applySession(session)
    } catch (rawError) {
      status.value = config.allowAnonymous ? 'unauthenticated' : 'error'
      user.value = null
      error.value = normalizeError(rawError)
      initialized.value = true
      persistUserSnapshot()
      notifyAuthStateChange()
    }

    return getSnapshot()
  }

  const login = async (credentials: AuthCredentials) => {
    const config = getWebDeskAuthConfig()
    if (!config) {
      const missingAdapterError: AuthError = {
        code: 'auth_not_configured',
        message: 'WebDesk auth adapter is not configured',
      }
      status.value = 'error'
      error.value = missingAdapterError
      initialized.value = true
      notifyAuthStateChange()
      throw missingAdapterError
    }

    status.value = 'checking'
    error.value = null
    notifyAuthStateChange()

    try {
      const session = await config.adapter.login(credentials)
      applySession(session)
      return getSnapshot()
    } catch (rawError) {
      status.value = 'unauthenticated'
      user.value = null
      error.value = normalizeError(rawError)
      initialized.value = true
      persistUserSnapshot()
      notifyAuthStateChange()
      throw error.value
    }
  }

  const logout = async () => {
    const config = getWebDeskAuthConfig()
    let logoutError: AuthError | null = null

    if (config) {
      try {
        await config.adapter.logout()
      } catch (rawError) {
        logoutError = normalizeError(rawError)
      }
    }

    status.value = 'unauthenticated'
    user.value = null
    error.value = logoutError
    initialized.value = true
    persistUserSnapshot()
    notifyAuthStateChange()

    return getSnapshot()
  }

  const refreshSession = async () => {
    const config = getWebDeskAuthConfig()
    if (!config?.adapter.refreshSession) return getSnapshot()

    try {
      const session = await config.adapter.refreshSession()
      applySession(session)
    } catch (rawError) {
      status.value = config.allowAnonymous ? 'unauthenticated' : 'error'
      user.value = null
      error.value = normalizeError(rawError)
      initialized.value = true
      persistUserSnapshot()
      notifyAuthStateChange()
    }

    return getSnapshot()
  }

  const clearError = () => {
    error.value = null
    notifyAuthStateChange()
  }

  return {
    status,
    user,
    error,
    initialized,
    isAuthenticated,
    isChecking,
    bootstrap,
    login,
    logout,
    refreshSession,
    clearError,
  }
})
