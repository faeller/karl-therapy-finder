<script setup lang="ts">
// Navigate to onboarding flow
const navigateToApp = () => {
  navigateTo('/onboarding');
};
</script>

<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-md lg:max-w-2xl xl:max-w-3xl flex-col items-center gap-6 text-center">
      <!-- KARL Logo/Icon -->
      <div class="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-3xl font-bold text-white shadow-2xl backdrop-blur-sm">
        K
      </div>
      
      <!-- App Title Section -->
      <div class="space-y-2">
        <h1 class="text-4xl font-bold tracking-tight text-white">KARL</h1>
        <p class="text-lg text-blue-100/90 font-medium">Kontakt Automatisierung Richtung Leben</p>
        <p class="text-sm text-blue-200/70 italic max-w-xs mx-auto leading-relaxed">
          (Ja, der Name ist genau so sperrig wie das deutsche Gesundheitssystem 🤷‍♂️)
        </p>
      </div>
      
      <!-- Hero Text -->
      <div class="space-y-3">
        <h2 class="text-2xl font-semibold text-white leading-tight">
          Dein Buddy für die
        </h2>
        <div class="text-3xl font-bold bg-linear-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
          Therapieplatz-Jagd
        </div>
        <p class="text-lg text-blue-100/80">in Deutschland</p>
      </div>
      
      <!-- Statistics Cards -->
      <div class="grid gap-3 w-full max-w-sm text-sm">
        <div class="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="text-2xl">📊</div>
          <div class="text-blue-100/90 font-medium">5-6 Monate durchschnittliche Wartezeit</div>
        </div>
        <div class="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="text-2xl">🏥</div>
          <div class="text-blue-100/90 font-medium">Nur 15.000 von 37.000 Therapeuten haben Kassensitz</div>
        </div>
        <div class="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="text-2xl">📞</div>
          <div class="text-blue-100/90 font-medium">100+ Anrufe werden oft benötigt</div>
        </div>
      </div>
      
      <!-- First Divider -->
      <div class="flex items-center justify-center my-6 w-full px-4">
        <div class="flex-1 h-px bg-linear-to-r from-transparent via-blue-300/40 to-blue-300/40"></div>
        <div class="mx-6 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-blue-300/50 shadow-sm"></div>
        </div>
        <div class="flex-1 h-px bg-linear-to-l from-transparent via-blue-300/40 to-blue-300/40"></div>
      </div>
        
      <!-- What KARL Helps With -->
      <div class="w-full max-w-sm space-y-4">
        <h3 class="text-lg font-semibold text-blue-200 text-center">KARL hilft dir beim:</h3>
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="flex flex-col items-center text-center space-y-2 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl">🔍</div>
            <span class="text-xs text-blue-100/90">Therapeuten finden</span>
          </div>
          <div class="flex flex-col items-center text-center space-y-2 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl">📈</div>
            <span class="text-xs text-blue-100/90">Fortschritt verfolgen</span>
          </div>
          <div class="flex flex-col items-center text-center space-y-2 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl">✉️</div>
            <span class="text-xs text-blue-100/90">E-Mails formulieren</span>
          </div>
          <div class="flex flex-col items-center text-center space-y-2 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl">🗺️</div>
            <span class="text-xs text-blue-100/90">Durch Prozess leiten</span>
          </div>
        </div>
        <div class="flex justify-center mb-6">
          <div class="flex flex-col items-center text-center space-y-2 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl">📋</div>
            <span class="text-xs text-blue-100/90">Papierkram vereinfachen</span>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="flex items-center justify-center my-6 w-full px-4">
          <div class="flex-1 h-px bg-linear-to-r from-transparent via-blue-300/40 to-blue-300/40"></div>
          <div class="mx-6 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-blue-300/50 shadow-sm"></div>
          </div>
          <div class="flex-1 h-px bg-linear-to-l from-transparent via-blue-300/40 to-blue-300/40"></div>
        </div>
        
        <!-- Free Service Notice -->
        <div class="p-4 rounded-xl bg-linear-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 mb-8">
          <div class="text-center space-y-1">
            <div class="text-sm font-semibold text-green-200">💝 Komplett kostenlos</div>
            <div class="text-xs text-green-100/80 leading-relaxed">
              KARL ist fürs erste völlig gratis. Wir freuen uns über Spenden, sobald wir sie eingerichtet haben.
            </div>
          </div>
        </div>

        <div class="py-6 px-5 rounded-xl bg-linear-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
          <div class="text-sm text-blue-200/90 text-center leading-relaxed">
            <span class="font-semibold">In Entwicklung:</span><br/>
            Automatische Anrufe bei Therapeuten & 116117 sowie E-Mail-Versand
          </div>
        </div>
        
        <!-- Second Divider -->
        <div class="flex items-center justify-center my-8 w-full px-4">
          <div class="flex-1 h-px bg-linear-to-r from-transparent via-blue-300/40 to-blue-300/40"></div>
          <div class="mx-6 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-blue-300/50 shadow-sm"></div>
          </div>
          <div class="flex-1 h-px bg-linear-to-l from-transparent via-blue-300/40 to-blue-300/40"></div>
        </div>
        
        <!-- Privacy Section -->
        <div class="py-6 px-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20">
          <div class="text-center space-y-3">
            <div class="flex items-center justify-center gap-2 mb-4">
              <span class="text-xl">🔒</span>
              <h4 class="font-semibold text-blue-200">Datenschutz first</h4>
            </div>
            <div class="text-xs text-blue-100/80 leading-relaxed space-y-2">
              <p><strong>Deine Daten bleiben fürs erste lokal in deinem Browser.</strong> Sobald sich das ändert, musst du erst zustimmen.</p>
              <p><strong>Transparenz - </strong> Wenn KARL für dich E-Mails sendet oder anruft, zeigen wir dir genau, welche Daten geteilt werden.</p>
              <p class="italic text-blue-200/70">Wir nehmen Datenschutz ernst – auch wenn viele KI-Anbieter das leider nicht tun.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA Button -->
    <button @click="navigateToApp" class="group relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-500 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 active:scale-95">
      <div class="relative z-10 flex items-center gap-2">
        Los geht's, KARL! 
        <span class="text-xl group-hover:scale-110 transition-transform duration-300">🚀</span>
      </div>
      <div class="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
    </button>
  </PageCard>
</template>
