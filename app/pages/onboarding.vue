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
  { value: 'egal', label: 'Egal / Lass mich beraten' },
  { value: 'verhaltenstherapie', label: 'Verhaltenstherapie' },
  { value: 'tiefenpsychologie', label: 'Tiefenpsychologisches Verfahren' },
  { value: 'gespraechstherapie', label: 'Gesprächstherapie' }
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
    case 2: return formData.value.location.trim().length > 0
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

const completeOnboarding = () => {
  onboardingStore.completeOnboarding()
  console.log('Onboarding completed:', formData.value)
  navigateTo('/app')
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
      class="w-full"
      orientation="horizontal"
    >
      <template #greeting>
        <!-- Greeting Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-white">Hi! Ich bin KARL 👋</h2>
            <p class="text-blue-100/80">Wie soll ich dich nennen?</p>
            <p class="text-xs text-blue-200/60">Nur ein Spitzname - wenn wir später echte Daten brauchen, fragen wir nochmal!</p>
          </div>
          
          <div class="space-y-4">
            <UInput
              :model-value="formData.nickname"
              @update:model-value="(value) => onboardingStore.updateFormData({ nickname: value })"
              placeholder="Dein Spitzname..."
              :disabled="formData.skipNickname"
              class="max-w-xs mx-auto"
              @keyup.enter="nextStep"
            />
            
            <UButton
              :variant="formData.skipNickname ? 'solid' : 'outline'"
              color="gray"
              size="sm"
              @click="() => { 
                const newValue = !formData.skipNickname;
                onboardingStore.updateFormData({ skipNickname: newValue }); 
                if (newValue) {
                  onboardingStore.updateFormData({ nickname: '' });
                  nextStep();
                }
              }"
              class="mx-auto"
            >
              Ohne Spitzname weitermachen
            </UButton>
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
          
          <div class="flex gap-4 justify-center">
            <UButton
              :variant="formData.isAdult === true ? 'solid' : 'outline'"
              color="primary"
              @click="() => { onboardingStore.updateFormData({ isAdult: true }); nextStep() }"
              size="lg"
            >
              Über 21 🧑‍🎓
            </UButton>
            <UButton
              :variant="formData.isAdult === false ? 'solid' : 'outline'"
              color="primary"
              @click="() => { onboardingStore.updateFormData({ isAdult: false }); nextStep() }"
              size="lg"
            >
              Unter 21 🎒
            </UButton>
          </div>
        </div>

      </template>

      <template #location>
        <!-- Location Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-white">Wo suchst du? 📍</h2>
            <p class="text-blue-100/80">PLZ oder Stadt eingeben</p>
          </div>
          
          <div class="space-y-4 max-w-sm mx-auto">
            <UInput
              :model-value="formData.location"
              @update:model-value="(value) => onboardingStore.updateFormData({ location: value })"
              placeholder="z.B. 10115 oder Berlin"
              icon="i-heroicons-map-pin"
              @keyup.enter="nextStep"
            />
            
            <div>
              <label class="block text-sm text-blue-100/80 mb-2">Wie weit würdest du fahren?</label>
              <div class="grid grid-cols-3 gap-2">
                <UButton
                  v-for="option in [{ label: '5 km', value: 5 }, { label: '10 km', value: 10 }, { label: '25 km', value: 25 }, { label: '50 km', value: 50 }, { label: '100+ km', value: 100 }]"
                  :key="option.value"
                  :variant="formData.searchRadius === option.value ? 'solid' : 'outline'"
                  :color="formData.searchRadius === option.value ? 'primary' : 'white'"
                  size="sm"
                  @click="onboardingStore.updateFormData({ searchRadius: option.value })"
                  class="text-xs"
                >
                  {{ option.label }}
                </UButton>
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
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
            <UCheckbox
              v-for="option in struggleOptions"
              :key="option.value"
              :model-value="formData.struggles.includes(option.value)"
              @update:model-value="(checked) => toggleStruggle(option.value, checked)"
              :label="`${option.emoji} ${option.label}`"
              class="text-left"
            />
          </div>
        </div>

      </template>

      <template #preferences>
        <!-- Preferences Step -->
        <div class="space-y-6 text-center">
          <div class="space-y-2">
            <h2 class="text-xl font-semibold text-white">Therapie-Präferenzen ⚙️</h2>
            <p class="text-blue-100/80 text-sm">Auch optional - aber kann die Suche eingrenzen</p>
          </div>
          
          <div class="space-y-6 max-w-md mx-auto">
            <!-- Gender preference -->
            <div>
              <label class="block text-sm font-medium text-blue-100/90 mb-2">Therapeut*in Geschlecht</label>
              <div class="grid grid-cols-2 gap-2">
                <UButton
                  v-for="option in genderOptions"
                  :key="option.value"
                  :variant="formData.therapistGender === option.value ? 'solid' : 'outline'"
                  :color="formData.therapistGender === option.value ? 'primary' : 'white'"
                  size="sm"
                  @click="onboardingStore.updateFormData({ therapistGender: option.value })"
                  class="text-xs"
                >
                  {{ option.label }}
                </UButton>
              </div>
            </div>

            <!-- Therapy method -->
            <div>
              <label class="block text-sm font-medium text-blue-100/90 mb-2">Therapie-Verfahren</label>
              <div class="grid grid-cols-1 gap-2">
                <UButton
                  v-for="option in therapyMethodOptions"
                  :key="option.value"
                  :variant="formData.therapyMethod === option.value ? 'solid' : 'outline'"
                  :color="formData.therapyMethod === option.value ? 'primary' : 'white'"
                  size="sm"
                  @click="onboardingStore.updateFormData({ therapyMethod: option.value })"
                  class="text-xs"
                >
                  {{ option.label }}
                </UButton>
              </div>
            </div>

            <!-- Recent therapy -->
            <div>
              <label class="block text-sm font-medium text-blue-100/90 mb-2">Hattest du in den letzten 2 Jahren eine ambulante Psychotherapie?</label>
              <div class="flex gap-4 justify-center">
                <UButton
                  :variant="formData.hadRecentTherapy === false ? 'solid' : 'outline'"
                  color="primary"
                  @click="() => onboardingStore.updateFormData({ hadRecentTherapy: false })"
                  size="sm"
                >
                  Nein
                </UButton>
                <UButton
                  :variant="formData.hadRecentTherapy === true ? 'solid' : 'outline'"
                  color="primary"
                  @click="() => onboardingStore.updateFormData({ hadRecentTherapy: true })"
                  size="sm"
                >
                  Ja
                </UButton>
              </div>
              <p class="text-xs text-blue-200/60 mt-2">Bei Ja ist noch ein Gutachten nötig, aber darum kümmert sich die Therapeut*in</p>
            </div>

            <!-- Payment type -->
            <div>
              <label class="block text-sm font-medium text-blue-100/90 mb-2">Kassensitz oder Kostenerstattung?</label>
              <div class="grid grid-cols-1 gap-2">
                <UButton
                  v-for="option in paymentOptions"
                  :key="option.value"
                  :variant="formData.paymentType === option.value ? 'solid' : 'outline'"
                  :color="formData.paymentType === option.value ? 'primary' : 'white'"
                  size="sm"
                  @click="onboardingStore.updateFormData({ paymentType: option.value })"
                  class="text-xs"
                >
                  {{ option.label }}
                </UButton>
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
              <li v-if="formData.therapyMethod !== 'egal'">🧠 Verfahren: {{ therapyMethodOptions.find(o => o.value === formData.therapyMethod)?.label }}</li>
              <li v-if="formData.hadRecentTherapy !== null">🕒 Letzte Therapie: {{ formData.hadRecentTherapy ? 'Innerhalb 2 Jahre' : 'Länger her/Nie' }}</li>
            </ul>
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
        {{ currentStep === 0 ? 'Startseite' : 'Zurück' }}
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