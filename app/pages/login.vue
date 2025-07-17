<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-md flex-col items-center gap-6 px-4 sm:px-6">
      <!-- Login Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          🔐
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Anmelden
        </h1>
        <p class="text-sm text-blue-100/80">
          Melde dich an, um auf erweiterte Funktionen zuzugreifen
        </p>
      </div>

      <!-- Access Required Notification -->
      <div v-if="accessRequired" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-orange-500/40">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-orange-300 text-base flex items-center gap-2">
            <UIcon name="i-heroicons-lock-closed" class="w-5 h-5" />
            Anmeldung erforderlich
          </h3>
          <UBadge color="orange" variant="soft">Zugriff verweigert</UBadge>
        </div>
        <p class="text-orange-200/90 text-sm mb-3">
          {{ getAccessMessage(accessError) }}
        </p>
        <div v-if="returnTo" class="text-xs text-blue-100/70">
          Nach der Anmeldung wirst du zu <strong>{{ returnTo }}</strong> weitergeleitet.
        </div>
      </div>

      <!-- Login Methods -->
      <div class="w-full space-y-4">
        
        <!-- Patreon Login -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-orange-300 text-base flex items-center gap-2">
              <UIcon name="i-heroicons-heart" class="w-5 h-5" />
              Patreon
            </h3>
            <UBadge color="orange" variant="soft">Empfohlen</UBadge>
          </div>
          
          <p class="text-orange-100/80 text-sm mb-4">
            Melde dich mit deinem Patreon-Konto an, um Zugang zu erweiterten Funktionen zu erhalten
          </p>

          <div class="space-y-3">
            <button 
              @click="handlePatreonLogin"
              :disabled="patreonAuth.isLoading.value"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon name="i-heroicons-link" class="w-4 h-4" />
              {{ patreonAuth.isLoading.value ? 'Anmelden...' : 'Mit Patreon anmelden' }}
            </button>
            
            <div v-if="patreonAuth.authError.value" class="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div class="flex items-center gap-2 mb-1">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-400" />
                <span class="text-sm font-medium text-red-400">Anmeldung fehlgeschlagen</span>
              </div>
              <p class="text-xs text-red-300">{{ patreonAuth.authError.value }}</p>
            </div>
          </div>
        </div>

        <!-- Alternative Login Info -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-gray-300 text-base flex items-center gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5" />
              Weitere Anmeldeoptionen
            </h3>
          </div>
          <p class="text-gray-300/80 text-sm mb-3">
            Derzeit ist Patreon die einzige verfügbare Anmeldeoption. Weitere Anmeldemethoden werden in Zukunft hinzugefügt.
          </p>
          <div class="text-xs text-gray-400">
            Brauchst du Hilfe? <NuxtLink to="/therapists" class="text-blue-400 hover:text-blue-300 underline">Zurück zur Hauptseite</NuxtLink>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <button 
        @click="handleBack" 
        class="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-white text-sm font-medium transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95"
      >
        <div class="relative z-10 flex items-center gap-2">
          <span class="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          Zurück
        </div>
        <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </button>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
// Meta configuration
definePageMeta({
  title: 'Anmelden'
})

// Server-side authentication check
const { data: authStatus } = await $fetch('/api/debug/patreon-identity/current', {
  method: 'GET'
}).then(
  (data) => ({ data }),
  (error) => ({ data: null, error })
)

// Route and query parameters
const route = useRoute()
const returnTo = computed(() => route.query.return_to as string)

// If already authenticated, redirect to return_to or home
if (authStatus && returnTo.value) {
  await navigateTo(returnTo.value)
} else if (authStatus) {
  await navigateTo('/therapists')
}

// Composables
const router = useRouter()
const patreonAuth = usePatreonOAuth()

// Query parameters
const accessRequired = computed(() => route.query.access_required === 'true')
const accessError = computed(() => route.query.error as string)

// Get access message based on error
const getAccessMessage = (error: string) => {
  switch (error) {
    case 'patreon_auth_required':
      return 'Du musst dich mit Patreon anmelden, um auf diese Funktion zugreifen zu können'
    case 'access_denied':
      return 'Du hast keinen Zugriff auf die Admin-Funktionen'
    case 'admin_email_not_configured':
      return 'Administrator-E-Mail ist nicht in den Umgebungsvariablen konfiguriert'
    case 'auth_failed':
      return 'Authentifizierung fehlgeschlagen. Bitte versuche es erneut'
    default:
      return 'Du musst dich anmelden, um auf diese Funktion zugreifen zu können'
  }
}

// Handle Patreon login
const handlePatreonLogin = async () => {
  try {
    await patreonAuth.startOAuthFlow()
  } catch (error) {
    console.error('Patreon login failed:', error)
  }
}

// Handle back navigation
const handleBack = () => {
  if (returnTo.value) {
    router.push('/therapists')
  } else {
    router.back()
  }
}

// Watch for successful authentication and redirect
watch(() => patreonAuth.isAuthenticated.value, async (authenticated) => {
  console.log('🔍 Auth state changed:', authenticated)
  if (authenticated) {
    console.log('✅ Authentication successful, redirecting...')
    console.log('returnTo.value:', returnTo.value)
    console.log('route.query:', route.query)
    const destination = returnTo.value || '/patron'  // Default to /patron since that's where they wanted to go
    console.log('Destination:', destination)
    
    try {
      await navigateTo(destination)
      console.log('✅ Navigation completed to:', destination)
    } catch (error) {
      console.error('❌ Navigation failed:', error)
      // Fallback to window.location
      window.location.href = destination
    }
  }
}, { immediate: true })
</script>