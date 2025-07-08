<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8">
      <!-- Header -->
      <div class="w-full text-center space-y-3">
        <div class="relative mx-auto w-16">
          <div class="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
            K
          </div>
          <!-- AI Badge -->
          <div class="absolute -bottom-1 -right-1 bg-black text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            AI
          </div>
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">
          <template v-if="isLoadingProfile">
            <div class="flex items-center gap-2 justify-center">
              <div class="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
              Lade Profil...
            </div>
          </template>
          <template v-else-if="onboardingStore?.formData?.nickname">
            Hey {{ onboardingStore.formData.nickname }}! 👋
          </template>
          <template v-else>
            Hey! 👋
          </template>
        </h1>
        <p class="text-blue-100/80 text-sm">
          <template v-if="isLoadingProfile">
            Lade deine gespeicherten Daten...
          </template>
          <template v-else-if="onboardingStore?.formData?.location && /^\d{5}$/.test(onboardingStore.formData.location)">
            Schön, dass du den Weg zum Therapieplatz angehst
          </template>
          <template v-else>
            Bitte vervollständige dein Profil
          </template>
        </p>
      </div>

      <!-- Show main content only with valid PLZ -->
      <template v-if="!isLoadingProfile && onboardingStore?.formData?.location && /^\d{5}$/.test(onboardingStore.formData.location)">
        <!-- Divider -->
        <div class="w-full max-w-md">
          <div class="h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
        </div>

        <!-- Motivational Progress -->
      <ClientOnly>
        <div class="w-full max-w-2xl bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-trophy" class="w-5 h-5 text-yellow-400" />
              <span class="text-white font-medium text-sm">Dein Fortschritt</span>
            </div>
            <div class="text-blue-200 font-bold text-sm">
              {{ Math.round(overallProgress) }}% geschafft
            </div>
          </div>
          
          <!-- Custom animated progress bar -->
          <div class="mb-3 relative">
            <div class="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: overallProgress + '%' }"
              />
            </div>
            <div 
              class="absolute top-0 left-0 h-full w-6 bg-gradient-to-r from-white/20 to-transparent rounded-full transition-all duration-1000 ease-out animate-pulse"
              :style="{ left: Math.max(0, overallProgress - 6) + '%' }"
              v-if="overallProgress > 0"
            />
          </div>
          
          <div class="flex items-center justify-between text-xs">
            <span class="text-blue-100/70">Schritt {{ currentStep }} von {{ stepperItems.length }}</span>
            <div class="flex items-center gap-1">
              <div
                v-for="i in stepperItems.length" 
                :key="i"
                :class="[
                  'w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                  i <= completedSteps 
                    ? 'bg-green-400 border-green-400 scale-110' 
                    : 'border-white/30'
                ]"
              >
                <UIcon 
                  v-if="i <= completedSteps"
                  name="i-heroicons-check"
                  class="w-2 h-2 text-white"
                />
              </div>
            </div>
          </div>

          <!-- Motivational message -->
          <div class="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p class="text-blue-200 text-xs text-center font-medium">
              {{ motivationalMessage }}
            </p>
          </div>
        </div>
        <template #fallback>
          <div class="w-full max-w-2xl bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-trophy" class="w-5 h-5 text-yellow-400" />
                <span class="text-white font-medium text-sm">Dein Fortschritt</span>
              </div>
              <div class="text-blue-200 font-bold text-sm">
                0% geschafft
              </div>
            </div>
            
            <!-- Custom animated progress bar -->
            <div class="mb-3 relative">
              <div class="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out w-0" />
              </div>
            </div>
            
            <div class="flex items-center justify-between text-xs">
              <span class="text-blue-100/70">Schritt 1 von 7</span>
              <div class="flex items-center gap-1">
                <div
                  v-for="i in 7" 
                  :key="i"
                  class="w-3 h-3 rounded-full border-2 border-white/30"
                />
              </div>
            </div>

            <!-- Motivational message -->
            <div class="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p class="text-blue-200 text-xs text-center font-medium">
                🚀 Du startest Deine Reise zum Therapieplatz!
              </p>
            </div>
          </div>
        </template>
      </ClientOnly>

      <!-- Divider -->
      <div class="w-full max-w-lg">
        <div class="h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
      </div>

      <!-- Horizontal Stepper with Scrolling -->
      <div class="w-full max-w-7xl space-y-6">
        <!-- Stepper Title -->
        <div class="text-center space-y-2">
          <h2 class="text-xl font-semibold text-white">Deine nächsten Schritte</h2>
          <p class="text-blue-100/80 text-sm">
            Du hast schon <span class="font-medium text-blue-200">{{ completedSteps }} von {{ stepperItems.length }}</span> Schritten geschafft!
          </p>
          <p class="text-blue-100/60 text-xs">
            Grobe Schätzung: noch <span class="font-medium">{{ Math.max(2, 8 - completedSteps) }}-12 Wochen</span> bis zum Therapieplatz 
            (kann aber auch deutlich länger dauern)
          </p>
        </div>
        <ClientOnly>
          <div ref="stepperContainer" class="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-blue-500/50 hover:scrollbar-thumb-blue-400/70 scroll-smooth mb-6">
            <div class="min-w-max px-4">
              <UStepper 
                ref="stepperRef"
                :default-value="currentStepIndex"
                :model-value="currentStepIndex"
                @update:model-value="(value) => currentStepIndex = value"
                :items="visibleStepperItems" 
                class="w-full min-w-[1200px] xl:min-w-[1400px] 2xl:min-w-[1600px]"
                color="primary"
                orientation="horizontal"
                size="md"
                :disabled="false"
              />
            </div>
          </div>
          <template #fallback>
            <div class="h-24 flex items-center justify-center text-blue-200">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mr-2" />
              Lade Stepper...
            </div>
          </template>
        </ClientOnly>
        
        <!-- Step Content (Fixed, No Scrolling) -->
        <ClientOnly>
          <div class="w-full mt-6">
            <!-- Step 1: Terminservicestelle Erstgespräch -->
            <div v-if="currentStep === 1" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div class="flex items-center gap-3 mb-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <UIcon name="i-heroicons-phone" class="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-white">Schritt 1: Erstgespräch vereinbaren</h3>
                  <p class="text-blue-200/80 text-sm">Der einfachste Weg zu einem ersten Beratungstermin</p>
                </div>
              </div>
              
              <div class="space-y-4 text-sm lg:text-base">
                <p class="text-blue-100/90 leading-relaxed">
                  Kontaktiere die <strong>Terminservicestelle</strong> über Telefon oder online, um ein psychotherapeutisches Erstgespräch zu vereinbaren. Dieses Gespräch dient der ersten Einschätzung deiner Situation.
                </p>

                <!-- PLZ Display and Edit -->
                <div class="bg-white/5 p-4 lg:p-5 rounded-lg border border-white/10">
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div class="flex items-center gap-3">
                      <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-blue-300" />
                      <span class="text-blue-200 text-sm">Verfügbarkeit geprüft für PLZ:</span>
                      <template v-if="!isEditingPlz">
                        <span class="font-mono font-semibold text-blue-100 ml-2">{{ currentPlz || '-----' }}</span>
                      </template>
                      <template v-else>
                        <input 
                          v-model="tempPlz"
                          type="text" 
                          maxlength="5"
                          pattern="[0-9]{5}"
                          placeholder="12345"
                          class="w-20 px-2 py-1 text-sm font-mono bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                          @keyup.enter="saveNewPlz"
                          @keyup.escape="cancelEditingPlz"
                        />
                      </template>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <template v-if="!isEditingPlz">
                        <button 
                          @click="startEditingPlz"
                          class="text-xs text-blue-300 hover:text-blue-200 transition-colors whitespace-nowrap"
                        >
                          ändern
                        </button>
                        <span class="text-blue-300/50 text-xs hidden sm:inline">(e.g. Berlin: 10115)</span>
                      </template>
                      <template v-else>
                        <button 
                          @click="saveNewPlz"
                          :disabled="!/^\d{5}$/.test(tempPlz)"
                          class="text-xs text-green-300 hover:text-green-200 transition-colors disabled:opacity-50"
                        >
                          ✓
                        </button>
                        <button 
                          @click="cancelEditingPlz"
                          class="text-xs text-red-300 hover:text-red-200 transition-colors ml-1"
                        >
                          ✕
                        </button>
                      </template>
                    </div>
                  </div>
                </div>
                
                <!-- Contact Options -->
                <div class="grid gap-3 lg:gap-4 lg:grid-cols-2 items-stretch">
                  <!-- Phone Option -->
                  <div class="bg-blue-500/10 p-4 lg:p-5 rounded-xl border border-blue-500/20 group hover:border-blue-400/30 transition-all duration-300 flex flex-col">
                    <div class="flex items-center gap-2 mb-3">
                      <UIcon name="i-heroicons-phone" class="w-5 h-5 text-blue-300" />
                      <p class="text-blue-200 font-semibold">Telefonisch anrufen</p>
                    </div>
                    <a 
                      href="tel:116117"
                      class="text-2xl lg:text-3xl font-bold text-blue-300 hover:text-blue-200 transition-colors block mb-2"
                    >
                      116 117
                    </a>
                    <p class="text-blue-100/80 text-xs mb-4">Kostenlos aus allen Netzen • 24/7 erreichbar</p>
                    
                    <!-- Info about what happens during the call -->
                    <div class="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex-grow">
                      <p class="text-xs text-blue-200/80">
                        💡 <strong>Was passiert beim Anruf:</strong> Du wirst nach deiner PLZ, deinem Anliegen und deiner Versicherung gefragt. Der Service vermittelt dir direkt einen Termin für ein Erstgespräch.
                      </p>
                    </div>
                    
                    <a 
                      href="tel:116117"
                      class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-fit min-w-[140px]"
                    >
                      <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                      Jetzt anrufen
                    </a>
                  </div>

                  <!-- Online Option -->
                  <div :class="[
                    'p-4 lg:p-5 rounded-xl border group transition-all duration-300 flex flex-col',
                    onlineServiceData?.available 
                      ? 'bg-green-500/10 border-green-500/20 hover:border-green-400/30' 
                      : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-400/30'
                  ]">
                    <div class="flex items-center gap-2 mb-3">
                      <UIcon name="i-heroicons-computer-desktop" :class="[
                        'w-5 h-5',
                        onlineServiceData?.available ? 'text-green-300' : 'text-amber-300'
                      ]" />
                      <p :class="[
                        'font-semibold',
                        onlineServiceData?.available ? 'text-green-200' : 'text-amber-200'
                      ]">Online Terminbuchung</p>
                      <!-- Status indicator -->
                      <div v-if="!isCheckingService && onlineServiceData" class="ml-auto">
                        <UIcon 
                          v-if="onlineServiceData.available" 
                          name="i-heroicons-check-circle" 
                          class="w-4 h-4 text-green-400" 
                        />
                        <UIcon 
                          v-else 
                          name="i-heroicons-exclamation-triangle" 
                          class="w-4 h-4 text-amber-400" 
                        />
                      </div>
                      <div v-else-if="isCheckingService" class="ml-auto">
                        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-blue-300 animate-spin" />
                      </div>
                    </div>
                    
                    <a 
                      href="https://www.eterminservice.de"
                      target="_blank"
                      rel="noopener noreferrer"
                      :class="[
                        'text-lg font-semibold mb-3 flex items-center gap-1 hover:opacity-80 transition-opacity',
                        onlineServiceData?.available ? 'text-green-300' : 'text-amber-300'
                      ]"
                    >
                      eterminservice.de
                      <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                    </a>
                    
                    <!-- Dynamic status message -->
                    <div :class="[
                      'text-xs mb-4 space-y-1',
                      onlineServiceData?.available ? 'text-green-100/80' : 'text-amber-100/80'
                    ]">
                      <p>
                        <template v-if="isCheckingService">
                          Verfügbarkeit wird geprüft für PLZ {{ currentPlz }}...
                        </template>
                        <template v-else-if="onlineServiceData?.message">
                          {{ onlineServiceData.message }}
                        </template>
                        <template v-else>
                          Je nach Region verfügbar • Direkte Terminbuchung
                        </template>
                      </p>
                      <p v-if="onlineServiceData && !isCheckingService" :class="[
                        'text-xs',
                        onlineServiceData.available ? 'text-green-200/60' : 'text-amber-200/60'
                      ]">
                        Region: {{ onlineServiceData.region || 'Unbekannt' }} (PLZ {{ onlineServiceData.plz }})
                        <template v-if="onlineServiceData.radius">
                          • Radius: {{ onlineServiceData.radius }}km
                        </template>
                      </p>
                    </div>
                    
                    <!-- Note about manual booking -->
                    <div v-if="onlineServiceData?.available" class="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex-grow">
                      <p class="text-xs text-green-200/80">
                        💡 <strong>Hinweis:</strong> Klicke auf "Online buchen" unten, um direkt zur eterminservice.de Website zu gelangen und dort manuell einen Termin zu buchen.
                      </p>
                    </div>
                    
                    <!-- Spacer for alignment when no note is shown -->
                    <div v-else class="flex-grow"></div>
                    
                    <a 
                      href="https://www.eterminservice.de"
                      target="_blank"
                      rel="noopener noreferrer"
                      :class="[
                        'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-fit min-w-[170px]',
                        onlineServiceData?.available 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      ]"
                    >
                      <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
                      {{ onlineServiceData?.available ? 'Online buchen' : 'Trotzdem versuchen' }}
                    </a>
                  </div>
                </div>

                <!-- Important Info Box -->
                <div class="bg-amber-500/10 p-4 lg:p-5 rounded-xl border border-amber-500/20">
                  <div class="flex items-start gap-3">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                    <div class="space-y-2">
                      <h4 class="text-amber-200 font-semibold">Nach dem Erstgespräch beachten:</h4>
                      <ul class="text-amber-100/90 text-sm space-y-1.5">
                        <li class="flex items-start gap-2">
                          <span class="text-amber-300 mt-1">•</span>
                          <span>Du bekommst ein Formular (<strong>"Individuelle Patienteninformation"</strong>) mit wichtigen Informationen</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-amber-300 mt-1">•</span>
                          <span>Prüfe, ob ein <strong>Dringlichkeitscode</strong> darauf vermerkt ist - dieser ist wichtig für weitere Schritte</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-amber-300 mt-1">•</span>
                          <span>Falls der Code fehlt, bitte den Therapeuten darum</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-amber-300 mt-1">•</span>
                          <span>Für ein Kostenerstattungsverfahren muss <strong>"Therapie dringend zeitnah erforderlich"</strong> angekreuzt sein</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- What happens in the Erstgespräch -->
                <div class="bg-white/5 p-4 lg:p-5 rounded-xl border border-white/10">
                  <h4 class="text-blue-200 font-semibold mb-3 flex items-center gap-2">
                    <UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4" />
                    Was passiert im Erstgespräch?
                  </h4>
                  <ul class="text-blue-100/80 text-sm space-y-2">
                    <li class="flex items-start gap-2">
                      <span class="text-blue-300 mt-1">•</span>
                      <span>Ausführliches Gespräch über deine Situation (ca. 50 Minuten)</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-300 mt-1">•</span>
                      <span>Einschätzung, ob eine Psychotherapie sinnvoll ist</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-300 mt-1">•</span>
                      <span>Du erhältst eine "Individuelle Patienteninformation" mit Dringlichkeitscode</span>
                    </li>
                  </ul>
                </div>
              </div>
                              
              <!-- Quick Action Note -->
              <div class="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-forward" class="w-4 h-4 text-green-300" />
                  <p class="text-green-200 text-sm font-medium">Du kannst bereits zum nächsten Schritt, sobald du einen Termin vereinbart hast</p>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
                <UButton 
                  @click="completeStep(1)" 
                  :color="stepProgress[1] ? 'green' : 'blue'" 
                  size="md"
                  variant="outline"
                  :icon="stepProgress[1] ? 'i-heroicons-check-circle' : 'i-heroicons-clock'"
                >
                  {{ stepProgress[1] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
                </UButton>
                
                <UButton 
                  @click="nextStep" 
                  color="primary"
                  size="md"
                  trailing-icon="i-heroicons-chevron-right"
                >
                  Weiter zu Schritt 2
                </UButton>
              </div>
            </div>
          </div>

          <!-- Step 2: Kontaktprotokoll -->
          <div v-if="currentStep === 2" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">Schritt 2: Kontaktprotokoll erstellen</h3>
                <p class="text-blue-200/80 text-sm">Dokumentiere alle Kontaktversuche – KARL hilft dir dabei!</p>
              </div>
            </div>
            
            <div class="space-y-4 text-sm lg:text-base">
              <!-- Progress Tracking - Moved to top and improved -->
              <div :class="[
                'p-3 lg:p-4 rounded-lg border transition-all duration-300',
                hasUberweisungscode && hasDringendErforderlich 
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20' 
                  : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20'
              ]">
                <h4 :class="[
                  'font-semibold mb-3 flex items-center gap-2',
                  hasUberweisungscode && hasDringendErforderlich ? 'text-green-200' : 'text-blue-200'
                ]">
                  <UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4" />
                  Erstgespräch Fortschritt
                </h4>
                <div class="space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-start gap-3">
                      <UIcon 
                        :name="hasUberweisungscode ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-circle'"
                        :class="hasUberweisungscode ? 'text-green-400' : 'text-amber-400'"
                        class="w-5 h-5 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <span :class="[
                          'font-medium text-sm block',
                          hasUberweisungscode && hasDringendErforderlich ? 'text-green-100' : 'text-blue-100'
                        ]">Überweisungscode erhalten</span>
                        <span :class="[
                          'text-xs',
                          hasUberweisungscode && hasDringendErforderlich ? 'text-green-200/70' : 'text-blue-200/70'
                        ]">Vom Therapeuten im Erstgespräch</span>
                      </div>
                    </div>
                    <UButton
                      @click="toggleUberweisungscode"
                      :color="hasUberweisungscode ? 'green' : 'blue'"
                      size="xs"
                      :variant="hasUberweisungscode ? 'solid' : 'outline'"
                      :icon="hasUberweisungscode ? 'i-heroicons-check' : 'i-heroicons-plus'"
                      class="shadow hover:shadow-lg transition-all"
                    >
                      {{ hasUberweisungscode ? 'Erhalten' : 'Als erledigt markieren' }}
                    </UButton>
                  </div>
                  
                  <div :class="[
                    'h-px bg-gradient-to-r from-transparent to-transparent',
                    hasUberweisungscode && hasDringendErforderlich ? 'via-green-300/30' : 'via-blue-300/30'
                  ]"></div>
                  
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-start gap-3">
                      <UIcon 
                        :name="hasDringendErforderlich ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-circle'"
                        :class="hasDringendErforderlich ? 'text-green-400' : 'text-amber-400'"
                        class="w-5 h-5 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <span :class="[
                          'font-medium text-sm block',
                          hasUberweisungscode && hasDringendErforderlich ? 'text-green-100' : 'text-blue-100'
                        ]">"Therapie dringend zeitnah erforderlich"</span>
                        <span :class="[
                          'text-xs',
                          hasUberweisungscode && hasDringendErforderlich ? 'text-green-200/70' : 'text-blue-200/70'
                        ]">Angekreuzt auf dem Diagnosebogen</span>
                      </div>
                    </div>
                    <UButton
                      @click="toggleDringendErforderlich"
                      :color="hasDringendErforderlich ? 'green' : 'blue'"
                      size="xs"
                      :variant="hasDringendErforderlich ? 'solid' : 'outline'"
                      :icon="hasDringendErforderlich ? 'i-heroicons-check' : 'i-heroicons-plus'"
                      class="shadow hover:shadow-lg transition-all"
                    >
                      {{ hasDringendErforderlich ? 'Angekreuzt' : 'Als erledigt markieren' }}
                    </UButton>
                  </div>
                </div>
              </div>
              
              <p class="text-blue-100/90 leading-relaxed">
                Das Kontaktprotokoll ist <strong>essentiell</strong> für dein Kostenerstattungsverfahren. Du musst nachweisen, dass du selbständig mehrere Therapeuten kontaktiert hast, aber keinen zeitnahen Termin (unter 3 Monaten) bekommen konntest.
              </p>

              <!-- KARL Kontaktprotokoll Feature Integration -->
              <div :class="[
                'border-2 rounded-xl p-4 lg:p-6 transition-all duration-300',
                contactCount > 0 
                  ? 'bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border-green-400/30'
                  : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/30 hover:border-blue-300/50'
              ]">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div :class="[
                      'flex h-8 w-8 items-center justify-center rounded-lg border-2',
                      contactCount > 0 
                        ? 'bg-green-500/20 border-green-400/40' 
                        : 'bg-blue-500/20 border-blue-400/40'
                    ]">
                      <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <h4 :class="[
                        'font-semibold flex items-center gap-2',
                        contactCount > 0 ? 'text-green-200' : 'text-blue-200'
                      ]">
                        KARL Kontaktprotokoll-Tool
                        <span v-if="contactCount > 0" class="text-green-400 text-xs">({{ contactCount }} Kontakte)</span>
                      </h4>
                      <p :class="[
                        'text-xs',
                        contactCount > 0 ? 'text-green-200/70' : 'text-blue-200/70'
                      ]">Automatische Dokumentation & PDF-Export</p>
                    </div>
                  </div>
                  
                  <!-- KARL AI Badge -->
                  <div class="flex items-center gap-2">
                    <div class="bg-black text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-gray-600">
                      AI
                    </div>
                  </div>
                </div>

                <!-- Progress Overview -->
                <div v-if="contactCount > 0" class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-blue-200">Kontakt-Fortschritt</span>
                    <span class="text-sm font-semibold text-blue-100">{{ Math.min(contactCount, 10) }}/10 empfohlen</span>
                  </div>
                  <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      class="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all duration-500 ease-out"
                      :style="{ width: Math.min((contactCount / 10) * 100, 100) + '%' }"
                    />
                  </div>
                  <div class="flex justify-between mt-1 text-xs">
                    <span :class="contactCount >= 6 ? 'text-green-300' : 'text-blue-200/70'">
                      {{ contactCount >= 6 ? '✓ Minimum erreicht' : `${Math.max(0, 6 - contactCount)} weitere benötigt` }}
                    </span>
                    <span :class="contactCount >= 10 ? 'text-green-300' : 'text-blue-200/70'">
                      {{ contactCount >= 10 ? '✓ Optimal' : `${Math.max(0, 10 - contactCount)} bis optimal` }}
                    </span>
                  </div>
                  
                  <!-- Contact List Preview -->
                  <div class="mt-3 bg-white/5 border border-white/10 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-blue-200">Deine Kontakte</span>
                      <span class="text-xs text-blue-300">{{ qualifyingContactsCount }} qualifizieren für PDF</span>
                    </div>
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                      <div 
                        v-for="contact in getContactData().slice(0, 5)" 
                        :key="contact.id"
                        class="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10"
                      >
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-medium text-blue-100 truncate">
                              {{ contact.therapistName || 'Unbekannter Therapeut' }}
                            </span>
                            <span 
                              v-if="!contact.replyReceived || (contact.waitingTime && !contact.waitingTime.includes('1 Monat') && !contact.waitingTime.includes('2 Monate'))"
                              class="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"
                              title="Qualifiziert für PDF"
                            />
                            <span 
                              v-else
                              class="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full"
                              title="Nicht für PDF qualifiziert"
                            />
                          </div>
                          <div class="text-xs text-blue-200/70 truncate">
                            {{ contact.contactDate || 'Kein Datum' }} • {{ contact.waitingTime || 'Keine Antwort' }}
                          </div>
                        </div>
                      </div>
                      <div v-if="contactCount > 5" class="text-center">
                        <span class="text-xs text-blue-300 italic">... und {{ contactCount - 5 }} weitere</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div v-if="contactCount > 0" class="space-y-3">
                  <!-- Main Action Button -->
                  <NuxtLink 
                    to="/therapists"
                    :class="[
                      'group flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-full',
                      'bg-green-500 hover:bg-green-600 text-white border border-green-400/50'
                    ]"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                    <span class="text-sm">Kontakte verwalten & mehr hinzufügen</span>
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 opacity-70 group-hover:opacity-100" />
                  </NuxtLink>

                  <!-- PDF Actions -->
                  <div class="grid gap-2 sm:grid-cols-2">
                    <!-- View PDF Button -->
                    <button 
                      @click="previewProtocolPdf"
                      :disabled="qualifyingContactsCount < 3"
                      :class="[
                        'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 shadow border text-sm',
                        qualifyingContactsCount >= 3
                          ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400/50 hover:shadow-lg hover:scale-105 active:scale-95'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/20 cursor-not-allowed'
                      ]"
                    >
                      <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                      <span>PDF ansehen</span>
                    </button>

                    <!-- Download PDF Button -->
                    <button 
                      @click="downloadProtocolPdf"
                      :disabled="qualifyingContactsCount < 3"
                      :class="[
                        'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 shadow border text-sm',
                        qualifyingContactsCount >= 3
                          ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-400/50 hover:shadow-lg hover:scale-105 active:scale-95'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/20 cursor-not-allowed'
                      ]"
                    >
                      <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                      <span>PDF herunterladen</span>
                    </button>
                  </div>

                  <!-- Minimum contacts notice -->
                  <div v-if="qualifyingContactsCount < 3" class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-300 flex-shrink-0" />
                      <span class="text-xs text-amber-200">
                        Du benötigst mindestens 3 qualifizierende Kontakte für das PDF 
                        ({{ Math.max(0, 3 - qualifyingContactsCount) }} weitere benötigt)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- No contacts state -->
                <div v-else class="space-y-3">
                  <!-- Start Button -->
                  <NuxtLink 
                    to="/therapists"
                    class="group flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-full bg-blue-500 hover:bg-blue-600 text-white border border-blue-400/50"
                  >
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4" />
                    <span class="text-sm">KARL Tool nutzen</span>
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 opacity-70 group-hover:opacity-100" />
                  </NuxtLink>

                  <!-- Alternative Manual Option -->
                  <div class="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-2">
                      <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-blue-300" />
                      <span class="text-xs font-medium text-blue-200">Manuell dokumentieren</span>
                    </div>
                    <p class="text-xs text-blue-100/70 leading-relaxed">
                      Du kannst auch selbst eine Liste führen oder Musterdokumente aus dem Internet verwenden.
                    </p>
                  </div>
                </div>

                <!-- Feature Benefits -->
                <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-blue-300" />
                    <span class="text-xs font-medium text-blue-200">KARL macht's einfacher:</span>
                  </div>
                  <ul class="text-xs text-blue-100/80 space-y-1">
                    <li class="flex items-start gap-2">
                      <span class="text-blue-300 mt-0.5">•</span>
                      <span>Automatische Therapeutensuche in deiner Region</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-300 mt-0.5">•</span>
                      <span>Kontakte direkt aus der Suche speichern und verfolgen</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-300 mt-0.5">•</span>
                      <span>Offizielles PDF im korrekten Format für die Krankenkasse</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-blue-300 mt-0.5">•</span>
                      <span>Auto-Save: Deine Daten bleiben sicher im Browser gespeichert</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- Important Requirements -->
              <div class="bg-amber-500/10 p-4 lg:p-5 rounded-xl border border-amber-500/20">
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                  <div class="space-y-2">
                    <h4 class="text-amber-200 font-semibold">Was die Krankenkasse sehen will:</h4>
                    <ul class="text-amber-100/90 text-sm space-y-1.5">
                      <li class="flex items-start gap-2">
                        <span class="text-amber-300 mt-1">•</span>
                        <span><strong>6-10 Kontaktversuche</strong> bei verschiedenen Therapeuten</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-amber-300 mt-1">•</span>
                        <span><strong>Datum und Uhrzeit</strong> jedes Kontaktversuchs</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-amber-300 mt-1">•</span>
                        <span><strong>Wartezeit über 3 Monate</strong> oder keine Rückmeldung</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span class="text-amber-300 mt-1">•</span>
                        <span><strong>Name und Adresse</strong> der kontaktierten Therapeuten</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Manual Documentation Tips -->
              <div class="bg-white/5 p-4 rounded-lg border border-white/10">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-blue-300" />
                  <h4 class="text-blue-200 font-medium text-sm">Alternative: Manuell dokumentieren</h4>
                </div>
                <div class="space-y-2 text-xs text-blue-100/80">
                  <p>
                    <strong>Therapeuten finden:</strong> therapie.de, Krankenkassen-Websites, Hausarzt-Empfehlungen
                  </p>
                  <p>
                    <strong>Dokumentation:</strong> Excel-Tabelle oder handschriftliche Liste mit allen Kontaktdaten
                  </p>
                  <p>
                    <strong>Wichtig:</strong> Jeden Anruf/E-Mail sofort notieren – auch wenn niemand antwortet!
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="sm"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
              >
                Zurück
              </UButton>
              
              <div class="flex items-center gap-3">
                <UButton 
                  @click="completeStep(2)" 
                  :color="stepProgress[2] ? 'green' : 'blue'" 
                  size="sm"
                  variant="outline"
                  :icon="stepProgress[2] ? 'i-heroicons-check-circle' : 'i-heroicons-clock'"
                >
                  {{ stepProgress[2] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
                </UButton>
                
                <UButton 
                  @click="nextStep" 
                  color="primary"
                  size="sm"
                  trailing-icon="i-heroicons-chevron-right"
                >
                  Weiter zu Schritt 3
                </UButton>
              </div>
            </div>
          </div>

          <!-- Step 3: Probatorik -->
          <div v-if="currentStep === 3" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
                <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">Schritt 3: Probatorik vereinbaren</h3>
                <p class="text-blue-200/80 text-sm">Vertiefende Sitzung zur Therapiebedarfsklärung</p>
              </div>
            </div>
            
            <div class="space-y-4 text-sm lg:text-base">
              <p class="text-blue-100/90">
                Nach dem Erstgespräch kannst du über die Terminservicestelle eine <strong>probatorische Sitzung</strong> vereinbaren. Diese hilft, den Therapiebedarf zu klären.
              </p>
              
              <div class="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                <h4 class="text-amber-200 font-medium mb-2">📋 Du benötigst den Dringlichkeitscode</h4>
                <p class="text-amber-100/90 text-sm">
                  Den findest du auf der "Individuellen Patienteninformation" aus dem Erstgespräch. <strong>Kein Code erhalten?</strong> Dann kannst du diesen Schritt überspringen.
                </p>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="md"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
                class="w-full sm:w-auto order-2 sm:order-1"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(3)" 
                :color="stepProgress[3] ? 'green' : 'blue'" 
                size="md"
                variant="outline"
                class="w-full sm:w-auto order-1 sm:order-2"
              >
                {{ stepProgress[3] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="md"
                trailing-icon="i-heroicons-chevron-right"
                class="w-full sm:w-auto order-3"
              >
                Weiter zu Schritt 4
              </UButton>
            </div>
          </div>

          <!-- Step 4: Hausarzt -->
          <div v-if="currentStep === 4" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 border border-green-500/30">
                <UIcon name="i-heroicons-user" class="w-5 h-5 text-green-300" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">Schritt 4: Hausarzt konsultieren</h3>
                <p class="text-blue-200/80 text-sm">Bescheinigung über die Notwendigkeit einer Psychotherapie</p>
              </div>
            </div>
            
            <div class="space-y-4 text-sm lg:text-base">
              <p class="text-blue-100/90">
                Vereinbare einen Termin bei deinem <strong>Hausarzt</strong> und bitte um eine Bescheinigung über die Notwendigkeit einer Psychotherapie.
              </p>
              
              <div class="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <h4 class="text-blue-200 font-medium mb-2">📄 Attest oder formloses Schreiben</h4>
                <p class="text-blue-100/90 text-sm">
                  Wichtig ist, dass eine Psychotherapie als <strong>zeitnah empfohlen</strong> wird. Die genaue Form ist nebensächlich.
                </p>
              </div>

              <div class="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <h4 class="text-green-200 font-medium mb-2">💬 Was du sagen kannst</h4>
                <p class="text-green-100/90 text-sm">
                  "Ich brauche diese Bescheinigung für ein Kostenerstattungsverfahren. Ich halte eine Psychotherapie für notwendig, habe aber trotz intensiver Suche keinen Therapieplatz gefunden."
                </p>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="md"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
                class="w-full sm:w-auto order-2 sm:order-1"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(4)" 
                :color="stepProgress[4] ? 'green' : 'blue'" 
                size="md"
                variant="outline"
                class="w-full sm:w-auto order-1 sm:order-2"
              >
                {{ stepProgress[4] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="md"
                trailing-icon="i-heroicons-chevron-right"
                class="w-full sm:w-auto order-3"
              >
                Weiter zu Schritt 5
              </UButton>
            </div>
          </div>

          <!-- Step 5: Kostenerstattung -->
          <div v-if="currentStep === 5" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30">
                <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">Schritt 5: Kostenerstattungsantrag einreichen</h3>
                <p class="text-blue-200/80 text-sm">Antrag auf Übernahme der Kosten für private Psychotherapie</p>
              </div>
            </div>
            
            <div class="space-y-4 text-sm lg:text-base">
              <p class="text-blue-100/90">
                Wenn du trotz allem noch keinen Therapieplatz hast, kannst du einen <strong>Kostenerstattungsantrag</strong> bei deiner Krankenkasse stellen.
              </p>
              
              <div class="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <h4 class="text-red-200 font-medium mb-2">📎 Diese Unterlagen brauchst du (als Kopie)</h4>
                <p class="text-red-100/90 text-sm">
                  • Diagnosebogen aus dem Erstgespräch<br>
                  • Hausarzt-Bescheinigung<br>  
                  • Kontaktprotokoll deiner Suche
                </p>
              </div>

              <div class="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                <h4 class="text-amber-200 font-medium mb-2">⚖️ Beziehe dich auf § 13 Abs. 3 SGB V</h4>
                <p class="text-amber-100/90 text-sm">
                  Bitte um Kostenübernahme einer privaten Psychotherapie wegen unzureichender Versorgungslage.
                </p>
              </div>

              <div class="bg-slate-500/10 p-4 rounded-lg border border-slate-500/20">
                <h4 class="text-slate-200 font-medium mb-2">⏱️ Gut zu wissen</h4>
                <p class="text-slate-100/90 text-sm">
                  Entscheidung meist in 2-5 Wochen. Anträge werden oft erst abgelehnt, aber Widerspruch lohnt sich.
                </p>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="md"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
                class="w-full sm:w-auto order-2 sm:order-1"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(5)" 
                :color="stepProgress[5] ? 'green' : 'blue'" 
                size="md"
                variant="outline"
                class="w-full sm:w-auto order-1 sm:order-2"
              >
                {{ stepProgress[5] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="md"
                trailing-icon="i-heroicons-chevron-right"
                class="w-full sm:w-auto order-3"
              >
                Weiter zu Schritt 6
              </UButton>
            </div>
          </div>

          <!-- Step 6: Widerspruch -->
          <div v-if="currentStep === 6" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">Schritt 6: Widerspruch einreichen</h3>
                <p class="text-blue-200/80 text-sm">Falls der Kostenerstattungsantrag abgelehnt wurde</p>
              </div>
            </div>
            
            <div class="space-y-4 text-sm lg:text-base">
              <p class="text-blue-100/90">
                Falls deine Krankenkasse den Antrag ablehnt, schreibe einen <strong>Widerspruch</strong>. Krankenkassen lehnen oft zu Unrecht ab - ein Widerspruch hat gute Erfolgschancen.
              </p>
              
              <div class="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <h4 class="text-green-200 font-medium mb-2">✅ Lass dich nicht entmutigen</h4>
                <p class="text-green-100/90 text-sm">
                  Ein gut formulierter Widerspruch führt häufig zur nachträglichen Genehmigung. Viele Ablehnungen sind nicht rechtmäßig.
                </p>
              </div>

              <div class="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                <h4 class="text-amber-200 font-medium mb-2">💡 So machst du es richtig</h4>
                <p class="text-amber-100/90 text-sm">
                  Gehe konkret auf die Ablehnungsgründe ein und passe den Widerspruch an deine Situation an. Nutze gerne Vorlagen als Orientierung, aber individualisiere sie.
                </p>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="md"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
                class="w-full sm:w-auto order-2 sm:order-1"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(6)" 
                :color="stepProgress[6] ? 'green' : 'blue'" 
                size="md"
                variant="outline"
                class="w-full sm:w-auto order-1 sm:order-2"
              >
                {{ stepProgress[6] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="md"
                trailing-icon="i-heroicons-chevron-right"
                class="w-full sm:w-auto order-3"
              >
                Weiter zu Schritt 7
              </UButton>
            </div>
          </div>

          <!-- Step 7: Private Therapeuten -->
          <div v-if="currentStep === 7" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 border border-green-500/30">
                <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-green-300" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">Schritt 7: Privaten Psychotherapeuten finden</h3>
                <p class="text-blue-200/80 text-sm">Nach erfolgreicher Kostenübernahme-Zusage</p>
              </div>
            </div>
            
            <div class="space-y-4 text-sm lg:text-base">
              <p class="text-blue-100/90">
                Nach der Zusage deiner Krankenkasse kannst du dir einen <strong>privaten Psychotherapeuten</strong> suchen. Private Therapeuten sind oft schneller verfügbar.
              </p>
              
              <div class="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <h4 class="text-blue-200 font-medium mb-2">🔍 Auf therapie.de suchen</h4>
                <p class="text-blue-100/90 text-sm">
                  Gib deine PLZ ein und markiere "freie Therapieplätze" oder "Wartezeit bis 3 Monate" in den Filtern.
                </p>
              </div>

              <div class="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <h4 class="text-red-200 font-medium mb-2">⚠️ Achtung vor Heilpraktikern</h4>
                <p class="text-red-100/90 text-sm">
                  Diese sind <strong>keine Psychotherapeuten</strong> und können nicht mit der Krankenkasse abrechnen. Achte auf approbierte Psychotherapeuten.
                </p>
              </div>

              <div class="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <h4 class="text-green-200 font-medium mb-2">💬 Beim Erstkontakt sagen</h4>
                <p class="text-green-100/90 text-sm">
                  "Ich habe eine Zusage meiner Krankenkasse für das Kostenerstattungsverfahren. Unterstützen Sie das?" Warte mit dem Start bis zur finalen Bewilligung.
                </p>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="md"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
                class="w-full sm:w-auto order-2 sm:order-1"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(7)" 
                :color="stepProgress[7] ? 'green' : 'blue'" 
                size="md"
                variant="outline"
                class="w-full sm:w-auto order-1 sm:order-2"
              >
                {{ stepProgress[7] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="md"
                trailing-icon="i-heroicons-chevron-right"
                class="w-full sm:w-auto order-3"
              >
                Weiter zu Schritt 8
              </UButton>
            </div>
          </div>

          <!-- Step 8: Abschluss -->
          <div v-if="currentStep === 8" class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <UIcon name="i-heroicons-trophy" class="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">Schritt 8: Geschafft!</h3>
                <p class="text-blue-200/80 text-sm">Du hast den Weg zum Therapieplatz erfolgreich gemeistert</p>
              </div>
            </div>
            
            <div class="space-y-4 text-sm lg:text-base">
              <!-- Congratulations -->
              <div class="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-6 lg:p-8 rounded-xl border border-emerald-500/20">
                <div class="text-center space-y-4">
                  <div class="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 class="text-2xl font-bold text-white">Herzlichen Glückwunsch! 🎉</h4>
                  <p class="text-emerald-200 leading-relaxed">
                    Du hast alle Schritte gemeistert! Die Therapiesuche ist oft ein Marathon, aber du hast durchgehalten. Das zeigt echte Stärke und du kannst stolz auf dich sein.
                  </p>
                </div>
              </div>

              <div class="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <h4 class="text-blue-200 font-medium mb-2">➡️ Wie es weitergeht</h4>
                <p class="text-blue-100/90 text-sm">
                  Weitere Anträge machst du gemeinsam mit deinem Therapeuten. Er wird dich bei allem unterstützen.
                </p>
              </div>

              <div class="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                <h4 class="text-purple-200 font-medium mb-2">💜 Du bist auf dem richtigen Weg</h4>
                <p class="text-purple-100/90 text-sm">
                  Der schwierigste Teil liegt hinter dir. Jetzt kannst du dich voll auf deine Therapie konzentrieren. Wir wünschen dir alles Gute!
                </p>
              </div>

              <div class="bg-slate-500/10 p-4 rounded-lg border border-slate-500/20">
                <h4 class="text-slate-200 font-medium mb-2">🤝 KARL hat geholfen?</h4>
                <p class="text-slate-100/90 text-sm mb-3">
                  Freut uns! Über Feedback oder Unterstützung würden wir uns riesig freuen.
                </p>
                <div class="flex gap-2">
                  <UButton 
                    to="https://github.com/faeller/karl-therapy-finder"
                    target="_blank"
                    size="sm"
                    color="gray"
                    variant="outline"
                    leading-icon="i-simple-icons-github"
                  >
                    GitHub
                  </UButton>
                  <UButton 
                    to="https://www.patreon.com/karlhelps"
                    target="_blank"
                    size="sm"
                    color="orange"
                    variant="outline"
                    leading-icon="i-simple-icons-patreon"
                  >
                    Unterstützen
                  </UButton>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="md"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
                class="w-full sm:w-auto order-2 sm:order-1"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(8)" 
                :color="stepProgress[8] ? 'green' : 'blue'" 
                size="md"
                variant="outline"
                class="w-full sm:w-auto order-1 sm:order-2"
              >
                {{ stepProgress[8] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <div class="flex items-center gap-2 text-emerald-400 text-sm font-medium order-3">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
                Guide abgeschlossen!
              </div>
            </div>
          </div>
          <template #fallback>
            <div class="w-full">
              <!-- Default Step 1 content for SSR -->
              <div class="space-y-6 p-6 lg:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div class="flex items-center gap-3 mb-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
                    <UIcon name="i-heroicons-phone" class="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold text-white">Schritt 1: Erstgespräch vereinbaren</h3>
                    <p class="text-blue-200/80 text-sm">Der einfachste Weg zu einem ersten Beratungstermin</p>
                  </div>
                </div>
                
                <div class="space-y-4 text-sm lg:text-base">
                  <p class="text-blue-100/90 leading-relaxed">
                    Bei der <strong>Terminservicestelle</strong> erhältst du ohne großen Aufwand direkt einen Termin für ein psychotherapeutisches Erstgespräch.
                  </p>
                  
                  <div class="grid gap-3 lg:gap-4 lg:grid-cols-2">
                    <!-- Phone Option -->
                    <div class="bg-blue-500/10 p-4 lg:p-5 rounded-xl border border-blue-500/20 group hover:border-blue-400/30 transition-all duration-300">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-heroicons-phone" class="w-5 h-5 text-blue-300" />
                        <p class="text-blue-200 font-semibold">Telefonisch anrufen</p>
                      </div>
                      <div class="text-2xl lg:text-3xl font-bold text-blue-300 mb-3">
                        116 117
                      </div>
                      <p class="text-blue-100/80 text-xs mb-4">Kostenlos aus allen Netzen • 24/7 erreichbar</p>
                      
                      <a 
                        href="tel:116117"
                        class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                        Jetzt anrufen
                      </a>
                    </div>

                    <!-- Online Option -->
                    <div class="bg-green-500/10 p-4 lg:p-5 rounded-xl border border-green-500/20 group hover:border-green-400/30 transition-all duration-300">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5 text-green-300" />
                        <p class="text-green-200 font-semibold">Online Terminbuchung</p>
                      </div>
                      <div class="text-lg font-semibold text-green-300 mb-3 flex items-center gap-1">
                        eterminservice.de
                        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                      </div>
                      <p class="text-green-100/80 text-xs mb-4">Je nach Region verfügbar • Direkte Terminbuchung</p>
                      
                      <a 
                        href="https://www.eterminservice.de"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
                        Online buchen
                      </a>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
                  <UButton 
                    color="blue"
                    size="md"
                    variant="outline"
                    icon="i-heroicons-clock"
                  >
                    Als erledigt markieren
                  </UButton>
                  
                  <UButton 
                    color="primary"
                    size="md"
                    trailing-icon="i-heroicons-chevron-right"
                  >
                    Weiter zu Schritt 2
                  </UButton>
                </div>
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>

      <!-- Divider -->
      <div class="w-full max-w-lg">
        <div class="h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
      </div>

      <!-- Karl Waitlist Section -->
      <div class="w-full max-w-4xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6 space-y-4">
        <div class="text-center space-y-3">
          <h3 class="text-lg font-semibold text-purple-200 flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-sparkles" class="w-5 h-5" />
            Lass Karl für dich anrufen
            <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-full">
              Warteliste bald verfügbar
            </span>
          </h3>
          <p class="text-purple-100/90 text-sm leading-relaxed">
            KARL AI wird bald für dich anrufen und einen Termin vereinbaren können.
          </p>
          
          <!-- Coming Soon Notice -->
          <div class="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div class="flex items-center justify-center gap-2 mb-2">
              <UIcon name="i-heroicons-clock" class="w-5 h-5 text-purple-300" />
              <h4 class="text-purple-200 font-medium text-sm">Bald verfügbar</h4>
            </div>
            <p class="text-purple-100/80 text-xs">
              Diese Funktion befindet sich noch in der Entwicklung. Wir arbeiten daran, dir bald einen automatisierten Service anzubieten, der für dich Termine bei Therapeuten vereinbart.
            </p>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="w-full max-w-md">
        <div class="h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
      </div>

      <!-- Encouraging Message -->
      <div class="w-full max-w-4xl bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-green-400/20 rounded-xl p-6 space-y-4">
        <div class="text-center space-y-3">
          <h3 class="text-lg font-semibold text-green-200 flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-heart" class="w-5 h-5" />
            Du schaffst das!
          </h3>
          <p class="text-blue-100/90 text-sm leading-relaxed">
            Wir von KARL wünschen Dir ganz viel Kraft und Erfolg bei Deiner Suche! Der Weg mag manchmal mühsam erscheinen, aber jeder Schritt bringt Dich näher zu der Hilfe, die Du verdienst.
          </p>
          <p class="text-blue-200/80 text-xs italic">
            Solltest Du bei einigen Schritten unsicher sein, nutze gerne unsere Therapeutensuche oder wende Dich an Beratungsstellen in Deiner Nähe.
          </p>
        </div>
      </div>

      <!-- Divider -->
      <div class="w-full max-w-md">
        <div class="h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3">
        <button @click="resetGuide" class="group relative overflow-hidden rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 px-4 py-2 text-red-200 text-sm font-medium transition-all duration-300 hover:bg-red-500/30 hover:scale-105 active:scale-95">
          <div class="relative z-10 flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            Guide zurücksetzen
          </div>
        </button>
        
        <button @click="$router.push('/therapists')" class="group relative overflow-hidden rounded-xl bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 px-4 py-2 text-blue-200 text-sm font-medium transition-all duration-300 hover:bg-blue-500/30 hover:scale-105 active:scale-95">
          <div class="relative z-10 flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
            Therapeuten suchen
          </div>
          <div class="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
      </div>
      </template>

      <!-- Show profile prompt if no valid PLZ (and not loading) -->
      <template v-else-if="!isLoadingProfile">
        <div class="text-center space-y-4 mt-8">
          <UIcon name="i-heroicons-map-pin" class="w-12 h-12 text-blue-300 mx-auto" />
          <p class="text-blue-100/80">
            Bitte gib zuerst deine Postleitzahl in deinem Profil an, um den Therapie-Guide zu nutzen.
          </p>
          <UButton 
            to="/onboarding" 
            color="primary" 
            size="lg"
            icon="i-heroicons-arrow-right"
          >
            Zum Profil
          </UButton>
        </div>
      </template>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
interface StepperItem {
  slot: string
  title: string
  description: string
  icon: string
  value: number
}

interface TherapistResult {
  id: string
  name: string
  qualification: string
  address: string
  phone: string
  distance: number
  profileUrl: string
}

interface ProtocolEntry {
  name: string
  date: string
  result: string
  contacted: boolean
}

interface EterminserviceAvailability {
  plz: string
  available: boolean
  radius?: string
  region?: string
  errors?: string[]
  message?: string
}

// Stepper configuration
const stepperItems = ref<StepperItem[]>([
  {
    slot: 'erstgespraech',
    title: 'Erstgespräch',
    description: 'Terminservice 116 117',
    icon: 'i-heroicons-phone',
    value: 0
  },
  {
    slot: 'kontaktprotokoll',
    title: 'Kontaktprotokoll',
    description: '6-10 Therapeuten',
    icon: 'i-heroicons-clipboard-document-list',
    value: 1
  },
  {
    slot: 'probatorik',
    title: 'Probatorik',
    description: 'Dringlichkeitscode',
    icon: 'i-heroicons-document-text',
    value: 2
  },
  {
    slot: 'hausarzt',
    title: 'Hausarzt',
    description: 'Bescheinigung',
    icon: 'i-heroicons-user',
    value: 3
  },
  {
    slot: 'kostenerstattung',
    title: 'Kostenerstattung',
    description: 'Antrag Krankenkasse',
    icon: 'i-heroicons-document-text',
    value: 4
  },
  {
    slot: 'widerspruch',
    title: 'Widerspruch',
    description: 'Falls abgelehnt',
    icon: 'i-heroicons-exclamation-triangle',
    value: 5
  },
  {
    slot: 'private',
    title: 'Private Therapeuten',
    description: 'Schneller verfügbar',
    icon: 'i-heroicons-user-group',
    value: 6
  },
  {
    slot: 'abschluss',
    title: 'Abschluss',
    description: 'Geschafft! 🎉',
    icon: 'i-heroicons-trophy',
    value: 7
  }
])

// Use all items but make them more compact
const visibleStepperItems = computed(() => stepperItems.value)

// Get user data from onboarding store
const onboardingStore = useOnboardingStore()

// Loading state for localStorage data
const isLoadingProfile = ref(true)

// Online service availability
const onlineServiceData = ref<EterminserviceAvailability | null>(null)
const isCheckingService = ref(false)
const isEditingPlz = ref(false)
const tempPlz = ref('')

// Note: Email functionality disabled due to eterminservice.de anti-bot protection

// Progress tracking toggles for Step 3
const hasUberweisungscode = ref(false)
const hasDringendErforderlich = ref(false)

// Contact data integration for Kontaktprotokoll
const getContactData = () => {
  if (process.client) {
    try {
      // Get contact attempts from localStorage (matches the structure in therapists/index.vue)
      const contactAttempts = JSON.parse(localStorage.getItem('contact-attempts') || '[]')
      const manualContactAttempts = JSON.parse(localStorage.getItem('manual-contact-attempts') || '[]')
      return [...contactAttempts, ...manualContactAttempts]
    } catch (error) {
      console.warn('Failed to load contact data:', error)
      return []
    }
  }
  return []
}

// Computed properties for contact tracking
const contactCount = computed(() => {
  return getContactData().length
})

const qualifyingContactsCount = computed(() => {
  const contacts = getContactData()
  // Count contacts that qualify for the protocol (no reply or long waiting time)
  return contacts.filter(contact => {
    return !contact.replyReceived || 
           (contact.waitingTime && !contact.waitingTime.includes('1 Monat') && !contact.waitingTime.includes('2 Monate'))
  }).length
})

// Helper function to prepare contact data for PDF
const prepareContactsForPdf = () => {
  const contacts = getContactData()
  const qualifyingContacts = contacts.filter(contact => {
    return !contact.replyReceived || 
           (contact.waitingTime && !contact.waitingTime.includes('1 Monat') && !contact.waitingTime.includes('2 Monate'))
  })

  return qualifyingContacts.map(contact => ({
    name: contact.therapistName || 'Name nicht verfügbar',
    address: contact.therapistAddress || 'Adresse nicht verfügbar', 
    date: contact.contactDate || new Date().toLocaleDateString('de-DE'),
    time: contact.contactTime || '12:00',
    waitingTime: contact.waitingTime || 'Warte noch auf Rückmeldung'
  }))
}

// Preview PDF function
const previewProtocolPdf = async () => {
  try {
    const pdfContacts = prepareContactsForPdf()

    if (pdfContacts.length < 3) {
      const toast = useToast()
      toast.add({
        title: 'Nicht genügend Kontakte',
        description: 'Du benötigst mindestens 3 qualifizierende Kontaktversuche für das PDF.',
        color: 'amber',
        timeout: 4000
      })
      return
    }

    // Use the PDF generator composable
    const { previewPdf } = usePdfGenerator()
    
    // Get current PLZ for the PDF
    const currentPLZ = onboardingStore?.formData?.location || '00000'
    
    // Preview PDF in new tab
    await previewPdf(pdfContacts, currentPLZ)
    
  } catch (error) {
    console.error('Failed to preview PDF:', error)
    const toast = useToast()
    toast.add({
      title: 'PDF-Fehler',
      description: 'Beim Anzeigen des PDFs ist ein Fehler aufgetreten.',
      color: 'red',
      timeout: 4000
    })
  }
}

// PDF download function
const downloadProtocolPdf = async () => {
  try {
    const pdfContacts = prepareContactsForPdf()

    if (pdfContacts.length < 3) {
      const toast = useToast()
      toast.add({
        title: 'Nicht genügend Kontakte',
        description: 'Du benötigst mindestens 3 qualifizierende Kontaktversuche für das PDF.',
        color: 'amber',
        timeout: 4000
      })
      return
    }

    // Use the PDF generator composable
    const { exportPdf } = usePdfGenerator()
    
    // Get current PLZ for the PDF
    const currentPLZ = onboardingStore?.formData?.location || '00000'
    
    // Generate and download PDF
    await exportPdf(pdfContacts, currentPLZ)
    
    const toast = useToast()
    toast.add({
      title: 'PDF heruntergeladen! 📋',
      description: `Kontaktprotokoll mit ${pdfContacts.length} Kontakten wurde gespeichert.`,
      color: 'green',
      timeout: 4000
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    const toast = useToast()
    toast.add({
      title: 'PDF-Fehler',
      description: 'Beim Erstellen des PDFs ist ein Fehler aufgetreten.',
      color: 'red',
      timeout: 4000
    })
  }
}

// Toggle functions
const toggleUberweisungscode = () => {
  hasUberweisungscode.value = !hasUberweisungscode.value
  saveGuideState()
}

const toggleDringendErforderlich = () => {
  hasDringendErforderlich.value = !hasDringendErforderlich.value
  saveGuideState()
}

// Get current PLZ for display and checks
const currentPlz = computed(() => {
  return onboardingStore?.formData?.location || ''
})


// Check regional service availability
const checkRegionalServices = async (plz?: string) => {
  const useThisPlz = plz || currentPlz.value
  if (!useThisPlz || !/^\d{5}$/.test(useThisPlz)) return
  
  if (isCheckingService.value) return // Prevent duplicate requests
  
  try {
    isCheckingService.value = true
    const response = await $fetch<EterminserviceAvailability>(`/api/eterminservice?plz=${useThisPlz}&service=psychotherapy`)
    onlineServiceData.value = response
  } catch (error) {
    console.error('Failed to check service availability:', error)
    // Set fallback data
    onlineServiceData.value = {
      plz: useThisPlz,
      available: false,
      message: 'Status unbekannt - bitte rufen Sie 116 117 an'
    }
  } finally {
    isCheckingService.value = false
  }
}

// Handle PLZ editing
const startEditingPlz = () => {
  tempPlz.value = currentPlz.value
  isEditingPlz.value = true
}

const saveNewPlz = () => {
  if (/^\d{5}$/.test(tempPlz.value)) {
    // Update the onboarding store
    onboardingStore.updateFormData({ location: tempPlz.value })
    isEditingPlz.value = false
    // Check availability with new PLZ
    checkRegionalServices(tempPlz.value)
  }
}

const cancelEditingPlz = () => {
  isEditingPlz.value = false
  tempPlz.value = ''
}

// Check if profile is loaded
onMounted(() => {
  // Give a moment for Pinia to hydrate from localStorage
  setTimeout(() => {
    isLoadingProfile.value = false
    // Check online service availability after profile loads
    checkRegionalServices()
  }, 100)
})

// Load persisted state or defaults
const getStoredGuideState = () => {
  if (process.client) {
    try {
      const stored = localStorage.getItem('therapist-guide-state')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load stored guide state:', error)
    }
  }
  return {
    currentStep: 1,
    stepProgress: {
      1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false
    },
    protocolEntries: [],
    hausarztCompleted: false,
    antragCompleted: false,
    antragStatus: '',
    hasUberweisungscode: false,
    hasDringendErforderlich: false
  }
}

const storedState = getStoredGuideState()

// State with persistence
const currentStep = ref(storedState.currentStep)

// Initialize toggle states from stored data
hasUberweisungscode.value = storedState.hasUberweisungscode || false
hasDringendErforderlich.value = storedState.hasDringendErforderlich || false

// Template refs
const stepperContainer = ref<HTMLElement>()
const stepperRef = ref()

// Reactive stepper index (0-based)
const currentStepIndex = ref(storedState.currentStep - 1)

// Keep currentStep and currentStepIndex in sync
watch(currentStep, (newStep) => {
  const newIndex = newStep - 1
  currentStepIndex.value = newIndex
}, { immediate: true })

watch(currentStepIndex, (newIndex) => {
  const newStep = newIndex + 1
  currentStep.value = newStep
})

// Auto-scroll to current step
const scrollToCurrentStep = () => {
  if (!stepperContainer.value) return
  
  nextTick(() => {
    const container = stepperContainer.value!
    const stepWidth = 150 // Reduced for less scrolling
    const offset = 40 // Increased offset to scroll less
    const scrollPosition = Math.max(0, (currentStepIndex.value * stepWidth) - offset)
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    })
  })
}

// Progress tracking
const stepProgress = ref(storedState.stepProgress)

// Computed progress values
const completedSteps = computed(() => {
  return Object.values(stepProgress.value).filter(Boolean).length
})

const overallProgress = computed(() => {
  const baseProgress = (currentStep.value - 1) / stepperItems.value.length * 100
  const completionBonus = completedSteps.value / stepperItems.value.length * 100
  return Math.min(100, Math.max(baseProgress, completionBonus))
})

const motivationalMessage = computed(() => {
  const messages = [
    "🚀 Du startest Deine Reise zum Therapieplatz!",
    "💪 Großartig! Du machst echte Fortschritte!",
    "📝 Super! Das Kontaktprotokoll ist wichtig!",
    "🏥 Du holst Dir professionelle Unterstützung!",
    "📋 Fast geschafft! Der Antrag ist ein großer Schritt!",
    "⚖️ Du kennst Deine Rechte und nutzt sie!",
    "🎉 Fantastisch! Du bist kurz vor dem Ziel!"
  ]
  
  if (completedSteps.value === stepperItems.value.length) {
    return "🏆 Herzlichen Glückwunsch! Du hast alle Schritte gemeistert!"
  }
  
  return messages[currentStep.value - 1] || "Du schaffst das! 💙"
})

// Navigation
const nextStep = () => {
  if (currentStep.value < stepperItems.value.length) {
    currentStep.value++
    scrollToCurrentStep()
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    scrollToCurrentStep()
  }
}

const completeStep = (step: number) => {
  stepProgress.value[step] = !stepProgress.value[step] // Toggle completion
  
  // Show toast
  const toast = useToast()
  const stepNames = ['Erstgespräch', 'Kontaktprotokoll', 'Probatorik', 'Hausarzt', 'Kostenerstattung', 'Widerspruch', 'Private Therapeuten', 'Abschluss']
  
  if (stepProgress.value[step]) {
    toast.add({
      title: 'Schritt abgeschlossen! 🎉',
      description: `${stepNames[step - 1]} erfolgreich bearbeitet`,
      color: 'green',
      timeout: 3000
    })
  } else {
    toast.add({
      title: 'Schritt zurückgesetzt',
      description: `${stepNames[step - 1]} als nicht erledigt markiert`,
      color: 'gray',
      timeout: 2000
    })
  }
}

// Save state to localStorage whenever it changes
const saveGuideState = () => {
  if (process.client) {
    try {
      const state = {
        currentStep: currentStep.value,
        stepProgress: stepProgress.value,
        protocolEntries: [],
        hausarztCompleted: false,
        antragCompleted: false,
        antragStatus: '',
        hasUberweisungscode: hasUberweisungscode.value,
        hasDringendErforderlich: hasDringendErforderlich.value
      }
      localStorage.setItem('therapist-guide-state', JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save guide state:', error)
    }
  }
}

// Watch for state changes and save
watch([currentStep, stepProgress], saveGuideState, { deep: true })

// Watch for step changes and auto-scroll
watch(currentStep, () => {
  scrollToCurrentStep()
}, { immediate: false })

// Auto-scroll on mount
onMounted(() => {
  nextTick(() => {
    scrollToCurrentStep()
  })
})

const resetGuide = () => {
  // Reset all state
  currentStep.value = 1
  stepProgress.value = {
    1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false
  }
  hasUberweisungscode.value = false
  hasDringendErforderlich.value = false
  
  // Clear localStorage
  if (process.client) {
    localStorage.removeItem('therapist-guide-state')
  }
  
  const toast = useToast()
  toast.add({
    title: 'Guide zurückgesetzt',
    description: 'Alle Fortschritte wurden gelöscht. Du kannst von vorne beginnen.',
    color: 'blue',
    timeout: 3000
  })
}

// Email functionality removed due to eterminservice.de access restrictions

</script>