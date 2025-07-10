<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center p-4">
    <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
      <div v-if="status === 'processing'" class="space-y-4">
        <div class="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 class="text-xl font-bold text-white">Verarbeite Authentifizierung...</h2>
        <p class="text-blue-100/80">Einen Moment bitte, während wir dich anmelden.</p>
      </div>
      
      <div v-else-if="status === 'success'" class="space-y-4">
        <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <UIcon name="i-heroicons-check" class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-xl font-bold text-white">Erfolgreich authentifiziert!</h2>
        <p class="text-blue-100/80">Du kannst dieses Fenster jetzt schließen.</p>
      </div>
      
      <div v-else-if="status === 'error'" class="space-y-4">
        <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
          <UIcon name="i-heroicons-x-mark" class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-xl font-bold text-white">Authentifizierung fehlgeschlagen</h2>
        <p class="text-blue-100/80">{{ errorMessage }}</p>
        <button 
          @click="retry"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const status = ref<'processing' | 'success' | 'error'>('processing')
const errorMessage = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const error = route.query.error as string

  if (error) {
    status.value = 'error'
    errorMessage.value = `OAuth Fehler: ${error}`
    
    // Send error to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'GMAIL_OAUTH_ERROR',
        error: errorMessage.value
      }, window.location.origin)
    }
    return
  }

  if (!code) {
    status.value = 'error'
    errorMessage.value = 'Kein Autorisierungscode erhalten'
    
    // Send error to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'GMAIL_OAUTH_ERROR',
        error: errorMessage.value
      }, window.location.origin)
    }
    return
  }

  try {
    // Send the code to parent window for processing
    if (window.opener) {
      window.opener.postMessage({
        type: 'GMAIL_OAUTH_SUCCESS',
        code
      }, window.location.origin)
      
      status.value = 'success'
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        window.close()
      }, 2000)
    } else {
      throw new Error('Kein Elternfenster gefunden')
    }
  } catch (error: any) {
    status.value = 'error'
    errorMessage.value = error.message || 'Unbekannter Fehler'
    
    // Send error to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'GMAIL_OAUTH_ERROR',
        error: errorMessage.value
      }, window.location.origin)
    }
  }
})

const retry = () => {
  window.close()
}
</script>