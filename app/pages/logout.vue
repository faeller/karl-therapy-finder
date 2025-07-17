<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-md flex-col items-center gap-6 px-4 sm:px-6">
      <!-- Logout Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-red-500/30 bg-gradient-to-br from-red-400/80 to-red-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          🚪
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Abmelden
        </h1>
        <p class="text-sm text-red-100/80">
          {{ autoLogout ? 'Du wirst automatisch abgemeldet...' : 'Möchtest du dich wirklich abmelden?' }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="patreonAuth.isInitializing.value" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-400" />
          </div>
          <p class="text-white text-sm mb-2">Prüfe Anmeldestatus...</p>
        </div>
      </div>

      <!-- Auto Logout State -->
      <div v-else-if="autoLogout && !isLoggedOut" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-400" />
          </div>
          <p class="text-white text-sm mb-2">Abmeldung läuft...</p>
          <p class="text-gray-300 text-xs">
            Du wirst in {{ countdown }} Sekunden zur Hauptseite weitergeleitet
          </p>
        </div>
      </div>

      <!-- Confirmation Required -->
      <div v-else-if="requireConfirmation && !isLoggedOut" class="w-full space-y-4">
        
        <!-- User Info -->
        <div v-if="patreonAuth.user.value" class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center gap-3">
            <div v-if="patreonAuth.user.value.image_url" class="w-12 h-12 rounded-full overflow-hidden">
              <img 
                :src="patreonAuth.user.value.image_url" 
                :alt="patreonAuth.user.value.full_name"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-user" class="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 class="font-medium text-white">{{ patreonAuth.user.value.full_name }}</h3>
              <p class="text-sm text-gray-300">{{ patreonAuth.user.value.email }}</p>
            </div>
          </div>
        </div>

        <!-- Logout Confirmation -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
          <div class="text-center space-y-4">
            <div class="flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-question-mark-circle" class="w-8 h-8 text-yellow-400" />
            </div>
            <p class="text-white text-sm">
              Du bist gerade angemeldet. Möchtest du dich wirklich abmelden?
            </p>
            <p class="text-gray-300 text-xs">
              Nach der Abmeldung musst du dich erneut mit Patreon anmelden, um auf erweiterte Funktionen zugreifen zu können.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button 
            @click="handleLogout"
            :disabled="isLoading"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
            {{ isLoading ? 'Abmelden...' : 'Ja, abmelden' }}
          </button>
          
          <button 
            @click="handleCancel"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            Abbrechen
          </button>
        </div>
      </div>

      <!-- Logout Success -->
      <div v-else-if="isLoggedOut" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-400" />
          </div>
          <h3 class="font-medium text-white mb-2">Erfolgreich abgemeldet</h3>
          <p class="text-gray-300 text-sm mb-4">
            Du wirst in {{ countdown }} Sekunden zur Hauptseite weitergeleitet
          </p>
          <button 
            @click="navigateToHome"
            class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
          >
            <UIcon name="i-heroicons-home" class="w-4 h-4" />
            Sofort zur Hauptseite
          </button>
        </div>
      </div>

      <!-- Not Logged In -->
      <div v-else class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-information-circle" class="w-8 h-8 text-blue-400" />
          </div>
          <h3 class="font-medium text-white mb-2">Nicht angemeldet</h3>
          <p class="text-gray-300 text-sm mb-4">
            Du bist derzeit nicht angemeldet.
          </p>
          <div class="flex gap-3">
            <NuxtLink 
              to="/login"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
              Anmelden
            </NuxtLink>
            <button 
              @click="navigateToHome"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-home" class="w-4 h-4" />
              Zur Hauptseite
            </button>
          </div>
        </div>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
// Meta configuration
definePageMeta({
  title: 'Abmelden'
})

// Composables
const route = useRoute()
const router = useRouter()
const patreonAuth = usePatreonOAuth()

// Query parameters
const requireConfirmation = computed(() => route.query.confirm === 'true')
const autoLogout = computed(() => !requireConfirmation.value)

// State
const isLoading = ref(false)
const isLoggedOut = ref(false)
const countdown = ref(3)

// Handle logout
const handleLogout = async () => {
  isLoading.value = true
  
  try {
    await patreonAuth.logout()
    isLoggedOut.value = true
    startCountdown()
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    isLoading.value = false
  }
}

// Handle cancel
const handleCancel = () => {
  router.back()
}

// Navigate to home
const navigateToHome = () => {
  router.push('/therapists')
}

// Start countdown and redirect
const startCountdown = () => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      navigateToHome()
    }
  }, 1000)
}

// Auto logout logic
onMounted(() => {
  if (autoLogout.value && patreonAuth.isAuthenticated.value) {
    // Auto logout without confirmation
    handleLogout()
  } else if (autoLogout.value && !patreonAuth.isAuthenticated.value) {
    // Already logged out, just redirect
    isLoggedOut.value = true
    startCountdown()
  }
})
</script>