<template>
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
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = withDefaults(
  defineProps<{
    autoBootstrap?: boolean
    requireAuth?: boolean
  }>(),
  {
    autoBootstrap: true,
    requireAuth: true,
  },
)

const auth = useAuth()

const showLoadingState = computed(() => {
  if (auth.isChecking.value) return true
  if (!props.autoBootstrap) return false
  return !auth.initialized.value
})

const showErrorState = computed(() => auth.status.value === 'error')
const showUnauthenticatedState = computed(() => {
  if (!props.requireAuth) return false
  return !auth.isAuthenticated.value
})

const retry = () => auth.bootstrap(true)

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
</style>
