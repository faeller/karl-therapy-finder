<template>
  <PageCard>
    <div class="relative z-10 flex w-full flex-col items-center gap-6 text-center">
      <!-- KARL Logo -->
      <div class="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400 to-blue-600 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
        K
      </div>
      
      <!-- Welcome Message -->
      <div class="space-y-3">
        <h1 class="text-2xl font-bold text-white tracking-tight">Willkommen bei KARL! 👋</h1>
        <p class="text-sm text-blue-100/80">
          Hier wird bald deine Therapieplatz-Suche starten.
        </p>
      </div>
      
      <!-- Coming Soon Features -->
      <div class="w-full space-y-4">
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <h3 class="font-bold text-blue-300 mb-3 text-base flex items-center gap-2">
            <span class="text-lg">🚀</span> 
            Coming Soon
          </h3>
          <div class="grid gap-2 text-xs">
            <div class="flex items-center gap-2 text-blue-100/90">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>Persönliche Daten erfassen</span>
            </div>
            <div class="flex items-center gap-2 text-blue-100/90">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>Therapieplatz-Suche starten</span>
            </div>
            <div class="flex items-center gap-2 text-blue-100/90">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>Kontaktprotokoll führen</span>
            </div>
            <div class="flex items-center gap-2 text-blue-100/90">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>Kostenerstattungsantrag</span>
            </div>
            <div class="flex items-center gap-2 text-blue-100/90">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>8-Schritte Therapie-Prozess</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Back Button -->
      <button @click="$router.push('/')" class="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-white text-sm font-medium transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95">
        <div class="relative z-10 flex items-center gap-2">
          <span class="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          Zurück zum Start
        </div>
        <div class="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </button>
    </div>
  </PageCard>
</template>