<template>
  <div class="space-y-6">
    <!-- Header with Test Settings -->
    <div class="flex justify-between items-start gap-4">
      <div>
        <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <UIcon name="i-heroicons-queue-list" class="w-5 h-5 text-purple-400" />
          Call Setup Queue
        </h3>
        <p class="text-purple-200/70 text-sm">Manage call configurations and test call functionality</p>
      </div>
      
      <!-- Call Settings -->
      <div class="bg-white/5 border border-white/10 rounded-xl p-4 min-w-80">
        <h4 class="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
          Call Settings
        </h4>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-purple-200/70 mb-1">Target Phone Number</label>
            <UInput
              v-model="targetPhoneNumber"
              placeholder="+49 116117 (or your test number)"
              size="sm"
              :ui="{ 
                base: 'bg-white/10 border-white/20 text-white placeholder-purple-200/50',
                icon: { base: 'text-purple-300' }
              }"
            />
            <p class="text-xs text-purple-200/60 mt-1">Use +49116117 for production or your number for testing</p>
          </div>
          
          <div>
            <label class="block text-xs text-purple-200/70 mb-1">ElevenLabs Agent ID</label>
            <UInput
              v-model="agentId"
              placeholder="agent_xxx"
              size="sm"
              :ui="{ 
                base: 'bg-white/10 border-white/20 text-white placeholder-purple-200/50',
                icon: { base: 'text-purple-300' }
              }"
            />
          </div>
          
          <div>
            <label class="block text-xs text-purple-200/70 mb-1">ElevenLabs Phone Number ID</label>
            <UInput
              v-model="phoneNumberId"
              placeholder="pn_xxx"
              size="sm"
              :ui="{ 
                base: 'bg-white/10 border-white/20 text-white placeholder-purple-200/50',
                icon: { base: 'text-purple-300' }
              }"
            />
          </div>
          
          <UButton
            @click="saveCallSettings"
            size="sm"
            :loading="savingSettings"
            :disabled="!targetPhoneNumber.trim() || !agentId.trim() || !phoneNumberId.trim()"
            class="w-full justify-center"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
            Save Settings
          </UButton>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
      <p class="text-purple-200 text-sm">Loading call setups...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
      <p class="text-red-200 text-sm">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!pending && !error && !callSetups?.length" class="text-center py-12">
      <UIcon name="i-heroicons-phone-x-mark" class="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
      <h4 class="text-lg font-medium text-white mb-2">No Call Setups</h4>
      <p class="text-purple-200/70 mb-4">No call configurations have been created yet.</p>
      <NuxtLink to="/setup-calling" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-100 hover:text-white font-medium transition-all border border-green-400/30">
        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
        Create First Call Setup
      </NuxtLink>
    </div>

    <!-- Jobs Queue Section -->
    <div v-else class="space-y-6">
      <!-- Active Jobs -->
      <div v-if="jobs?.length" class="space-y-4">
        <h4 class="text-md font-semibold text-white mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="w-4 h-4 text-blue-400" />
          Active Jobs ({{ jobs.length }})
        </h4>
        <div
          v-for="job in jobs"
          :key="job.id"
          class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <h5 class="text-white font-medium">{{ job.patient_data?.patient_name || 'Unknown Patient' }}</h5>
              <p class="text-sm text-blue-200/70">
                {{ job.type === 'test_call' ? 'Test Call' : 'Regular Call' }}
                <span v-if="job.testPhoneNumber" class="text-blue-300">→ {{ job.testPhoneNumber }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge :color="getJobStatusColor(job.status)" size="sm">
                {{ job.status }}
              </UBadge>
              <UBadge v-if="job.hasVoiceRecording" color="blue" size="sm">
                Voice
              </UBadge>
            </div>
          </div>
          <div class="text-xs text-blue-200/60">
            Scheduled: {{ formatDateTime(job.scheduledFor) }}
            <span class="ml-2">Created: {{ formatDateTime(job.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Call Setups List -->
      <div class="space-y-4">
        <h4 class="text-md font-semibold text-white mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-purple-400" />
          Call Configurations ({{ callSetups.length }})
        </h4>
        <div
          v-for="setup in callSetups"
          :key="setup.id"
          class="rounded-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all"
        >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="text-lg font-semibold text-white mb-1">{{ setup.patient_name }}</h4>
            <div class="flex items-center gap-4 text-sm text-purple-200/70">
              <span>DOB: {{ formatDate(setup.patient_dob) }}</span>
              <span>{{ setup.patient_insurance }}</span>
              <span>{{ setup.patient_phone }}</span>
              <span>{{ setup.patient_city }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge
              :color="getStatusColor(setup.status)"
              size="sm"
            >
              {{ setup.status }}
            </UBadge>
            <UBadge
              v-if="setup.hasVoiceRecording"
              color="blue"
              size="sm"
            >
              Voice Recording
            </UBadge>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-xs text-purple-200/70 mb-1">Address</p>
            <p class="text-white text-sm">{{ setup.patient_address }}</p>
            <p class="text-white text-sm">{{ setup.patient_postal_code }} {{ setup.patient_city }}</p>
          </div>
          <div>
            <p class="text-xs text-purple-200/70 mb-1">Call Timing</p>
            <p class="text-white text-sm">
              <span v-if="setup.call_timing === 'now'" class="text-green-400">Immediate (5min delay)</span>
              <span v-else class="text-blue-400">
                Scheduled: {{ formatDate(setup.scheduled_date) }} at {{ setup.scheduled_time }}
              </span>
            </p>
          </div>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-white/10">
          <div class="text-xs text-purple-200/60">
            Created: {{ formatDate(setup.createdAt) }} by {{ setup.createdBy }}
          </div>
          <div class="flex items-center gap-2">
            <UButton
              v-if="setup.hasVoiceRecording"
              @click="playVoiceRecording(setup.id)"
              size="sm"
              variant="soft"
              :loading="loadingVoice === setup.id"
            >
              <UIcon name="i-heroicons-speaker-wave" class="w-4 h-4 mr-1" />
              Play Recording
            </UButton>
            <UButton
              @click="initiateTestCall(setup)"
              size="sm"
              color="green"
              :disabled="!targetPhoneNumber.trim() || testingCall === setup.id"
              :loading="testingCall === setup.id"
            >
              <UIcon name="i-heroicons-phone" class="w-4 h-4 mr-1" />
              Test Call
            </UButton>
            <UButton
              @click="deleteCallSetup(setup.id)"
              size="sm"
              color="red"
              variant="soft"
              :loading="deletingSetup === setup.id"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
            </UButton>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Refresh Button -->
    <div class="text-center pt-4">
      <UButton
        @click="refreshCallSetups"
        variant="soft"
        :loading="refreshing"
      >
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Refresh
      </UButton>
    </div>

    <!-- Voice Recording Audio Player -->
    <audio ref="audioPlayer" class="hidden" @ended="loadingVoice = null"></audio>
  </div>
</template>

<script setup lang="ts">
interface CallSetup {
  id: string
  patient_name: string
  patient_dob: string
  patient_insurance: string
  patient_phone: string
  patient_address: string
  patient_postal_code: string
  patient_city: string
  call_timing: 'now' | 'scheduled'
  scheduled_date?: string
  scheduled_time?: string
  status: string
  createdAt: number
  createdBy: string
  hasVoiceRecording: boolean
}

interface Job {
  id: string
  type: string
  callSetupId?: string
  originalCallSetupId?: string
  testPhoneNumber?: string
  patient_data?: {
    patient_name: string
    patient_dob: string
    patient_insurance: string
    patient_address: string
    patient_postal_code: string
    patient_city: string
  }
  scheduledFor: number
  status: string
  createdAt: number
  hasVoiceRecording: boolean
}

const props = defineProps<{
  sessionId: string
}>()

// Reactive data
const callSetups = ref<CallSetup[]>([])
const jobs = ref<Job[]>([])
const targetPhoneNumber = ref('')
const agentId = ref('')
const phoneNumberId = ref('')
const pending = ref(false)
const error = ref<string | null>(null)
const refreshing = ref(false)
const savingSettings = ref(false)
const loadingVoice = ref<string | null>(null)
const testingCall = ref<string | null>(null)
const deletingSetup = ref<string | null>(null)
const audioPlayer = ref<HTMLAudioElement>()

// Load data on mount
onMounted(async () => {
  await loadCallSetups()
  await loadJobs()
  await loadCallSettings()
})

// Methods
const loadCallSetups = async () => {
  try {
    pending.value = true
    error.value = null
    
    console.log('Loading call setups with sessionId:', props.sessionId)
    
    const response = await $fetch('/api/admin/call-setups', {
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      }
    })
    
    console.log('Call setups response:', response)
    callSetups.value = response.callSetups || []
    console.log('Call setups loaded:', callSetups.value.length)
  } catch (err: any) {
    console.error('Failed to load call setups:', err)
    error.value = err.data?.message || 'Failed to load call setups'
  } finally {
    pending.value = false
  }
}

const loadCallSettings = async () => {
  try {
    const response = await $fetch('/api/admin/call-settings', {
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      }
    })
    targetPhoneNumber.value = response.targetPhoneNumber || ''
    agentId.value = response.agentId || ''
    phoneNumberId.value = response.phoneNumberId || ''
  } catch (err) {
    // Settings not set yet, ignore error
    console.log('No call settings configured yet')
  }
}

const saveCallSettings = async () => {
  try {
    savingSettings.value = true
    
    await $fetch('/api/admin/call-settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.sessionId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        targetPhoneNumber: targetPhoneNumber.value.trim(),
        agentId: agentId.value.trim(),
        phoneNumberId: phoneNumberId.value.trim()
      })
    })
    
    const toast = useToast()
    toast.add({
      title: 'Settings saved',
      description: 'Call settings have been configured',
      color: 'green',
      timeout: 3000
    })
  } catch (err: any) {
    console.error('Failed to save settings:', err)
    const toast = useToast()
    toast.add({
      title: 'Save failed',
      description: err.data?.message || 'Failed to save settings',
      color: 'red',
      timeout: 5000
    })
  } finally {
    savingSettings.value = false
  }
}

const loadJobs = async () => {
  try {
    const response = await $fetch('/api/admin/job-queue', {
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      }
    })
    
    jobs.value = response.jobs || []
  } catch (err) {
    console.error('Failed to load jobs:', err)
    // Don't set error here, jobs are optional
  }
}

const refreshCallSetups = async () => {
  refreshing.value = true
  await loadCallSetups()
  await loadJobs()
  refreshing.value = false
}

const playVoiceRecording = async (setupId: string) => {
  try {
    loadingVoice.value = setupId
    
    const response = await fetch(`/api/admin/voice-recording/${setupId}`, {
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to load recording')
    }
    
    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)
    
    if (audioPlayer.value) {
      audioPlayer.value.src = audioUrl
      await audioPlayer.value.play()
    }
  } catch (err: any) {
    console.error('Failed to play recording:', err)
    const toast = useToast()
    toast.add({
      title: 'Playback failed',
      description: 'Unable to play voice recording',
      color: 'red',
      timeout: 3000
    })
    loadingVoice.value = null
  }
}

const initiateTestCall = async (setup: CallSetup) => {
  try {
    testingCall.value = setup.id
    
    const response = await $fetch('/api/admin/test-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.sessionId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callSetupId: setup.id,
        testPhoneNumber: targetPhoneNumber.value.trim()
      })
    })
    
    const toast = useToast()
    toast.add({
      title: 'Test call initiated',
      description: `Batch call created: ${response.batchCallId}. Call will be made to ${targetPhoneNumber.value} using ${setup.patient_name}'s data`,
      color: 'green',
      timeout: 7000
    })
  } catch (err: any) {
    console.error('Failed to initiate test call:', err)
    const toast = useToast()
    toast.add({
      title: 'Test call failed',
      description: err.data?.message || 'Failed to initiate test call',
      color: 'red',
      timeout: 5000
    })
  } finally {
    testingCall.value = null
  }
}

const deleteCallSetup = async (setupId: string) => {
  try {
    deletingSetup.value = setupId
    
    await $fetch(`/api/admin/call-setup/${setupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      }
    })
    
    // Remove from local list
    callSetups.value = callSetups.value.filter(setup => setup.id !== setupId)
    
    const toast = useToast()
    toast.add({
      title: 'Call setup deleted',
      description: 'Call configuration has been removed',
      color: 'orange',
      timeout: 3000
    })
  } catch (err: any) {
    console.error('Failed to delete call setup:', err)
    const toast = useToast()
    toast.add({
      title: 'Delete failed',
      description: err.data?.message || 'Failed to delete call setup',
      color: 'red',
      timeout: 5000
    })
  } finally {
    deletingSetup.value = null
  }
}

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'yellow'
    case 'completed': return 'green'
    case 'failed': return 'red'
    case 'scheduled': return 'blue'
    default: return 'gray'
  }
}

const formatDate = (date: string | number) => {
  if (typeof date === 'number') {
    return new Date(date).toLocaleDateString('de-DE')
  }
  return new Date(date).toLocaleDateString('de-DE')
}

const formatDateTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('de-DE')
}

const getJobStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'yellow'
    case 'completed': return 'green'
    case 'failed': return 'red'
    case 'running': return 'blue'
    default: return 'gray'
  }
}
</script>