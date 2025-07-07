<script setup lang="ts">
// Simple redirect with a temporary query parameter
await navigateTo('/therapists?_tab=contact-protocol', { replace: true })
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-blue-200">Lade Kontaktprotokoll...</p>
    </div>
  </div>
</template>