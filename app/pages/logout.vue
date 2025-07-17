<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-md flex-col items-center gap-6 px-4 sm:px-6">
      <!-- Logout Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          👋
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Abmeldung erfolgreich
        </h1>
        <p class="text-sm text-blue-100/80">
          Du wirst zur Hauptseite weitergeleitet...
        </p>
      </div>

      <!-- Success Message -->
      <div class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-400" />
          </div>
          <h3 class="font-medium text-white mb-2">Erfolgreich abgemeldet</h3>
          <p class="text-gray-300 text-sm mb-4">
            Du wurdest sicher abgemeldet und deine Sitzung wurde beendet.
          </p>
          <NuxtLink 
            to="/therapists"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
          >
            <UIcon name="i-heroicons-home" class="w-4 h-4" />
            Zur Hauptseite
          </NuxtLink>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
        <div class="text-center space-y-3">
          <p class="text-white text-sm font-medium">Möchtest du dich erneut anmelden?</p>
          <div class="flex gap-3">
            <NuxtLink 
              to="/login"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
              Anmelden
            </NuxtLink>
            <NuxtLink 
              to="/therapists"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-home" class="w-4 h-4" />
              Hauptseite
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
// Meta configuration
definePageMeta({
  title: 'Abgemeldet'
})

// Perform logout and redirect immediately
onMounted(async () => {
  try {
    // Call logout API
    await $fetch('/api/logout', {
      method: 'POST'
    })
  } catch (error) {
    console.error('Logout API failed:', error)
  }
  
  // Redirect immediately after logout
  navigateTo('/therapists')
})
</script>