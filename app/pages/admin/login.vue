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
              :disabled="!password.trim() || isLoading"
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

      <!-- Info -->
      <div class="text-center">
        <p class="text-blue-200/60 text-xs">
          Nur für autorisierte Karl-Administratoren
        </p>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!password.value.trim()) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include', // Ensure cookies are included in requests
      body: {
        password: password.value
      }
    })

    if (response.success) {
      // Give browser time to process Set-Cookie header before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      // Redirect to admin dashboard
      await navigateTo('/admin/dashboard')
    } else {
      errorMessage.value = response.message
    }
  } catch (error: any) {
    console.error('Login error:', error)
    errorMessage.value = error.data?.message || 'Login fehlgeschlagen'
  } finally {
    isLoading.value = false
  }
}

// Auto-focus password field
onMounted(() => {
  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
  if (passwordInput) {
    passwordInput.focus()
  }
})
</script>