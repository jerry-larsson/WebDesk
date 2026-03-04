<template>
  <transition :name="transitionName" mode="out-in" appear @after-enter="handleAfterTransition" @after-appear="handleAfterTransition">
    <div :key="stateKey" class="wd-auth-gate">
      <slot v-if="showErrorState" name="error" :error="auth.error.value" :retry="retry">
        <div class="wd-auth-gate wd-auth-gate--error d-flex flex-column align-center justify-center ga-3">
          <div class="text-body-medium">
            {{ auth.error.value?.message ?? 'Authentication failed' }}
          </div>
          <v-btn color="primary" variant="tonal" @click="retry">Retry</v-btn>
        </div>
      </slot>

      <slot v-else-if="showLoadingState" name="loading">
        <div class="wd-auth-gate wd-auth-gate--loading d-flex align-center justify-center">
          <v-progress-circular indeterminate color="primary" />
        </div>
      </slot>

      <slot v-else-if="showUnauthenticatedState" name="unauthenticated" :login="auth.login" />

      <slot v-else name="authenticated" :user="auth.user.value" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth'

const props = withDefaults(
  defineProps<{
    autoBootstrap?: boolean
    requireAuth?: boolean
    transitionName?: string
  }>(),
  {
    autoBootstrap: true,
    requireAuth: true,
    transitionName: 'wd-auth-gate-fade',
  },
)

const auth = useAuth()

const showLoadingState = computed(() => {
  if (auth.isChecking.value) {
    // Keep login form mounted during interactive login attempts to avoid
    // transition flicker on failed auth.
    if (auth.initialized.value && props.requireAuth && !auth.isAuthenticated.value) {
      return false
    }
    return true
  }
  if (!props.autoBootstrap) return false
  return !auth.initialized.value
})

const showErrorState = computed(() => auth.status.value === 'error')
const showUnauthenticatedState = computed(() => {
  if (!props.requireAuth) return false
  return !auth.isAuthenticated.value
})
const stateKey = computed(() => {
  if (showErrorState.value) return 'error'
  if (showLoadingState.value) return 'loading'
  if (showUnauthenticatedState.value) return 'unauthenticated'
  return 'authenticated'
})

const retry = () => auth.bootstrap(true)
const handleAfterTransition = () => {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'))
    for (const desktopEl of Array.from(document.querySelectorAll<HTMLElement>('.wd-desktop'))) {
      desktopEl.dispatchEvent(new CustomEvent('wd-workarea-change'))
    }
  })
}

onMounted(() => {
  if (!props.autoBootstrap) return
  auth.bootstrap()
})
</script>

<style scoped>
.wd-auth-gate {
  width: 100%;
  height: 100%;
}

.wd-auth-gate-fade-enter-active,
.wd-auth-gate-fade-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 260ms ease;
}

.wd-auth-gate-fade-enter-from,
.wd-auth-gate-fade-leave-to {
  opacity: 0;
  /* transform: translate(10px) scale(0.992); */
  filter: blur(4px);
}
</style>
