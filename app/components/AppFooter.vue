<script setup lang="ts">
import { format } from 'date-fns';
const config = useRuntimeConfig();
const currentYear = format(new Date(), 'yyyy');
</script>

<template>
  <div class="mt-4 mb-6 flex justify-center">
    <div
      class="flex items-center gap-3 text-[11px] text-white/60 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
      <span>KARL v{{ config.public.version || '0.6.1' }} - Merle Fäller, {{currentYear }}</span>
      <span class="text-white/30">•</span>
      <div class="flex items-center gap-2">
        <NuxtLink to="/impressum" class="hover:text-white/80 transition-colors">Impressum</NuxtLink>
        <template v-if="config.public.privacyPolicyEnabled !== 'false'">
          <span class="text-white/30">•</span>
          <NuxtLink to="/privacy-policy" class="hover:text-white/80 transition-colors">Datenschutz</NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>
