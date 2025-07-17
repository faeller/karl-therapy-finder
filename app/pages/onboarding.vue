<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'

// Pinia store
const onboardingStore = useOnboardingStore()

// Stepper items
const items = ref<StepperItem[]>([
  {
    slot: 'greeting',
    title: 'Begrüßung',
    description: 'Wie soll ich dich nennen?',
    icon: 'i-heroicons-hand-raised'
  },
  {
    slot: 'age',
    title: 'Alter',
    description: 'Über oder unter 21?',
    icon: 'i-heroicons-identification'
  },
  {
    slot: 'location',
    title: 'Standort',
    description: 'Wo suchst du?',
    icon: 'i-heroicons-map-pin'
  },
  {
    slot: 'struggles',
    title: 'Probleme',
    description: 'Womit kämpfst du?',
    icon: 'i-heroicons-heart'
  },
  {
    slot: 'preferences',
    title: 'Präferenzen',
    description: 'Therapie-Wünsche',
    icon: 'i-heroicons-adjustments-horizontal'
  },
  {
    slot: 'complete',
    title: 'Fertig',
    description: 'Los geht die Jagd!',
    icon: 'i-heroicons-rocket-launch'
  }
])

// Loading state
const isLoading = ref(true)

// Use store data
const formData = computed(() => onboardingStore.formData)
const currentStep = computed({
  get: () => onboardingStore.currentStep,
  set: (value) => onboardingStore.setCurrentStep(value)
})

// Stepper controls
const stepper = useTemplateRef('stepper')

// Sync stepper with store after mount
onMounted(() => {
  nextTick(() => {
    isLoading.value = false
  })
})

// Struggle options
const struggleOptions = [
  { value: 'angst', label: 'Angst & Sorgen', emoji: '😰' },
  { value: 'depression', label: 'Niedergeschlagenheit & Depression', emoji: '😔' },
  { value: 'stress', label: 'Stress & Burnout', emoji: '🔥' },
  { value: 'relationships', label: 'Beziehungsprobleme', emoji: '💔' },
  { value: 'trauma', label: 'Trauma & schwere Erlebnisse', emoji: '🌩️' },
  { value: 'eating', label: 'Essstörungen', emoji: '🍽️' },
  { value: 'ocd', label: 'Zwänge', emoji: '🔄' },
  { value: 'adhs', label: 'ADHS', emoji: '🧠' },
  { value: 'autism', label: 'Autismus', emoji: '∞' },
  { value: 'unsure', label: 'Ich weiß noch nicht genau', emoji: '🤷‍♀️' },
  { value: 'private', label: 'Möchte ich nicht sagen', emoji: '🤐' }
]

const genderOptions = [
  { value: 'egal', label: 'Ist mir egal' },
  { value: 'female', label: 'Weiblich' },
  { value: 'male', label: 'Männlich' },
  { value: 'diverse', label: 'Divers' }
]

const therapyMethodOptions = [
  { value: 'verhaltenstherapie', label: 'Verhaltenstherapie' },
  { value: 'tiefenpsychologie', label: 'Tiefenpsychologisches Verfahren' },
  { value: 'egal', label: 'Egal / Lass mich beraten' }
]

const paymentOptions = [
  { value: 'egal', label: 'Mir egal' },
  { value: 'kassensitz', label: 'Nur mit Kassensitz' },
  { value: 'kostenerstattung', label: 'Kostenerstattung ist okay' }
]

// Navigation functions
const nextStep = () => {
  if (stepper.value?.hasNext) {
    stepper.value.next()
  }
}

const prevStep = () => {
  if (currentStep.value === 0) {
    // Go back to landing page
    navigateTo('/')
  } else if (stepper.value?.hasPrev) {
    stepper.value.prev()
  }
}

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return true // nickname is optional
    case 1: return formData.value.isAdult !== null
    case 2: return /^\d{5}$/.test(formData.value.location.trim()) // exactly 5 digits required
    case 3: return true // struggles are optional
    case 4: return true // preferences are optional
    default: return true
  }
})

const toggleStruggle = (value: string, checked: boolean) => {
  const struggles = [...formData.value.struggles]
  if (checked) {
    if (!struggles.includes(value)) {
      struggles.push(value)
    }
  } else {
    const index = struggles.indexOf(value)
    if (index > -1) {
      struggles.splice(index, 1)
    }
  }
  onboardingStore.updateFormData({ struggles })
}

const toggleTherapyMethod = (value: string, checked: boolean) => {
  const therapyMethods = [...formData.value.therapyMethods]
  if (checked) {
    if (!therapyMethods.includes(value)) {
      therapyMethods.push(value)
    }
  } else {
    const index = therapyMethods.indexOf(value)
    if (index > -1) {
      therapyMethods.splice(index, 1)
    }
  }
  onboardingStore.updateFormData({ therapyMethods })
}

const completeOnboarding = () => {
  onboardingStore.completeOnboarding()
  console.log('Onboarding completed:', formData.value)
  navigateTo('/app')
}

// Location detection
const isGettingLocation = ref(false)
const locationError = ref('')

const getLocationAndPLZ = async () => {
  if (!navigator.geolocation) {
    locationError.value = 'Geolocation wird von diesem Browser nicht unterstützt'
    return
  }

  isGettingLocation.value = true
  locationError.value = ''

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      })
    })

    const { latitude, longitude } = position.coords

    // Use reverse geocoding to get PLZ
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=de`)
    
    if (!response.ok) {
      throw new Error('Geocoding-Service nicht verfügbar')
    }

    const data = await response.json()
    
    if (data.postcode && /^\d{5}$/.test(data.postcode)) {
      onboardingStore.updateFormData({ location: data.postcode })
      locationError.value = ''
    } else {
      throw new Error('Keine gültige deutsche PLZ gefunden')
    }
  } catch (error: any) {
    console.error('Location error:', error)
    
    if (error.code === 1) {
      locationError.value = 'Standort-Berechtigung verweigert'
    } else if (error.code === 2) {
      locationError.value = 'Standort nicht verfügbar'
    } else if (error.code === 3) {
      locationError.value = 'Standort-Anfrage dauerte zu lange'
    } else {
      locationError.value = error.message || 'Fehler beim Ermitteln des Standorts'
    }
  } finally {
    isGettingLocation.value = false
  }
}
</script>

<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6">
    <!-- Loading Animation -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>

    <!-- Main Content -->
    <div v-else>
    <!-- Header -->
    <div class="text-center space-y-2 mb-6">
      <div class="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm mx-auto">
        K
      </div>
      <h1 class="text-2xl font-bold text-white">Therapie-Jagd startklar machen! 🎯</h1>
      <p class="text-blue-100/80 text-sm">Alle Angaben sind optional - wir brauchen nur das Nötigste</p>
    </div>

    <!-- Stepper -->
    <UStepper 
      ref="stepper"
      :model-value="currentStep"
      @update:model-value="(value) => onboardingStore.setCurrentStep(value)"
      :items="items" 
      color="primary"
      size="sm"
      class="w-full max-w-4xl mx-auto"
      orientation="horizontal"
    >
      <template #greeting>
        <!-- Greeting Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-2xl font-semibold text-white">Hi! Ich bin KARL 👋</h2>
            <p class="text-blue-100/80 text-base">Wie soll ich dich nennen?</p>
            <p class="text-sm text-blue-200/60">Nur ein Spitzname - wenn wir später echte Daten brauchen, fragen wir nochmal!</p>
          </div>
          
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
            <div class="space-y-4">
              <div class="relative">
                <input
                  :value="formData.nickname"
                  @input="(e) => onboardingStore.updateFormData({ nickname: e.target.value })"
                  placeholder="Dein Spitzname..."
                  :disabled="false"
                  @focus="() => { if (formData.skipNickname) { onboardingStore.updateFormData({ skipNickname: false }); } }"
                  @keyup.enter="nextStep"
                  class="w-full px-4 py-4 text-lg text-center bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              
              <button
                v-if="!formData.nickname || formData.skipNickname"
                @click="() => { 
                  const newValue = !formData.skipNickname;
                  onboardingStore.updateFormData({ skipNickname: newValue }); 
                  if (newValue) {
                    onboardingStore.updateFormData({ nickname: '' });
                    nextStep();
                  }
                }"
                :class="[
                  'w-full p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105',
                  formData.skipNickname
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                ]"
              >
                <span class="text-white font-medium text-sm">Ohne Spitzname weitermachen</span>
              </button>
              
              <button
                v-if="formData.nickname && !formData.skipNickname"
                @click="nextStep"
                class="w-full p-3 rounded-lg border-2 bg-blue-500/20 border-blue-500/50 shadow-lg transition-all duration-200 hover:scale-105"
              >
                <span class="text-white font-medium text-sm">Weiter</span>
              </button>
            </div>
          </div>
        </div>

      </template>

      <template #age>
        <!-- Age Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-white">Bist du über oder unter 21? 🎂</h2>
            <p class="text-blue-100/80 text-sm">Das ist wichtig für die Art der Therapie (Kinder-/Jugendlichenpsychotherapie)</p>
          </div>
          
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
            <div class="grid grid-cols-2 gap-4">
              <div
                @click="() => { onboardingStore.updateFormData({ isAdult: true }); nextStep() }"
                :class="[
                  'cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105',
                  formData.isAdult === true
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                ]"
              >
                <div class="text-center">
                  <div class="text-4xl mb-2">🧑‍🎓</div>
                  <div class="text-white font-medium">Über 21</div>
                </div>
              </div>
              <div
                @click="() => { onboardingStore.updateFormData({ isAdult: false }); nextStep() }"
                :class="[
                  'cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105',
                  formData.isAdult === false
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                ]"
              >
                <div class="text-center">
                  <div class="text-4xl mb-2">🎒</div>
                  <div class="text-white font-medium">Unter 21</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </template>

      <template #location>
        <!-- Location Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-white">Wo suchst du? 📍</h2>
            <p class="text-blue-100/80 text-sm">Deine Postleitzahl eingeben oder automatisch ermitteln</p>
          </div>
          
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-lg mx-auto">
            <div class="space-y-4">
              <!-- Location detection button -->
              <button
                @click="getLocationAndPLZ"
                :disabled="isGettingLocation"
                class="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <UIcon 
                  :name="isGettingLocation ? 'i-heroicons-arrow-path' : 'i-heroicons-map-pin'" 
                  :class="['w-5 h-5', isGettingLocation && 'animate-spin']" 
                />
                {{ isGettingLocation ? 'Ermittle Standort...' : 'Standort automatisch ermitteln' }}
              </button>
              
              <!-- Error message -->
              <div v-if="locationError" class="text-red-300 text-sm bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                {{ locationError }}
              </div>
              
              <!-- Divider -->
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-white/20"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="bg-gray-900 px-2 text-blue-200/60">oder</span>
                </div>
              </div>
              
              <!-- Manual input -->
              <input
                :value="formData.location"
                @input="(e) => onboardingStore.updateFormData({ location: e.target.value })"
                placeholder="z.B. 10115"
                pattern="[0-9]{5}"
                maxlength="5"
                @keyup.enter="canProceed && nextStep()"
                class="w-full px-4 py-4 text-lg text-center bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <!-- Search radius -->
              <div>
                <label class="block text-sm text-blue-100/80 mb-3">Wie weit würdest du fahren?</label>
                <div class="grid grid-cols-5 gap-2">
                  <div
                    v-for="option in [{ label: '5 km', value: 5 }, { label: '10 km', value: 10 }, { label: '25 km', value: 25 }, { label: '50 km', value: 50 }, { label: '100+ km', value: 100 }]"
                    :key="option.value"
                    @click="onboardingStore.updateFormData({ searchRadius: option.value })"
                    :class="[
                      'cursor-pointer p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105',
                      formData.searchRadius === option.value
                        ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                        : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                    ]"
                  >
                    <div class="flex items-center justify-center">
                      <span class="text-white font-medium text-xs">{{ option.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </template>

      <template #struggles>
        <!-- Struggles Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-white">Womit kämpfst du? 💙</h2>
            <p class="text-blue-100/80 text-sm">Komplett optional - hilft uns bei der Suche</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div
              v-for="option in struggleOptions"
              :key="option.value"
              @click="toggleStruggle(option.value, !formData.struggles.includes(option.value))"
              :class="[
                'cursor-pointer p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105',
                formData.struggles.includes(option.value)
                  ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
              ]"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ option.emoji }}</span>
                <span class="text-white font-medium text-sm flex-1">{{ option.label }}</span>
                <UIcon 
                  v-if="formData.struggles.includes(option.value)"
                  name="i-heroicons-check-circle"
                  class="w-4 h-4 text-blue-400"
                />
              </div>
            </div>
          </div>
        </div>

      </template>

      <template #preferences>
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-white">Therapie-Präferenzen ⚙️</h2>
            <p class="text-blue-100/80 text-sm">Auch optional - aber kann die Suche eingrenzen</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <!-- Gender preference -->
            <div>
              <label class="block text-sm font-medium text-blue-100/90 mb-3">Therapeut*in Geschlecht</label>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="option in genderOptions"
                  :key="option.value"
                  @click="onboardingStore.updateFormData({ therapistGender: option.value })"
                  :class="[
                    'cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105',
                    formData.therapistGender === option.value
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-white font-medium text-xs leading-tight">{{ option.label }}</span>
                    <UIcon 
                      v-if="formData.therapistGender === option.value"
                      name="i-heroicons-check-circle"
                      class="w-4 h-4 text-blue-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent therapy -->
            <div>
              <label class="block text-sm font-medium text-blue-100/90 mb-3">Hattest du in den letzten 2 Jahren eine ambulante Psychotherapie?</label>
              <div class="grid grid-cols-2 gap-2">
                <div
                  @click="() => onboardingStore.updateFormData({ hadRecentTherapy: false })"
                  :class="[
                    'cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105',
                    formData.hadRecentTherapy === false
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-white font-medium text-xs">Nein</span>
                    <UIcon 
                      v-if="formData.hadRecentTherapy === false"
                      name="i-heroicons-check-circle"
                      class="w-4 h-4 text-blue-400"
                    />
                  </div>
                </div>
                <div
                  @click="() => onboardingStore.updateFormData({ hadRecentTherapy: true })"
                  :class="[
                    'cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105',
                    formData.hadRecentTherapy === true
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-white font-medium text-xs">Ja</span>
                    <UIcon 
                      v-if="formData.hadRecentTherapy === true"
                      name="i-heroicons-check-circle"
                      class="w-4 h-4 text-blue-400"
                    />
                  </div>
                </div>
              </div>
              <p class="text-xs text-blue-200/60 mt-2">Bei Ja ist noch ein Gutachten nötig, aber darum kümmert sich die Therapeut*in</p>
            </div>
          </div>

          <!-- Therapy method -->
          <div class="max-w-2xl mx-auto">
            <label class="block text-sm font-medium text-blue-100/90 mb-3">Therapie-Verfahren (Mehrfachauswahl)</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="option in therapyMethodOptions"
                :key="option.value"
                @click="toggleTherapyMethod(option.value, !formData.therapyMethods.includes(option.value))"
                :class="[
                  'cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 min-h-[3rem]',
                  formData.therapyMethods.includes(option.value)
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="text-white font-medium text-xs leading-tight">{{ option.label }}</span>
                  <UIcon 
                    v-if="formData.therapyMethods.includes(option.value)"
                    name="i-heroicons-check-circle"
                    class="w-4 h-4 text-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
  

      <template #complete>
        <!-- Complete Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-4">
            <div class="text-6xl">🎉</div>
            <h2 class="text-2xl font-bold text-white">KARL ist startklar!</h2>
            <p class="text-blue-100/80">
              <span v-if="!formData.skipNickname && formData.nickname">
                Perfekt{{ formData.nickname ? `, ${formData.nickname}` : '' }}! 
              </span>
              Jetzt können wir mit der Therapieplatz-Jagd beginnen.
            </p>
          </div>
          
          <!-- Summary -->
          <div class="bg-white/5 rounded-xl p-4 max-w-md mx-auto text-sm text-left">
            <h3 class="font-semibold text-blue-200 mb-2">Deine Angaben:</h3>
            <ul class="space-y-1 text-blue-100/80">
              <li v-if="!formData.skipNickname && formData.nickname">👋 Name: {{ formData.nickname }}</li>
              <li>🎂 Alter: {{ formData.isAdult ? 'Über 21' : 'Unter 21' }}</li>
              <li>📍 Standort: {{ formData.location }} ({{ formData.searchRadius }}km Radius)</li>
              <li v-if="formData.struggles.length">💙 Probleme: {{ formData.struggles.length }} ausgewählt</li>
              <li v-if="formData.therapistGender !== 'egal'">👤 Geschlecht: {{ genderOptions.find(o => o.value === formData.therapistGender)?.label }}</li>
              <li v-if="formData.therapyMethods.length">🧠 Verfahren: {{ formData.therapyMethods.map(m => therapyMethodOptions.find(o => o.value === m)?.label).join(', ') }}</li>
              <li v-if="formData.hadRecentTherapy !== null">🕒 Letzte Therapie: {{ formData.hadRecentTherapy ? 'Innerhalb 2 Jahre' : 'Länger her/Nie' }}</li>
            </ul>
          </div>
          
          <!-- Info about data management -->
          <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-md mx-auto text-sm">
            <p class="text-blue-200/90 text-center">
              💡 <strong>Tipp:</strong> Du kannst deine Daten jederzeit ändern mit dem Zurück-Knopf. <br><br> In den Einstellungen (⚙️ oben rechts) kannst du sie exportieren und importieren.
            </p>
          </div>

          <div class="flex gap-4 items-center justify-center">
            <UButton
              @click="prevStep"
              variant="ghost"
              color="white"
              icon="i-heroicons-arrow-left"
              size="lg"
            >
              Zurück
            </UButton>
            
            <UButton
              @click="completeOnboarding"
              size="xl"
              color="primary"
              class="font-semibold"
            >
              Therapie-Jagd starten! 🚀
            </UButton>
          </div>
        </div>
      </template>
    </UStepper>

    <!-- Navigation -->
    <div class="flex justify-between w-full mt-8" v-if="currentStep < items.length - 1">
      <UButton
        @click="prevStep"
        variant="ghost"
        color="white"
        icon="i-heroicons-arrow-left"
      >
        {{ currentStep === 0 ? 'Nächste Schritte' : 'Zurück' }}
      </UButton>
      
      <UButton
        :disabled="!canProceed"
        @click="nextStep"
        color="primary"
        trailing-icon="i-heroicons-arrow-right"
      >
        {{ currentStep === items.length - 2 ? 'Fertig!' : 'Weiter' }}
      </UButton>
    </div>
    </div>
    </div>
  </PageCard>
</template>