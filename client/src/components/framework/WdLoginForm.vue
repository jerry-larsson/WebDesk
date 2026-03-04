<template>
  <v-card class="wd-login-form" width="100%" min-width="420" max-width="420" rounded="xl" elevation="0">
    <v-card-title v-if="title" class="d-flex flex-column align-center ga-1 text-display-large font-weight-medium mb-2">
      {{ title }}
    </v-card-title>

    <v-card-subtitle v-if="subtitle" class="d-flex flex-column align-center ga-1 text-headline-small mb-2">
      {{ subtitle }}
    </v-card-subtitle>

    <v-card-text>
      <v-form @submit.prevent="submit">
        <div class="d-flex flex-column ga-3">
          <template v-for="field in resolvedFields" :key="field.id">
            <slot name="field" :field="field" :value="formValues[field.id]"
              :set-value="(value: string) => setFieldValue(field.id, value)">
              <v-text-field class="wd-login-form__field" :model-value="formValues[field.id]"
                :type="field.type ?? 'text'" :placeholder="field.label"
                :autocomplete="field.autocomplete" :required="field.required ?? false" variant="outlined"
                density="comfortable" hide-details="auto" v-bind="field.props"
                @update:model-value="setFieldValue(field.id, $event)" rounded="pill" :append-inner-icon="getFieldTypeIcon(field.type)" />
            </slot>
          </template>
        </div>

        <div v-if="auth.error.value" class="mt-3">
          <slot name="error" :error="auth.error.value">
            <v-alert type="error" variant="flat" density="comfortable" rounded="pill">
              {{ auth.error.value.message }}
            </v-alert>
          </slot>
        </div>

        <div class="d-flex align-center justify-center mt-4">
          <slot name="footer" :submit="submit" :loading="auth.isChecking.value">
            <v-btn class="wd-login-form__submit px-8" color="white" type="submit" rounded="pill" variant="flat" :loading="auth.isChecking.value"
              size="large">
              {{ submitLabel }}
            </v-btn>
          </slot>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useAuth } from '../../composables/useAuth'
import type { AuthCredentials, LoginFieldSpec } from '../../auth/types'

const defaultFields: readonly LoginFieldSpec[] = [
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    autocomplete: 'username',
    required: true,
  },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    autocomplete: 'current-password',
    required: true,
  },
]

const props = withDefaults(
  defineProps<{
    fields?: readonly LoginFieldSpec[]
    submitLabel?: string
    title?: string
    subtitle?: string
    useAuthSubmit?: boolean
  }>(),
  {
    submitLabel: 'Log in',
    title: 'Sign in',
    useAuthSubmit: true,
  },
)

const emit = defineEmits<{
  submit: [credentials: AuthCredentials]
}>()

const auth = useAuth()
const formValues = reactive<Record<string, string>>({})

const resolvedFields = computed(() => {
  if (props.fields && props.fields.length > 0) return props.fields
  return defaultFields
})

const setFieldValue = (fieldId: string, value: unknown) => {
  formValues[fieldId] = typeof value === 'string' ? value : String(value ?? '')
}

const isSubmitDisabled = computed(() => {
  if (auth.isChecking.value) return true
  return resolvedFields.value.some(field => {
    if (!field.required) return false
    return !String(formValues[field.id] ?? '').trim()
  })
})

watch(
  resolvedFields,
  fields => {
    for (const field of fields) {
      if (field.id in formValues) continue
      formValues[field.id] = field.defaultValue ?? ''
    }
  },
  { immediate: true, deep: true },
)

const submit = async () => {
  const credentials: AuthCredentials = Object.fromEntries(
    resolvedFields.value.map(field => [field.id, formValues[field.id] ?? '']),
  )
  emit('submit', credentials)

  if (!props.useAuthSubmit) return
  await auth.login(credentials)
}

function getFieldTypeIcon(type: string | undefined): string | undefined {
  switch (type) {
    case 'email':
      return 'mdi-email-outline'
    case 'password':
      return 'mdi-eye-outline'
    default:
      return undefined
  }
}
</script>

<style scoped>
.wd-login-form {
  background: transparent;
  /* border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  background: rgba(var(--v-theme-surface), 0.42) !important;
  backdrop-filter: blur(18px) saturate(135%);
  -webkit-backdrop-filter: blur(18px) saturate(135%);
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.1); */
}

.wd-login-form__field :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.35) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.24);
}

.wd-login-form__field :deep(.v-field--focused) {
  background: rgba(var(--v-theme-surface), 0.48) !important;
}

.wd-login-form__submit {
  backdrop-filter: blur(10px);
}
</style>
