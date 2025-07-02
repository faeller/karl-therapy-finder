<script setup lang="ts">
import { format } from 'date-fns';
const config = useRuntimeConfig();
const currentYear = format(new Date(), 'yyyy');
</script>

<template>
  <div class="mt-6 flex flex-col items-center justify-center gap-1 text-xs text-blue-200/60 text-center px-4">
    <span class="text-[10px] text-blue-200/50">KARL v0.2</span>
    <span class="italic">Dein KI-Buddy für die Therapieplatz-Jagd</span>
    <div class="text-[10px] text-blue-200/40">
      Based on <a href="https://github.com/zackha/habit" target="_blank" class="hover:text-blue-200/60 transition-colors">Habit by Sefa Bulak</a>
    </div>
  </div>
</template>
