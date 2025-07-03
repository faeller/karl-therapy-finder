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

      <!-- Horizontal Stepper with Scrolling -->
      <div class="w-full max-w-7xl">
        <div ref="stepperContainer" class="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-blue-500/50 hover:scrollbar-thumb-blue-400/70 scroll-smooth mb-6">
          <div class="min-w-max px-4">
            <UStepper 
              :key="`stepper-${currentStep}`"
              :model-value="currentStepIndex" 
              @update:model-value="(value) => currentStepIndex = value"
              :items="visibleStepperItems" 
              class="w-full min-w-[1200px]"
              color="primary"
              orientation="horizontal"
              size="md"
              :disabled="false"
            /></div>
        </div>
        
        <!-- Step Content (Fixed, No Scrolling) -->
        <div class="w-full">
          <!-- Step 1: Terminservicestelle Erstgespräch -->
          <div v-if="currentStep === 1" class="space-y-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-phone" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Terminservicestelle: Erstgespräch</h3>
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

            <div class="flex justify-between items-center pt-4 border-t border-white/10">
              <UButton 
                @click="completeStep(1)" 
                :color="stepProgress[1] ? 'green' : 'blue'" 
                size="sm"
                variant="outline"
              >
                {{ stepProgress[1] ? 'Abgeschlossen ✓' : 'Als erledigt markieren' }}
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

          <!-- Step 2: Probatorik -->
          <div v-if="currentStep === 2" class="space-y-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Terminservicestelle: Probatorik</h3>
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
          <div v-if="currentStep === 3" class="space-y-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Kontaktprotokoll erstellen</h3>
            </div>
            <p class="text-blue-100/90 text-sm">
              Führe ein Kontaktprotokoll mit 6-10 Therapeuten für die Kostenerstattung.
            </p>
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
          <div v-if="currentStep === 4" class="space-y-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-user" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Hausarzt Bescheinigung</h3>
            </div>
            <p class="text-blue-100/90 text-sm">
              Hole Dir eine Bescheinigung von Deinem Hausarzt über die Notwendigkeit der Behandlung.
            </p>
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
          <div v-if="currentStep === 5" class="space-y-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-300" />
              <h3 class="text-lg font-semibold text-white">Kostenerstattungsantrag</h3>
            </div>
            <p class="text-blue-100/90 text-sm">
              Stelle einen Antrag auf Kostenerstattung bei Deiner Krankenkasse.
            </p>
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
          <div v-if="currentStep === 6" class="space-y-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-300" />
              <h3 class="text-lg font-semibold text-white">Widerspruch einlegen</h3>
            </div>
            <p class="text-blue-100/90 text-sm">
              Falls der Antrag abgelehnt wird, lege fristgerecht Widerspruch ein.
            </p>
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
          <div v-if="currentStep === 7" class="space-y-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-green-300" />
              <h3 class="text-lg font-semibold text-white">Private Therapeuten</h3>
            </div>
            <p class="text-blue-100/90 text-sm">
              Alternative: Suche nach privaten Therapeuten, die oft schneller verfügbar sind.
            </p>
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

// Computed for 0-based index for UStepper
const currentStepIndex = computed({
  get: () => currentStep.value - 1,
  set: (value) => currentStep.value = value + 1
})

// Auto-scroll to current step
const scrollToCurrentStep = () => {
  if (!stepperContainer.value) return
  
  nextTick(() => {
    const container = stepperContainer.value!
    const stepWidth = 200 // Approximate width per step
    const scrollPosition = currentStepIndex.value * stepWidth
    
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
  scrollToCurrentStep()
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
</script>