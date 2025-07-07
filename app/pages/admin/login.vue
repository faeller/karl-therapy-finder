<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
      <!-- Admin Login Header -->
      <div class="text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-400/80 to-amber-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          🔐
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Karl Admin</h1>
        <p class="text-blue-100/80 text-sm">Waitlist Management</p>
      </div>

      <!-- Login Form -->
      <div class="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div>
              <label class="block text-white text-sm font-medium mb-2">
                Admin E-Mail
              </label>
              <input
                v-model="email"
                type="email"
                placeholder="admin@karl-helps.org"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                required
                :disabled="isLoading"
              />
            </div>
            
            <div>
              <label class="block text-white text-sm font-medium mb-2">
                Admin Passwort
              </label>
              <input
                v-model="password"
                type="password"
                placeholder="Passwort eingeben..."
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                required
                :disabled="isLoading"
              />
            </div>

            <UButton
              type="submit"
              color="primary"
              size="lg"
              class="w-full"
              :loading="isLoading"
              :disabled="!email.trim() || !password.trim() || isLoading"
            >
              {{ isLoading ? 'Wird angemeldet...' : 'Anmelden' }}
            </UButton>
          </div>
        </form>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-red-200 text-sm">{{ errorMessage }}</p>
        </div>
      </div>

    </div>
  </PageCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!email.value.trim() || !password.value.trim()) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })
    
    console.log('Login response:', response)

    if (response.success) {
      // Wait a bit to ensure session is set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify session is actually set
      const session = await $fetch('/api/auth/session')
      console.log('Session after login:', session)
      
      if (session.loggedIn) {
        // Redirect to admin dashboard
        await navigateTo('/admin/dashboard')
      } else {
        throw new Error('Session not persisted after login')
      }
    }
  } catch (error: any) {
    console.error('Login error:', error)
    errorMessage.value = error.data?.message || error.statusMessage || 'Login fehlgeschlagen'
  } finally {
    isLoading.value = false
  }
}

// Check if already authenticated and auto-redirect
onMounted(async () => {
  try {
    console.log('Login page: Checking session...')
    const session = await $fetch('/api/auth/session')
    console.log('Login page: Session check result:', session)
    
    if (session.loggedIn && session.user?.role === 'admin') {
      console.log('Login page: User is authenticated, redirecting to dashboard')
      await navigateTo('/admin/dashboard')
      return
    }
    console.log('Login page: User not authenticated, showing login form')
  } catch (error) {
    console.log('Login page: Session check failed:', error)
    // User not authenticated, continue with login form
  }
  
  // Auto-focus email field after auth check
  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
  if (emailInput) {
    emailInput.focus()
  }
})
</script>