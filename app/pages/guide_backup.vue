<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-5xl flex-col items-center gap-6">
      <!-- Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          K
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">
          Therapieplatz-Finder Guide 🎯
        </h1>
        <p class="text-blue-100/80 text-sm">
          Der bewährte 7-Schritte-Weg zum Therapieplatz
        </p>
      </div>

      <!-- Motivational Progress -->
      <div class="w-full max-w-2xl bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-trophy" class="w-5 h-5 text-yellow-400" />
            <span class="text-white font-medium text-sm">Dein Fortschritt</span>
          </div>
          <div class="text-blue-200 font-bold text-sm">
            {{ Math.round(overallProgress) }}% geschafft
          </div>
        </div>
        
        <UProgress 
          :value="overallProgress" 
          :max="100"
          color="blue"
          size="lg"
          class="mb-3"
        />
        
        <div class="flex items-center justify-between text-xs">
          <span class="text-blue-100/70">Schritt {{ currentStep }} von {{ stepperItems.length }}</span>
          <div class="flex items-center gap-1">
            <UIcon 
              v-for="i in stepperItems.length" 
              :key="i"
              :name="i <= completedSteps ? 'i-heroicons-check-circle' : 'i-heroicons-circle'"
              :class="i <= completedSteps ? 'text-green-400' : 'text-white/30'"
              class="w-3 h-3"
            />
          </div>
        </div>

        <!-- Motivational message -->
        <div class="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p class="text-blue-200 text-xs text-center font-medium">
            {{ motivationalMessage }}
          </p>
        </div>
      </div>

      <!-- Stepper with Horizontal Scrolling -->
      <div class="w-full max-w-7xl">
        <div class="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-blue-500/50">
          <div class="min-w-max px-4">
            <UStepper 
              v-model="currentStep" 
              :items="visibleStepperItems" 
              class="w-full min-w-[1400px]"
              color="blue"
              orientation="vertical"
              size="sm"
            >
              <!-- Step 1: Terminservicestelle Erstgespräch -->
              <template #erstgespraech>
                <div class="space-y-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-phone" class="w-5 h-5 text-blue-300" />
                    <h3 class="text-base font-semibold text-white">Terminservicestelle: Erstgespräch</h3>
                  </div>
                  
                  <div class="space-y-3 text-sm">
                    <p class="text-blue-100/90">
                      Bei der Terminservicestelle erhältst Du ohne großen Aufwand direkt einen Termin für ein psychotherapeutisches Erstgespräch.
                    </p>
                    
                    <div class="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                      <p class="text-blue-200 font-medium">📞 Terminservicestelle: 116 117</p>
                      <p class="text-blue-100/80 text-xs mt-1">Oder online: eterminservice.de</p>
                    </div>

                    <div class="space-y-2">
                      <h4 class="text-blue-200 font-medium">⚠️ Wichtig zum Erstgespräch:</h4>
                      <ul class="text-blue-100/80 text-xs space-y-1 ml-4">
                        <li>• Behandlungsbedarf muss festgestellt werden</li>
                        <li>• "Therapie zeitnah erforderlich" muss angekreuzt sein</li>
                        <li>• Nur dann ist später Kostenerstattung möglich</li>
                      </ul>
                    </div>
                  </div>

                  <div class="flex gap-2 pt-1">
                    <UButton 
                      @click="completeStep(1)" 
                      :color="stepProgress[1] ? 'green' : 'blue'" 
                      size="xs"
                      class="ml-auto"
                    >
                      {{ stepProgress[1] ? 'Abgeschlossen ✓' : 'Abschließen' }}
                    </UButton>
                  </div>
                </div>
              </template>

              <!-- Other steps continue here... -->
              <!-- For brevity, I'll add just a couple more -->
              
              <template #probatorik>
                <div class="space-y-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-300" />
                    <h3 class="text-base font-semibold text-white">Terminservicestelle: Probatorik</h3>
                  </div>
                  
                  <div class="space-y-3 text-sm">
                    <p class="text-blue-100/90">
                      Nach dem Erstgespräch erhältst Du über die Terminservicestelle eine probatorische Sitzung.
                    </p>
                    
                    <div class="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <h4 class="text-amber-200 font-medium">📋 Dringlichkeitscode benötigt</h4>
                      <p class="text-amber-100/80 text-xs mt-1">
                        Den Code findest Du auf der "Individuellen Patienteninformation" aus dem Erstgespräch
                      </p>
                    </div>

                    <div class="space-y-2">
                      <h4 class="text-blue-200 font-medium">⚠️ Wichtig zur Probatorik:</h4>
                      <p class="text-blue-100/80 text-xs">
                        Den Dringlichkeitscode erhältst Du nur, wenn "zeitnah erforderlich" angekreuzt wurde.
                      </p>
                    </div>
                  </div>

                  <div class="flex gap-2 pt-1">
                    <UButton 
                      @click="prevStep" 
                      variant="ghost" 
                      color="gray" 
                      size="xs"
                    >
                      ← Zurück
                    </UButton>
                    <UButton 
                      @click="completeStep(2)" 
                      :color="stepProgress[2] ? 'green' : 'blue'" 
                      size="xs"
                      class="ml-auto"
                    >
                      {{ stepProgress[2] ? 'Abgeschlossen ✓' : 'Abschließen' }}
                    </UButton>
                  </div>
                </div>
              </template>
            </UStepper>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3">
        <button @click="resetGuide" class="group relative overflow-hidden rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 px-4 py-2 text-red-200 text-sm font-medium transition-all duration-300 hover:bg-red-500/30 hover:scale-105 active:scale-95">
          <div class="relative z-10 flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            Guide zurücksetzen
          </div>
        </button>
        
        <button @click="$router.push('/app')" class="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-white text-sm font-medium transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95">
          <div class="relative z-10 flex items-center gap-2">
            <span class="group-hover:-translate-x-1 transition-transform duration-300">←</span>
            Zurück zur App
          </div>
          <div class="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
      </div>
    </div>
  </PageCard>
</template>