<script setup lang="ts">
// Navigate to onboarding flow
const navigateToApp = () => {
  navigateTo('/onboarding');
};
</script>

<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-md lg:max-w-4xl xl:max-w-6xl flex-col items-center gap-6 lg:gap-8 text-center">
      <!-- KARL Logo/Icon -->
      <div class="relative">
        <div class="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-xl font-bold text-white shadow-2xl backdrop-blur-sm">
          K
        </div>
        <!-- AI Badge -->
        <div class="absolute -bottom-2 -right-2 bg-black text-white text-sm font-bold px-2 py-1 rounded-full shadow-lg">
          AI
        </div>
      </div>
      
      <!-- App Title Section -->
      <div class="space-y-2 lg:space-y-3">
        <div class="flex items-center justify-center gap-3">
          <h1 class="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white">KARL</h1>
          <span class="bg-green-500/20 border border-green-500/30 text-green-200 text-sm lg:text-base font-bold px-3 py-1 rounded-full">
            ALPHA
          </span>
        </div>
        <p class="text-lg lg:text-xl xl:text-2xl text-blue-100/90 font-medium">Kontakt Automatisierung Richtung Leben</p>
        <p class="text-sm lg:text-base text-blue-200/70 italic max-w-xs lg:max-w-md mx-auto leading-relaxed">
          (Ja, der Name ist genau so sperrig wie das deutsche Gesundheitssystem 🤷‍♂️)
        </p>
        
        <!-- Divider after German text -->
        <div class="flex items-center justify-center mt-6 lg:mt-8 w-full px-4">
          <div class="flex-1 h-px bg-linear-to-r from-transparent via-blue-300/40 to-blue-300/40"></div>
          <div class="mx-6 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-blue-300/50 shadow-sm"></div>
          </div>
          <div class="flex-1 h-px bg-linear-to-l from-transparent via-blue-300/40 to-blue-300/40"></div>
        </div>
      </div>
      
      <!-- Hero Text -->
      <div class="space-y-3 lg:space-y-4">
        <h2 class="text-2xl lg:text-3xl xl:text-4xl font-semibold text-white leading-tight">
          Dein Buddy für die
        </h2>
        <div class="text-3xl lg:text-4xl xl:text-5xl font-bold bg-linear-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
          Therapieplatz-Jagd
        </div>
        <p class="text-lg lg:text-xl xl:text-2xl text-blue-100/80">in Deutschland</p>
      </div>
      
      <!-- Statistics Cards -->
      <div class="grid gap-3 lg:gap-4 w-full max-w-sm lg:max-w-4xl text-sm lg:text-base lg:grid-cols-3">
        <div class="flex items-center gap-3 lg:gap-4 rounded-2xl bg-white/10 backdrop-blur-sm p-4 lg:p-6 border border-white/20">
          <div class="text-2xl lg:text-3xl">📊</div>
          <div class="text-blue-100/90 font-medium">5-6 Monate durchschnittliche Wartezeit</div>
        </div>
        <div class="flex items-center gap-3 lg:gap-4 rounded-2xl bg-white/10 backdrop-blur-sm p-4 lg:p-6 border border-white/20">
          <div class="text-2xl lg:text-3xl">🏥</div>
          <div class="text-blue-100/90 font-medium">Nur 15.000 von 37.000 Therapeuten haben Kassensitz</div>
        </div>
        <div class="flex items-center gap-3 lg:gap-4 rounded-2xl bg-white/10 backdrop-blur-sm p-4 lg:p-6 border border-white/20">
          <div class="text-2xl lg:text-3xl">📞</div>
          <div class="text-blue-100/90 font-medium">30+ Anrufe werden oft benötigt</div>
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
      <div class="w-full max-w-sm lg:max-w-4xl space-y-4 lg:space-y-6">
        <h3 class="text-lg lg:text-xl xl:text-2xl font-semibold text-blue-200 text-center">KARL hilft dir beim:</h3>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
          <div class="flex flex-col items-center text-center space-y-2 lg:space-y-3 p-3 lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl lg:text-3xl">🔍</div>
            <span class="text-xs lg:text-sm text-blue-100/90">Therapeuten finden</span>
          </div>
          <div class="flex flex-col items-center text-center space-y-2 lg:space-y-3 p-3 lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl lg:text-3xl">📈</div>
            <span class="text-xs lg:text-sm text-blue-100/90">Fortschritt verfolgen</span>
          </div>
          <div class="flex flex-col items-center text-center space-y-2 lg:space-y-3 p-3 lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl lg:text-3xl">✉️</div>
            <span class="text-xs lg:text-sm text-blue-100/90">E-Mails formulieren</span>
          </div>
          <div class="flex flex-col items-center text-center space-y-2 lg:space-y-3 p-3 lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="text-2xl lg:text-3xl">🗺️</div>
            <span class="text-xs lg:text-sm text-blue-100/90">Durch Prozess leiten</span>
          </div>
          <div class="flex flex-col items-center text-center space-y-2 lg:space-y-3 p-3 lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 col-span-2 lg:col-span-1 justify-self-center">
            <div class="text-2xl lg:text-3xl">📋</div>
            <span class="text-xs lg:text-sm text-blue-100/90">Papierkram vereinfachen</span>
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
        
        <!-- Notice Cards -->
        <div class="grid gap-4 lg:gap-6 lg:grid-cols-2 w-full">
          <!-- Free Service Notice -->
          <div class="p-4 lg:p-6 rounded-xl bg-linear-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30">
            <div class="text-center space-y-1 lg:space-y-2">
              <div class="text-sm lg:text-base font-semibold text-green-200">💝 Komplett kostenlos</div>
              <div class="text-xs lg:text-sm text-green-100/80 leading-relaxed">
                KARL ist fürs erste völlig gratis. Wir freuen uns über Spenden, sobald wir sie eingerichtet haben.
              </div>
            </div>
          </div>

          <!-- Development Notice -->
          <div class="py-4 lg:py-6 px-5 lg:px-6 rounded-xl bg-linear-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
            <div class="text-sm lg:text-base text-blue-200/90 text-center leading-relaxed">
              <span class="font-semibold">🚧 In Entwicklung:</span><br/>
              📞 Automatische Anrufe bei Therapeuten & 116117 sowie ✉️ E-Mail-Versand
            </div>
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
        <div class="py-6 lg:py-8 px-5 lg:px-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20">
          <div class="text-center space-y-3 lg:space-y-4">
            <div class="flex items-center justify-center gap-2 lg:gap-3 mb-4">
              <span class="text-xl lg:text-2xl">🔒</span>
              <h4 class="font-semibold lg:text-lg text-blue-200">Datenschutz first</h4>
            </div>
            <div class="text-xs lg:text-sm text-blue-100/80 leading-relaxed space-y-2 lg:space-y-3 max-w-2xl mx-auto">
              <p><strong>Deine Daten bleiben fürs erste lokal in deinem Browser.</strong> Sobald sich das ändert, musst du erst zustimmen.</p>
              <p><strong>Transparenz - </strong> Wenn KARL für dich E-Mails sendet oder anruft, zeigen wir dir genau, welche Daten geteilt werden.</p>
              <p class="italic text-blue-200/70">Wir nehmen Datenschutz ernst – auch wenn viele KI-Anbieter das leider nicht tun.</p>
              <div class="mt-4 pt-3 border-t border-white/10">
                <NuxtLink 
                  to="/privacy" 
                  class="inline-flex items-center gap-2 text-blue-200 hover:text-blue-100 transition-colors text-sm font-medium"
                >
                  <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                  Privacy Policy / Datenschutzerklärung
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA Buttons -->
    <div class="flex flex-col sm:flex-row gap-6 lg:gap-8 items-center mt-8 lg:mt-12">
      <button @click="navigateToApp" class="group relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-500 to-blue-600 px-8 lg:px-12 py-4 lg:py-5 text-lg lg:text-xl font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 active:scale-95">
        <div class="relative z-10 flex items-center gap-2 lg:gap-3">
          Los geht's, KARL! 
          <span class="text-xl lg:text-2xl group-hover:scale-110 transition-transform duration-300">🚀</span>
        </div>
        <div class="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </button>
      
      <NuxtLink 
        to="https://github.com/faeller/karl-therapy-finder" 
        target="_blank"
        class="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-6 lg:px-8 py-3 lg:py-4 text-sm lg:text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95"
      >
        <div class="relative z-10 flex items-center gap-2 lg:gap-3">
          <UIcon name="i-simple-icons-github" class="w-4 h-4 lg:w-5 lg:h-5" />
          GitHub
        </div>
        <div class="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </NuxtLink>
    </div>
  </PageCard>
</template>
