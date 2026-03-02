import { readonly, shallowRef, type App, type InjectionKey, type Plugin, type Ref } from 'vue'
import type { AuthAdapter, AuthError, AuthStateSnapshot } from './types'

export interface WebDeskAuthConfig {
  adapter: AuthAdapter
  autoBootstrap?: boolean
  allowAnonymous?: boolean
  mapError?: (error: unknown) => AuthError
  onAuthStateChange?: (state: AuthStateSnapshot) => void
  persistUserSnapshot?: boolean
}

export interface ResolvedWebDeskAuthConfig extends WebDeskAuthConfig {
  autoBootstrap: boolean
  allowAnonymous: boolean
  persistUserSnapshot: boolean
}

const resolveWebDeskAuthConfig = (config: WebDeskAuthConfig): ResolvedWebDeskAuthConfig => ({
  ...config,
  autoBootstrap: config.autoBootstrap ?? true,
  allowAnonymous: config.allowAnonymous ?? false,
  persistUserSnapshot: config.persistUserSnapshot ?? false,
})

const webDeskAuthConfigRef = shallowRef<ResolvedWebDeskAuthConfig | null>(null)

export const wdAuthConfigKey: InjectionKey<Readonly<Ref<ResolvedWebDeskAuthConfig | null>>> = Symbol('wd-auth-config')

export const setWebDeskAuthConfig = (config: WebDeskAuthConfig | null) => {
  webDeskAuthConfigRef.value = config ? resolveWebDeskAuthConfig(config) : null
}

export const getWebDeskAuthConfig = () => webDeskAuthConfigRef.value

export const useWebDeskAuthConfig = () => readonly(webDeskAuthConfigRef)

export const createWebDeskAuth = (config: WebDeskAuthConfig): Plugin => {
  const resolvedConfig = resolveWebDeskAuthConfig(config)

  return {
    install(app: App) {
      webDeskAuthConfigRef.value = resolvedConfig
      app.provide(wdAuthConfigKey, readonly(webDeskAuthConfigRef))
    },
  }
}

