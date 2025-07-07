<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-blue-200">Weiterleitung zum Kontaktprotokoll...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Redirect to the main therapists page with the contact-protocol tab
await navigateTo('/therapists?tab=contact-protocol', { replace: true })
</script>