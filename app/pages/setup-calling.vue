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
            📞
          </div>
          <h1 class="text-2xl font-bold text-white">KARL Anrufdienst einrichten 🔧</h1>
          <p class="text-blue-100/80 text-sm">Alle Angaben sind erforderlich für den automatischen Anruf</p>
        </div>

        <!-- Stepper -->
        <UStepper 
          ref="stepper"
          :model-value="currentStep"
          @update:model-value="(value) => setCurrentStep(value)"
          :items="setupSteps" 
          color="primary"
          size="sm"
          class="w-full max-w-4xl mx-auto"
          orientation="horizontal"
        >
        <!-- Step 1: Patient Information -->
        <template #patient-info>
          <div class="w-full max-w-md mx-auto space-y-4">
            <div class="text-center mb-6">
              <h2 class="text-xl font-semibold text-white mb-2">Patienteninformationen</h2>
              <p class="text-blue-100/70 text-sm">Gib die Daten für den Anruf bei der 116117 ein</p>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-blue-100/80 mb-2">Vollständiger Name</label>
                <UInput 
                  v-model="formData.patient_name" 
                  placeholder="z.B. Max Mustermann"
                  color="primary"
                  variant="outline"
                  size="lg"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-blue-100/80 mb-2">Geburtsdatum</label>
                <UInput 
                  v-model="formData.patient_dob" 
                  type="date"
                  color="primary"
                  variant="outline"
                  size="lg"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-blue-100/80 mb-2">Krankenversicherung</label>
                <UInput 
                  v-model="formData.patient_insurance" 
                  placeholder="z.B. AOK Bayern"
                  color="primary"
                  variant="outline"
                  size="lg"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-blue-100/80 mb-2">Telefonnummer</label>
                <UInput 
                  v-model="formData.patient_phone" 
                  placeholder="z.B. +49 123 456789"
                  color="primary"
                  variant="outline"
                  size="lg"
                  class="w-full"
                />
                <p class="text-xs text-blue-200/60 mt-1">Diese Nummer wird für Rückfragen verwendet</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-blue-100/80 mb-2">Adresse</label>
                <UInput 
                  v-model="formData.patient_address" 
                  placeholder="z.B. Musterstraße 123"
                  color="primary"
                  variant="outline"
                  size="lg"
                  class="w-full"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">PLZ</label>
                  <UInput 
                    v-model="formData.patient_postal_code" 
                    placeholder="12345"
                    color="primary"
                    variant="outline"
                    size="lg"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Stadt</label>
                  <UInput 
                    v-model="formData.patient_city" 
                    placeholder="z.B. München"
                    color="primary"
                    variant="outline"
                    size="lg"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 2: Consent -->
        <template #consent>
          <div class="w-full max-w-md mx-auto space-y-4">
            <div class="text-center mb-6">
              <h2 class="text-xl font-semibold text-white mb-2">Einverständniserklärung</h2>
              <p class="text-blue-100/70 text-sm">Bitte lies und bestätige die Nutzungsbedingungen</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
              <div class="space-y-3 text-sm text-blue-100/80">
                <p class="font-medium text-white">Ich bestätige, dass:</p>
                <ul class="space-y-2 list-disc list-inside">
                  <li>KARL als KI-Assistent in meinem Namen bei der 116117 anruft</li>
                  <li>Alle angegebenen Daten korrekt und vollständig sind</li>
                  <li>Ich eine Aufnahme meiner Stimme zur Bestätigung aufnehme</li>
                  <li>Die Aufnahme nach der Verwendung oder spätestens nach 7 Tagen gelöscht wird</li>
                  <li>Ich über 18 Jahre alt bin oder die Einverständniserklärung der Erziehungsberechtigten vorliegt</li>
                </ul>
              </div>
              
              <div class="flex items-center space-x-3">
                <UCheckbox 
                  v-model="formData.consent_given" 
                  color="primary"
                  size="lg"
                />
                <label class="text-sm text-blue-100/80">
                  Ich stimme allen Punkten zu und erteile KARL die Erlaubnis, in meinem Namen anzurufen
                </label>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 3: Voice Recording -->
        <template #voice-recording>
          <div class="w-full max-w-md mx-auto space-y-4">
            <div class="text-center mb-6">
              <h2 class="text-xl font-semibold text-white mb-2">Stimmaufnahme</h2>
              <p class="text-blue-100/70 text-sm">Nimm eine kurze Bestätigung auf</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
              <div class="text-center space-y-2">
                <p class="text-sm text-blue-100/80">Bitte sprich folgenden Text:</p>
                <div class="bg-white/5 rounded-lg p-3">
                  <p class="text-white font-medium text-sm">
                    "Ich bin {{ formData.patient_name }} und bestätige, dass KARL in meinem Namen bei der 116117 anrufen darf, um einen Termin für eine psychotherapeutische Sprechstunde zu vereinbaren."
                  </p>
                </div>
              </div>
              
              <div class="flex flex-col items-center space-y-4">
                <div class="flex items-center space-x-4">
                  <UButton 
                    @click="startRecording" 
                    :disabled="isRecording || hasRecording"
                    color="red"
                    size="lg"
                    :loading="isRecording"
                  >
                    <UIcon name="i-heroicons-microphone" class="w-5 h-5 mr-2" />
                    {{ isRecording ? 'Aufnahme läuft...' : 'Aufnahme starten' }}
                  </UButton>
                  
                  <UButton 
                    v-if="isRecording"
                    @click="stopMicrophoneRecording"
                    color="gray"
                    size="lg"
                  >
                    <UIcon name="i-heroicons-stop" class="w-5 h-5 mr-2" />
                    Stopp
                  </UButton>
                </div>
                
                <div v-if="hasRecording" class="flex items-center space-x-4">
                  <UButton 
                    v-if="!isPlaying" 
                    @click="playRecording" 
                    color="blue" 
                    size="sm"
                  >
                    <UIcon name="i-heroicons-play" class="w-4 h-4 mr-1" />
                    Abspielen
                  </UButton>
                  
                  <UButton 
                    v-if="isPlaying && !isPaused" 
                    @click="pauseRecording" 
                    color="yellow" 
                    size="sm"
                  >
                    <UIcon name="i-heroicons-pause" class="w-4 h-4 mr-1" />
                    Pause
                  </UButton>
                  
                  <UButton 
                    v-if="isPlaying && isPaused" 
                    @click="resumeRecording" 
                    color="blue" 
                    size="sm"
                  >
                    <UIcon name="i-heroicons-play" class="w-4 h-4 mr-1" />
                    Fortsetzen
                  </UButton>
                  
                  <UButton 
                    v-if="isPlaying" 
                    @click="stopPlayback" 
                    color="red" 
                    size="sm"
                  >
                    <UIcon name="i-heroicons-stop" class="w-4 h-4 mr-1" />
                    Stopp
                  </UButton>
                  
                  <UButton 
                    @click="deleteRecording" 
                    color="red" 
                    variant="ghost" 
                    size="sm"
                    :disabled="isPlaying"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
                    Neu aufnehmen
                  </UButton>
                </div>
                
                <div v-if="recordingError" class="text-red-400 text-sm">
                  {{ recordingError }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 4: Schedule Call -->
        <template #schedule>
          <div class="w-full max-w-md mx-auto space-y-4">
            <div class="text-center mb-6">
              <h2 class="text-xl font-semibold text-white mb-2">Anruf planen</h2>
              <p class="text-blue-100/70 text-sm">Wähle, wann KARL anrufen soll</p>
            </div>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <UButton 
                  @click="formData.call_timing = 'now'"
                  :variant="formData.call_timing === 'now' ? 'solid' : 'outline'"
                  color="primary"
                  size="lg"
                  class="h-20 flex flex-col items-center justify-center"
                >
                  <UIcon name="i-heroicons-phone" class="w-6 h-6 mb-2" />
                  <span class="text-sm">Sofort</span>
                </UButton>
                
                <UButton 
                  @click="formData.call_timing = 'scheduled'"
                  :variant="formData.call_timing === 'scheduled' ? 'solid' : 'outline'"
                  color="primary"
                  size="lg"
                  class="h-20 flex flex-col items-center justify-center"
                >
                  <UIcon name="i-heroicons-calendar" class="w-6 h-6 mb-2" />
                  <span class="text-sm">Terminiert</span>
                </UButton>
              </div>
              
              <div v-if="formData.call_timing === 'scheduled'" class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Datum</label>
                  <UInput 
                    v-model="formData.scheduled_date" 
                    type="date"
                    color="primary"
                    variant="outline"
                    size="lg"
                    class="w-full"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-blue-100/80 mb-2">Uhrzeit</label>
                  <UInput 
                    v-model="formData.scheduled_time" 
                    type="time"
                    color="primary"
                    variant="outline"
                    size="lg"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 5: Confirmation -->
        <template #confirmation>
          <div class="w-full max-w-md mx-auto space-y-4">
            <div class="text-center mb-6">
              <h2 class="text-xl font-semibold text-white mb-2">Zusammenfassung</h2>
              <p class="text-blue-100/70 text-sm">Überprüfe deine Angaben</p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-blue-100/80">Patient:</span>
                  <span class="text-white font-medium">{{ formData.patient_name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-100/80">Geburtsdatum:</span>
                  <span class="text-white font-medium">{{ formData.patient_dob }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-100/80">Versicherung:</span>
                  <span class="text-white font-medium">{{ formData.patient_insurance }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-100/80">Telefon:</span>
                  <span class="text-white font-medium">{{ formData.patient_phone }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-100/80">Adresse:</span>
                  <span class="text-white font-medium">{{ formData.patient_address }}, {{ formData.patient_postal_code }} {{ formData.patient_city }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-100/80">Anruf:</span>
                  <span class="text-white font-medium">
                    {{ formData.call_timing === 'now' ? 'Sofort' : `${formData.scheduled_date} um ${formData.scheduled_time}` }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-100/80">Stimmaufnahme:</span>
                  <span class="text-green-400 font-medium">{{ callSetupStore.hasVoiceRecording() ? 'Verfügbar' : 'Fehlt' }}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-white/5 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 mb-4">
              <h4 class="text-white font-medium mb-2 flex items-center">
                <UIcon name="i-heroicons-information-circle" class="w-5 h-5 mr-2 text-blue-400" />
                Was passiert nach dem Beauftragen?
              </h4>
              <ul class="text-sm text-blue-100/80 space-y-1 list-disc list-inside">
                <li>Deine Daten werden sicher gespeichert</li>
                <li>KARL wird {{ formData.call_timing === 'now' ? 'in 5 Minuten' : `am ${formData.scheduled_date} um ${formData.scheduled_time}` }} anrufen</li>
                <li>Der Anruf erfolgt bei der 116117 in deinem Namen</li>
                <li>Deine Sprachaufnahme wird automatisch nach dem Anruf gelöscht</li>
                <li>Du erhältst das Ergebnis per E-Mail (falls verfügbar)</li>
              </ul>
            </div>
            
            <div class="text-center">
              <UButton 
                @click="submitCallSetup" 
                :disabled="!canSubmit || isSubmitting"
                :loading="isSubmitting"
                color="primary"
                size="lg"
                class="w-full transition-all duration-200 hover:scale-105"
              >
                <UIcon name="i-heroicons-phone" class="w-5 h-5 mr-2" />
                {{ isSubmitting ? 'Wird beauftragt...' : 'Anruf beauftragen' }}
              </UButton>
            </div>
          </div>
        </template>
      </UStepper>

        <!-- Navigation -->
        <div class="flex justify-between w-full max-w-4xl mt-8">
          <UButton 
            @click="prevStep" 
            variant="ghost" 
            color="white"
            size="lg"
            class="transition-all duration-200 hover:scale-105"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 mr-2" />
            Zurück
          </UButton>
          
          <UButton 
            v-if="currentStep < setupSteps.length - 1"
            @click="nextStep" 
            :disabled="!canProceed"
            color="primary"
            size="lg"
            class="transition-all duration-200 hover:scale-105"
          >
            Weiter
            <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 ml-2" />
          </UButton>
        </div>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useCallSetupStore } from '~/stores/callSetup'

// Page meta and auth
definePageMeta({
  title: 'Call Setup - KARL',
  middleware: ['admin-auth'] // Will need to create this middleware
})

// Store
const callSetupStore = useCallSetupStore()

// Reactive references
const stepper = ref()
const currentStep = ref(0)
const isSubmitting = ref(false)
const isLoading = ref(true)
const toast = useToast()

// Voice recording
const isRecording = ref(false)
const recordingError = ref('')
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])

// Voice recording state from store
const hasRecording = computed(() => callSetupStore.hasVoiceRecording())
const audioBlob = computed(() => callSetupStore.getVoiceRecordingBlob())

// Voice playback
const isPlaying = ref(false)
const isPaused = ref(false)
const currentAudio = ref<HTMLAudioElement | null>(null)

// Form data from store
const formData = computed(() => callSetupStore.formData)

// Stepper configuration
const setupSteps = ref([
  {
    slot: 'patient-info',
    title: 'Patientendaten',
    description: 'Persönliche Informationen',
    icon: 'i-heroicons-user'
  },
  {
    slot: 'consent',
    title: 'Einverständnis',
    description: 'Zustimmung zur Nutzung',
    icon: 'i-heroicons-check-circle'
  },
  {
    slot: 'voice-recording',
    title: 'Sprachaufnahme',
    description: 'Bestätigung aufnehmen',
    icon: 'i-heroicons-microphone'
  },
  {
    slot: 'schedule',
    title: 'Zeitplanung',
    description: 'Anruf terminieren',
    icon: 'i-heroicons-calendar'
  },
  {
    slot: 'confirmation',
    title: 'Bestätigung',
    description: 'Angaben überprüfen',
    icon: 'i-heroicons-paper-airplane'
  }
])

// Validation logic
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: // Patient info
      return formData.value.patient_name && 
             formData.value.patient_dob && 
             formData.value.patient_insurance && 
             formData.value.patient_phone && 
             formData.value.patient_address && 
             formData.value.patient_postal_code && 
             formData.value.patient_city
    case 1: // Consent
      return formData.value.consent_given
    case 2: // Voice recording
      return callSetupStore.hasVoiceRecording()
    case 3: // Schedule
      return formData.value.call_timing && 
             (formData.value.call_timing === 'now' || 
              (formData.value.scheduled_date && formData.value.scheduled_time))
    case 4: // Confirmation
      return true
    default:
      return false
  }
})

const canSubmit = computed(() => {
  return formData.value.patient_name && 
         formData.value.patient_phone && 
         formData.value.consent_given && 
         callSetupStore.hasVoiceRecording() && 
         formData.value.call_timing
})

// Navigation functions
const setCurrentStep = (step: number) => {
  currentStep.value = step
  callSetupStore.setCurrentStep(step)
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < setupSteps.value.length - 1) {
    setCurrentStep(currentStep.value + 1)
  }
}

const prevStep = () => {
  if (currentStep.value === 0) {
    navigateTo('/admin')
  } else {
    setCurrentStep(currentStep.value - 1)
  }
}

// Voice recording functions
const startRecording = async () => {
  try {
    recordingError.value = ''
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    mediaRecorder.value = new MediaRecorder(stream)
    recordedChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = async () => {
      const audioBlob = new Blob(recordedChunks.value, { type: 'audio/wav' })
      
      // Save to store (persists to localStorage)
      await callSetupStore.saveVoiceRecording(audioBlob)
      
      // Stop all audio tracks
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.value.start()
    isRecording.value = true
    
    setTimeout(() => {
      if (isRecording.value) {
        stopMicrophoneRecording()
      }
    }, 30000) // Auto-stop after 30 seconds
    
  } catch (error) {
    recordingError.value = 'Mikrofon-Zugriff verweigert oder nicht verfügbar'
    console.error('Recording error:', error)
  }
}

const stopMicrophoneRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
  }
}

const playRecording = () => {
  if (audioBlob.value) {
    // Stop any currently playing audio
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value.currentTime = 0
    }
    
    currentAudio.value = new Audio(URL.createObjectURL(audioBlob.value))
    isPlaying.value = true
    isPaused.value = false
    
    currentAudio.value.addEventListener('ended', () => {
      isPlaying.value = false
      isPaused.value = false
      currentAudio.value = null
    })
    
    currentAudio.value.addEventListener('error', () => {
      isPlaying.value = false
      isPaused.value = false
      currentAudio.value = null
      recordingError.value = 'Fehler beim Abspielen der Aufnahme'
    })
    
    currentAudio.value.play()
  }
}

const pauseRecording = () => {
  if (currentAudio.value && isPlaying.value) {
    currentAudio.value.pause()
    isPaused.value = true
  }
}

const resumeRecording = () => {
  if (currentAudio.value && isPlaying.value && isPaused.value) {
    currentAudio.value.play()
    isPaused.value = false
  }
}

const stopPlayback = () => {
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
    isPlaying.value = false
    isPaused.value = false
    currentAudio.value = null
  }
}

const deleteRecording = () => {
  // Stop playback if currently playing
  stopPlayback()
  
  // Clear from store (removes from localStorage)
  callSetupStore.clearVoiceRecording()
  recordedChunks.value = []
}

// Submit function
const submitCallSetup = async () => {
  if (!canSubmit.value) return
  
  try {
    isSubmitting.value = true
    
    // Create FormData with audio
    const formDataToSend = new FormData()
    formDataToSend.append('patient_name', formData.value.patient_name)
    formDataToSend.append('patient_dob', formData.value.patient_dob)
    formDataToSend.append('patient_insurance', formData.value.patient_insurance)
    formDataToSend.append('patient_phone', formData.value.patient_phone)
    formDataToSend.append('patient_address', formData.value.patient_address)
    formDataToSend.append('patient_postal_code', formData.value.patient_postal_code)
    formDataToSend.append('patient_city', formData.value.patient_city)
    formDataToSend.append('call_timing', formData.value.call_timing)
    
    if (formData.value.call_timing === 'scheduled') {
      formDataToSend.append('scheduled_date', formData.value.scheduled_date)
      formDataToSend.append('scheduled_time', formData.value.scheduled_time)
    }
    
    const voiceBlob = callSetupStore.getVoiceRecordingBlob()
    if (voiceBlob) {
      formDataToSend.append('voice_recording', voiceBlob, formData.value.voice_recording_filename || 'consent.wav')
    }
    
    // Get session ID for authentication
    const sessionId = localStorage.getItem('patreon_debug_session')
    if (!sessionId) {
      throw new Error('No admin session found')
    }

    const response = await $fetch('/api/admin/call-setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`
      },
      body: formDataToSend
    })
    
    toast.add({
      title: 'Anruf erfolgreich beauftragt',
      description: 'KARL wird dich in Kürze anrufen',
      color: 'green'
    })
    
    // Clear form and redirect
    callSetupStore.clearForm()
    navigateTo('/admin')
    
  } catch (error) {
    console.error('Submit error:', error)
    toast.add({
      title: 'Fehler beim Beauftragen',
      description: 'Bitte versuche es erneut',
      color: 'red'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Initialize store
onMounted(() => {
  currentStep.value = callSetupStore.currentStep
  nextTick(() => {
    isLoading.value = false
  })
})
</script>