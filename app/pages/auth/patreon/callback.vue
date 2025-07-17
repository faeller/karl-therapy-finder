<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
    <div class="text-center text-white">
      <div class="mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
          <LoadingSpinner 
            type="icon" 
            color="white" 
            container-class="py-0"
          />
        </div>
        <h1 class="text-2xl font-bold mb-2">Connecting to Patreon</h1>
        <p class="text-orange-100">Processing your authentication...</p>
      </div>
      
      <div v-if="error" class="bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
          <span class="font-medium text-red-400">Authentication Failed</span>
        </div>
        <p class="text-sm text-red-300">{{ error }}</p>
        <button 
          @click="closeWindow"
          class="mt-3 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded text-sm transition-colors"
        >
          Close Window
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta configuration
definePageMeta({
  layout: false,
  title: 'Patreon OAuth Callback'
})

const route = useRoute()
const error = ref<string | null>(null)

const closeWindow = () => {
  if (window.opener) {
    window.close()
  }
}

onMounted(() => {
  const code = route.query.code as string
  const state = route.query.state as string
  const errorParam = route.query.error as string
  const errorDescription = route.query.error_description as string

  if (errorParam) {
    error.value = errorDescription || errorParam
    // Send error to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'PATREON_OAUTH_ERROR',
        error: error.value
      }, window.location.origin)
    }
    return
  }

  if (code && state) {
    // Send success with code and state to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'PATREON_OAUTH_SUCCESS',
        code: code,
        state: state
      }, window.location.origin)
      
      // Close the popup after a short delay
      setTimeout(() => {
        window.close()
      }, 1000)
    }
  } else {
    error.value = 'No authorization code or state received'
    if (window.opener) {
      window.opener.postMessage({
        type: 'PATREON_OAUTH_ERROR',
        error: error.value
      }, window.location.origin)
    }
  }
})
</script>