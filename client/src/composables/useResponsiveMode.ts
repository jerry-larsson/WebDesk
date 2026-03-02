import { computed } from 'vue'
import { useDisplay } from 'vuetify'

// Centralized rule for "mobile mode" across the app.
// Change this single computed if you want a different breakpoint policy.
export const useResponsiveMode = () => {
  const display = useDisplay()
  const isMobile = computed(() => display.mdAndDown.value)

  return {
    isMobile,
  }
}

