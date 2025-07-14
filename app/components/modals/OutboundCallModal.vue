<template>
  <div 
    v-if="show" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <div @click.stop class="w-full max-w-2xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <UIcon name="i-heroicons-phone" class="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Make Outbound Call</h2>
              <p class="text-sm text-white/60">Initiate a phone call to a recipient</p>
            </div>
          </div>
          <button 
            @click="$emit('close')" 
            class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="space-y-4">
          <!-- Agent Selection -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Select Agent *
            </label>
            <select
              v-model="selectedAgentId"
              :disabled="loading"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an agent...</option>
              <option v-for="agent in agents" :key="agent.agent_id" :value="agent.agent_id">
                {{ agent.name }}
              </option>
            </select>
          </div>

          <!-- Phone Number -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Phone Number *
            </label>
            <input
              v-model="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              :disabled="loading"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-xs text-white/60 mt-2">Include country code (e.g., +1 for US)</p>
          </div>

          <!-- Additional Context -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              v-model="additionalData"
              placeholder="Any additional context for the conversation..."
              :disabled="loading"
              rows="3"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 pt-4 border-t border-white/10 bg-white/5">
        <div class="flex justify-end gap-3">
          <button 
            @click="$emit('close')"
            :disabled="loading"
            class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            @click="makeCall"
            :disabled="!selectedAgentId || !phoneNumber.trim() || loading"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-phone" class="w-4 h-4" />
            {{ loading ? 'Calling...' : 'Make Call' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  agents: any[]
  sessionId: string
  settings?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submit: [data: any]
}>()

const loading = ref(false)
const selectedAgentId = ref('')
const phoneNumber = ref('')
const additionalData = ref('')

const makeCall = async () => {
  if (!selectedAgentId.value || !phoneNumber.value) return
  
  if (!props.settings?.phoneNumberId) {
    const toast = useToast()
    toast.add({
      title: 'Phone number not configured',
      description: 'Please configure a phone number ID in ElevenLabs settings',
      color: 'red',
      timeout: 5000
    })
    return
  }

  loading.value = true
  
  try {
    const callData = {
      agent_id: selectedAgentId.value,
      agent_phone_number_id: props.settings.phoneNumberId,
      to_number: phoneNumber.value,
      conversation_initiation_client_data: additionalData.value ? { context: additionalData.value } : null
    }

    const result = await $fetch('/api/admin/elevenlabs/twilio/outbound-call', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${props.sessionId}` },
      body: callData
    })

    const toast = useToast()
    if (result.success) {
      toast.add({
        title: 'Call initiated',
        description: `Call to ${phoneNumber.value} has been started`,
        color: 'green',
        timeout: 3000
      })
      
      emit('submit', result)
      
      // Reset form
      selectedAgentId.value = ''
      phoneNumber.value = ''
      additionalData.value = ''
    } else {
      toast.add({
        title: 'Call failed',
        description: result.message || 'Failed to initiate call',
        color: 'red',
        timeout: 5000
      })
    }
  } catch (error) {
    console.error('Failed to make call:', error)
    const toast = useToast()
    toast.add({
      title: 'Call failed',
      description: 'Could not initiate outbound call',
      color: 'red',
      timeout: 5000
    })
  } finally {
    loading.value = false
  }
}

// Reset form when modal opens
watch(() => props.show, (show) => {
  if (show) {
    selectedAgentId.value = ''
    phoneNumber.value = ''
    additionalData.value = ''
  }
})
</script>