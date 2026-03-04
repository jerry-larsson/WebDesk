import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import type { AuthCredentials } from '../auth/types'

export const useAuth = () => {
  const store = useAuthStore()
  const {
    status,
    user,
    error,
    initialized,
    isAuthenticated,
    isChecking,
  } = storeToRefs(store)

  const bootstrap = (force = false) => store.bootstrap(force)
  const login = (credentials: AuthCredentials) => store.login(credentials)
  const logout = () => store.logout()
  const refreshSession = () => store.refreshSession()
  const clearError = () => store.clearError()

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
}

export const useRequireAuth = () => {
  const auth = useAuth()

  const requireAuth = () => {
    if (auth.isAuthenticated.value) return
    throw new Error('Authentication required')
  }

  return {
    isAuthenticated: auth.isAuthenticated,
    requireAuth,
  }
}
