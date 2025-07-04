<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8">
      <!-- Header -->
      <div class="w-full text-center space-y-3">
        <div class="relative mx-auto">
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
                  Bei der <strong>Terminservicestelle</strong> erhältst du ohne großen Aufwand direkt einen Termin für ein psychotherapeutisches Erstgespräch. In diesem Gespräch wird geklärt, ob eine Therapie für dich geeignet ist.
                </p>

                <!-- PLZ Display and Edit -->
                <div class="bg-white/5 p-4 lg:p-5 rounded-lg border border-white/10">
                  <div class="flex items-center justify-between gap-4">
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
                    <div class="flex items-center gap-1">
                      <template v-if="!isEditingPlz">
                        <button 
                          @click="startEditingPlz"
                          class="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                        >
                          ändern
                        </button>
                        <span class="text-blue-300/50 text-xs">(e.g. Berlin: 10115)</span>
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
                      <h4 class="text-amber-200 font-semibold">Wichtig für spätere Kostenerstattung:</h4>
                      <ul class="text-amber-100/90 text-sm space-y-1.5">
                        <li class="flex items-start gap-2">
                          <span class="text-amber-300 mt-1">•</span>
                          <span><strong>Behandlungsbedarf</strong> muss vom Therapeuten festgestellt werden</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-amber-300 mt-1">•</span>
                          <span>Auf der <strong>"Individuellen Patienteninformation"</strong> muss angekreuzt sein: <em>"Therapie zeitnah erforderlich"</em></span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-amber-300 mt-1">•</span>
                          <span>Nur dann ist später ein Kostenerstattungsverfahren möglich</span>
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

          <!-- Step 2: Probatorik -->
          <div v-if="currentStep === 2" class="space-y-4 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Terminservicestelle: Probatorik</h3>
            </div>
            
            <div class="space-y-3 text-sm">
              <p class="text-blue-100/90">
                Nach dem Erstgespräch erhältst Du über die Terminservicestelle zudem eine probatorische Sitzung. Hierzu brauchst Du einen Dringlichkeitscode, den Du auf der Individuellen Patienteninformation aus dem Erstgespräch findest.
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
                  Den Dringlichkeitscode erhältst Du im vorherigen Erstgespräch nur, wenn eine Dringlichkeit vom Therapeuten oder der Therapeutin festgestellt wird (= "zeitnah erforderlich" ist angekreuzt).
                </p>
              </div>
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="sm"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(2)" 
                :color="stepProgress[2] ? 'green' : 'blue'" 
                size="sm"
                variant="outline"
              >
                {{ stepProgress[2] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="sm"
                trailing-icon="i-heroicons-chevron-right"
              >
                Weiter
              </UButton>
            </div>
          </div>

          <!-- Step 3: Kontaktprotokoll -->
          <div v-if="currentStep === 3" class="space-y-4 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Kontaktprotokoll erstellen</h3>
            </div>
            <div class="space-y-3 text-sm">
              <p class="text-blue-100/90">
                Zudem solltest Du Dich selbständig (oder mit Hilfe von Freunden oder Bekannten) bei Psychotherapeuten um einen Therapieplatz bemüht haben. Deine Bemühungen der Kontaktaufnahme solltest Du in einem Kontaktprotokoll niederschreiben.
              </p>
              
              <div class="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <h4 class="text-blue-200 font-medium">💡 Therapeuten finden</h4>
                <p class="text-blue-100/80 text-xs mt-1">
                  Zum Beispiel findest Du erreichbare Psychotherapeuten im Internet auf therapie.de.
                </p>
              </div>

              <div class="space-y-2">
                <h4 class="text-blue-200 font-medium">⚠️ Wichtig zum Kontaktprotokoll:</h4>
                <ul class="text-blue-100/80 text-xs space-y-1 ml-4">
                  <li>• Es sollte jeweils den Namen der Therapeuten, das Datum und die Uhrzeit des Kontakts sowie eine Aussage der Therapeuten darüber enthalten, ob ein Therapieplatz in absehbarer Zeit (= in unter drei Monaten) verfügbar ist oder nicht.</li>
                  <li>• Notiere bitte auch die Psychotherapeuten, die nicht ans Telefon gehen!</li>
                  <li>• Insgesamt solltest Du je nach lokaler Verfügbarkeit zwischen sechs und zehn Therapeuten im Protokoll aufführen.</li>
                </ul>
              </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="sm"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(3)" 
                :color="stepProgress[3] ? 'green' : 'blue'" 
                size="sm"
                variant="outline"
              >
                {{ stepProgress[3] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="sm"
                trailing-icon="i-heroicons-chevron-right"
              >
                Weiter
              </UButton>
            </div>
          </div>

          <!-- Step 4: Hausarzt -->
          <div v-if="currentStep === 4" class="space-y-4 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-user" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Hausarzt Bescheinigung</h3>
            </div>
            <div class="space-y-3 text-sm">
              <p class="text-blue-100/90">
                Vereinbare bitte einen Termin bei Deinem Hausarzt. Du brauchst eine Bescheinigung über die Notwendigkeit einer Psychotherapie.
              </p>
              
              <div class="space-y-2">
                <h4 class="text-blue-200 font-medium">⚠️ Wichtig zum Hausarzt:</h4>
                <ul class="text-blue-100/80 text-xs space-y-1 ml-4">
                  <li>• Sprich offen mit Deinem Hausarzt, dass Du diese Bescheinigung für ein Kostenerstattungsverfahren benötigst.</li>
                  <li>• Gib Deinem Hausarzt auch zu erkennen, dass Du Deine Psychotherapie für nötig hältst, dass sie Dir sehr helfen würde und dass Du Dich bereits sehr um einen Therapieplatz bemüht hast und damit keinen Erfolg hattest.</li>
                </ul>
              </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="sm"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(4)" 
                :color="stepProgress[4] ? 'green' : 'blue'" 
                size="sm"
                variant="outline"
              >
                {{ stepProgress[4] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="sm"
                trailing-icon="i-heroicons-chevron-right"
              >
                Weiter
              </UButton>
            </div>
          </div>

          <!-- Step 5: Kostenerstattung -->
          <div v-if="currentStep === 5" class="space-y-4 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Kostenerstattungsantrag</h3>
            </div>
            <div class="space-y-3 text-sm">
              <p class="text-blue-100/90">
                Wenn Du bis hierhin noch keinen Therapiebeginn in absehbarer Zeit in Sicht hast, kannst Du einen Antrag auf Kostenerstattung an Deine Krankenkasse senden. In diesem solltest Du schreiben, dass Deine bisherigen Bemühungen nicht zu einem Therapieplatz geführt haben, diese Therapie aber nachweisbar dringend und zeitnah erforderlich ist.
              </p>
              
              <div class="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                <h4 class="text-amber-200 font-medium">📋 Rechtsnorm beachten</h4>
                <p class="text-amber-100/80 text-xs mt-1">
                  Du solltest Dich dabei auf die Rechtsnorm zur Kostenerstattung § 13 Abs. 3 SGB V beziehen und im Schreiben um die Kostenübernahme einer privaten Psychotherapie bitten.
                </p>
              </div>

              <div class="space-y-2">
                <h4 class="text-blue-200 font-medium">⚠️ Wichtig zum Kostenerstattungsantrag:</h4>
                <ul class="text-blue-100/80 text-xs space-y-1 ml-4">
                  <li>• Ein solcher Antrag kann komplex sein und wird häufig abgelehnt.</li>
                  <li>• Die Krankenkassen entscheiden in aller Regel in zwei bis fünf Wochen über Deinen Antrag auf Kostenerstattung.</li>
                  <li>• Du findest auch im Internet einige Musterschreiben, die Du eigenständig anpassen und individualisieren kannst.</li>
                </ul>
              </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="sm"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(5)" 
                :color="stepProgress[5] ? 'green' : 'blue'" 
                size="sm"
                variant="outline"
              >
                {{ stepProgress[5] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="sm"
                trailing-icon="i-heroicons-chevron-right"
              >
                Weiter
              </UButton>
            </div>
          </div>

          <!-- Step 6: Widerspruch -->
          <div v-if="currentStep === 6" class="space-y-4 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-300" />
              <h3 class="text-lg font-semibold text-white">Widerspruch einlegen</h3>
            </div>
            <div class="space-y-3 text-sm">
              <p class="text-blue-100/90">
                Sollte Deine Krankenkasse den Antrag auf Kostenerstattung ablehnen, empfehlen wir Dir, einen Widerspruch zu schreiben. Erfahrungsgemäß hat ein solcher Widerspruch oftmals Erfolg, denn in vielen Fällen lehnen die Krankenkassen derlei Anträge zu Unrecht ab.
              </p>
              
              <div class="space-y-2">
                <h4 class="text-blue-200 font-medium">⚠️ Wichtig zum Widerspruch:</h4>
                <ul class="text-blue-100/80 text-xs space-y-1 ml-4">
                  <li>• Der Widerspruch sollte sehr zielgenau und treffend formuliert sein.</li>
                  <li>• Aus rechtlichen Gründen sollte das Schreiben individuell angepasst werden – so, wie es für Dich am besten passt.</li>
                  <li>• Alternativ findest Du auch zum Widerspruchsschreiben einige Muster im Internet, die Du verwenden könntest.</li>
                </ul>
              </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="sm"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(6)" 
                :color="stepProgress[6] ? 'green' : 'blue'" 
                size="sm"
                variant="outline"
              >
                {{ stepProgress[6] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <UButton 
                @click="nextStep" 
                color="primary"
                size="sm"
                trailing-icon="i-heroicons-chevron-right"
              >
                Weiter
              </UButton>
            </div>
          </div>

          <!-- Step 7: Private Therapeuten -->
          <div v-if="currentStep === 7" class="space-y-4 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-green-300" />
              <h3 class="text-lg font-semibold text-white">Private Therapeuten</h3>
            </div>
            <div class="space-y-3 text-sm">
              <p class="text-blue-100/90">
                Nachdem die Krankenkasse Deinem Antrag zugestimmt hat, kannst Du Dir einen privaten Psychotherapeuten oder eine private Psychotherapeutin suchen und einen individuellen Behandlungsbeginn vereinbaren. Solche Psychotherapeuten sind oft viel schneller verfügbar.
              </p>
              
              <div class="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <h4 class="text-blue-200 font-medium">🔍 Private Therapeuten finden</h4>
                <p class="text-blue-100/80 text-xs mt-1">
                  Im Internet über Google oder auf therapie.de findest Du Psychotherapeuten in Deinem Umfeld. Du kannst hier auch die Suche einschränken, indem Du in der Navigation die Wartezeit auf "verfügbar" oder "bis drei Monate" umstellst.
                </p>
              </div>

              <div class="space-y-2">
                <h4 class="text-blue-200 font-medium">⚠️ Wichtig hierzu:</h4>
                <ul class="text-blue-100/80 text-xs space-y-1 ml-4">
                  <li>• Teile Deinem Wunschtherapeuten beim Erstkontakt mit, dass Du das Kostenerstattungsverfahren nutzen möchtest und die Zusage zu den ersten Sitzungen von Deiner Krankenkasse erhalten hast.</li>
                  <li>• Dein Therapeut wird Dir bei der Beantragung weiterer Sitzungen oder bei weiteren Fragen gerne helfen.</li>
                  <li>• Achtung vor Heilpraktikern: Diese sind sehr häufig zu finden. Dies sind keine Psychotherapeuten und sie können nicht mit Deiner Krankenkasse abrechnen!</li>
                  <li>• Beachte bitte auch, dass je nach örtlicher Verfügbarkeit auch bei privaten Psychotherapeuten die Kapazitäten ausgelastet sein können.</li>
                </ul>
              </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <UButton 
                @click="prevStep" 
                color="gray"
                size="sm"
                variant="ghost"
                leading-icon="i-heroicons-chevron-left"
              >
                Zurück
              </UButton>
              
              <UButton 
                @click="completeStep(7)" 
                :color="stepProgress[7] ? 'green' : 'blue'" 
                size="sm"
                variant="outline"
              >
                {{ stepProgress[7] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
              </UButton>
              
              <div class="flex items-center gap-2 text-green-400 text-sm font-medium">
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
            Lass Karl für dich anrufen (Für Warteliste Anmelden)
          </h3>
          <p class="text-purple-100/90 text-sm leading-relaxed">
            KARL AI kann für dich anrufen und einen Termin vereinbaren.
          </p>
          
          <!-- Privacy Notice -->
          <div class="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-left">
            <h4 class="text-purple-200 font-medium text-sm mb-2 flex items-center gap-2">
              <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
              Datenschutz & Verschlüsselung
            </h4>
            <ul class="text-purple-100/80 text-xs space-y-1.5">
              <li class="flex items-start gap-2">
                <span class="text-purple-300 mt-0.5">•</span>
                <span>Deine Profildaten werden mit AES-256 verschlüsselt gespeichert</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-purple-300 mt-0.5">•</span>
                <span>Nur deine PLZ wird unverschlüsselt für regionale Zuordnung gespeichert</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-purple-300 mt-0.5">•</span>
                <span>Daten werden nur zur Terminvermittlung verwendet und nach Erfolg gelöscht</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-purple-300 mt-0.5">•</span>
                <span>Du kannst jederzeit per E-Mail die Löschung deiner Daten verlangen</span>
              </li>
            </ul>
          </div>
          
          <!-- Waitlist Button -->
          <div class="flex justify-center">
            <UButton
              @click="joinKarlWaitlist"
              :disabled="isJoiningWaitlist || !isProfileCompleteForWaitlist"
              :loading="isJoiningWaitlist"
              color="purple"
              size="lg"
              icon="i-heroicons-phone"
              class="px-6 py-3"
            >
              {{ isJoiningWaitlist ? 'Wird hinzugefügt...' : 'Zur Karl-Warteliste hinzufügen' }}
            </UButton>
          </div>
          
          <!-- Status message -->
          <div v-if="waitlistStatus" :class="[
            'text-sm p-3 rounded-lg',
            waitlistStatus.success 
              ? 'bg-green-500/10 border border-green-500/20 text-green-200' 
              : 'bg-red-500/10 border border-red-500/20 text-red-200'
          ]">
            {{ waitlistStatus.message }}
          </div>
          
          <!-- Requirements notice -->
          <p v-if="!isProfileCompleteForWaitlist" class="text-purple-200/60 text-xs italic">
            Bitte gib eine gültige PLZ in deinem Profil an, um dich zur Warteliste hinzuzufügen.
          </p>
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
    slot: 'probatorik',
    title: 'Probatorik',
    description: 'Dringlichkeitscode',
    icon: 'i-heroicons-document-text',
    value: 1
  },
  {
    slot: 'kontaktprotokoll',
    title: 'Kontaktprotokoll',
    description: '6-10 Therapeuten',
    icon: 'i-heroicons-clipboard-document-list',
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

// Karl waitlist functionality
const isJoiningWaitlist = ref(false)
const waitlistStatus = ref<{success: boolean, message: string} | null>(null)

// Get current PLZ for display and checks
const currentPlz = computed(() => {
  return onboardingStore?.formData?.location || ''
})

// Check if profile is complete for waitlist (only PLZ required)
const isProfileCompleteForWaitlist = computed(() => {
  const hasLocation = !!(onboardingStore?.formData?.location)
  const isValidPlz = hasLocation && /^\d{5}$/.test(onboardingStore.formData.location)
  
  return hasLocation && isValidPlz
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
    antragStatus: ''
  }
}

const storedState = getStoredGuideState()

// State with persistence
const currentStep = ref(storedState.currentStep)

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
  const stepNames = ['Erstgespräch', 'Probatorik', 'Kontaktprotokoll', 'Hausarzt', 'Kostenerstattung', 'Widerspruch', 'Private Therapeuten']
  
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
        antragStatus: ''
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

// Join Karl waitlist with encrypted profile storage
const joinKarlWaitlist = async () => {
  if (!onboardingStore?.formData || isJoiningWaitlist.value) {
    return
  }
  
  // Validate required profile data (only PLZ required)
  if (!onboardingStore.formData.location || !/^\d{5}$/.test(onboardingStore.formData.location)) {
    waitlistStatus.value = {
      success: false,
      message: 'Bitte gib eine gültige PLZ in deinem Profil an.'
    }
    return
  }
  
  try {
    isJoiningWaitlist.value = true
    waitlistStatus.value = null
    
    const response = await $fetch('/api/karl-waitlist', {
      method: 'POST',
      body: {
        profile: onboardingStore.formData,
        consent: true // User has seen privacy notice and clicked button
      }
    })
    
    waitlistStatus.value = {
      success: response.success,
      message: response.message
    }
    
    if (response.success) {
      const toast = useToast()
      toast.add({
        title: 'Erfolgreich hinzugefügt! 🎉',
        description: 'Du bist jetzt auf der Karl-Warteliste. Wir melden uns!',
        color: 'green',
        timeout: 5000
      })
    }
    
  } catch (error: any) {
    console.error('Failed to join Karl waitlist:', error)
    waitlistStatus.value = {
      success: false,
      message: error?.data?.message || 'Es gab einen Fehler. Bitte versuche es später erneut.'
    }
  } finally {
    isJoiningWaitlist.value = false
  }
}
</script>