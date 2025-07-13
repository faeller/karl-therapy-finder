<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div class="max-w-md w-full mx-4">
      <div class="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 text-center">
        <!-- Loading State -->
        <div v-if="processing" class="space-y-4">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-purple-400 mx-auto" />
          <h2 class="text-xl font-bold text-white">Verbinde mit Patreon...</h2>
          <p class="text-purple-200/70">Einen Moment bitte, wir verarbeiten deine Anmeldung.</p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="space-y-4">
          <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-400 mx-auto" />
          <h2 class="text-xl font-bold text-white">Erfolgreich verbunden!</h2>
          <p class="text-purple-200/70">Dein Patreon-Account wurde erfolgreich verknüpft.</p>
          <UButton @click="redirectToAdmin" class="mt-4">
            Zum Admin Dashboard
          </UButton>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="space-y-4">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-400 mx-auto" />
          <h2 class="text-xl font-bold text-white">Verbindung fehlgeschlagen</h2>
          <p class="text-purple-200/70">{{ errorMessage }}</p>
          <UButton @click="redirectToAdmin" variant="outline" class="mt-4">
            Zurück zum Admin Dashboard
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Patreon Callback - Admin',
  layout: false
})

const route = useRoute()
const processing = ref(true)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')

// Process OAuth callback on mount
onMounted(async () => {
  try {
    const { code, state, error: oauthError } = route.query

    if (oauthError) {
      throw new Error(`OAuth error: ${oauthError}`)
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter')
    }

    // Send callback data to server
    const response = await $fetch('/api/patreon/admin-callback', {
      method: 'POST',
      body: {
        code: code as string,
        state: state as string
      }
    })

    if (response.success) {
      success.value = true
      console.log('✅ Patreon connected:', response.campaign?.name)
    } else {
      throw new Error('Server returned unsuccessful response')
    }

  } catch (err: any) {
    console.error('❌ OAuth callback failed:', err)
    error.value = true
    errorMessage.value = err.message || 'An unexpected error occurred'
  } finally {
    processing.value = false
  }
})

const redirectToAdmin = () => {
  navigateTo('/admin')
}
</script>