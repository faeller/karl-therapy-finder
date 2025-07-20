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
            <div class="p-2 rounded-xl bg-green-500/20 border border-green-500/30">
              <UIcon name="i-heroicons-phone-arrow-up-right" class="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Create Batch Call</h2>
              <p class="text-sm text-white/60">Set up a new batch calling campaign</p>
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
        <div class="space-y-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5" />
              Basic Information
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                <label class="block text-sm font-medium text-white/80 mb-2">
                  Call Name *
                </label>
                <input
                  v-model="form.call_name"
                  type="text"
                  placeholder="Enter a name for this batch call"
                  :disabled="saving"
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                <label class="block text-sm font-medium text-white/80 mb-2">
                  Agent *
                </label>
                <select
                  v-model="form.agent_id"
                  :disabled="saving"
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select an agent</option>
                  <option v-for="agent in agents" :key="agent.agent_id" :value="agent.agent_id">
                    {{ agent.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <label class="block text-sm font-medium text-white/80 mb-2">
                Agent Phone Number ID *
              </label>
              <input
                v-model="form.agent_phone_number_id"
                type="text"
                placeholder="Enter the phone number ID for the agent"
                :disabled="saving"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p class="text-xs text-white/60 mt-2">
                This is the phone number ID configured in your ElevenLabs account for outbound calls.
              </p>
            </div>
          </div>

          <!-- Recipients -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <UIcon name="i-heroicons-users" class="w-5 h-5" />
              Recipients
            </h4>
            
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <label class="block text-sm font-medium text-white/80 mb-2">
                Phone Numbers *
              </label>
              <textarea
                v-model="form.recipients"
                rows="6"
                placeholder="Enter phone numbers (one per line)&#10;+1234567890&#10;+1987654321&#10;+1555123456"
                :disabled="saving"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none font-mono"
              ></textarea>
              <p class="text-xs text-white/60 mt-2">
                Enter one phone number per line. Include country codes (e.g., +1 for US).
              </p>
            </div>
            
            <!-- Variables Section -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-white/80">
                  Variables (Optional)
                </label>
                <button
                  @click="addVariable"
                  type="button"
                  class="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                >
                  + Add Variable
                </button>
              </div>
              
              <div class="space-y-2 mb-3">
                <div 
                  v-for="(variable, index) in variables" 
                  :key="index"
                  class="flex gap-2 items-center"
                >
                  <input
                    v-model="variable.key"
                    type="text"
                    placeholder="Variable name"
                    class="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <input
                    v-model="variable.value"
                    type="text"
                    placeholder="Variable value"
                    class="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <button
                    @click="removeVariable(index)"
                    type="button"
                    class="text-red-400 hover:text-red-300 p-1"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div class="text-xs text-white/50">
                <p class="mb-1">Available built-in variables:</p>
                <div class="flex flex-wrap gap-1">
                  <code class="px-1 py-0.5 bg-white/10 rounded text-blue-300">{{ currentDateVariable }}</code>
                  <code class="px-1 py-0.5 bg-white/10 rounded text-blue-300">{{ currentTimeVariable }}</code>
                  <code class="px-1 py-0.5 bg-white/10 rounded text-blue-300">{{ currentDateTimeVariable }}</code>
                </div>
              </div>
            </div>
          </div>

          <!-- Scheduling (Optional) -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <UIcon name="i-heroicons-clock" class="w-5 h-5" />
              Scheduling (Optional)
            </h4>
            
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <label class="block text-sm font-medium text-white/80 mb-2">
                Scheduled Time
              </label>
              <input
                v-model="form.scheduled_time_unix"
                type="datetime-local"
                :disabled="saving"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p class="text-xs text-white/60 mt-2">
                Leave empty to start the batch call immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 pt-4 border-t border-white/10 bg-white/5">
        <div class="flex justify-end gap-3">
          <button 
            @click="$emit('close')"
            :disabled="saving"
            class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            @click="handleSubmit"
            :disabled="!form.call_name.trim() || !form.agent_id || !form.recipients.trim() || saving"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-phone-arrow-up-right" class="w-4 h-4" />
            {{ saving ? 'Creating...' : 'Create Batch Call' }}
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
}

interface Emits {
  (event: 'close'): void
  (event: 'submit', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentDateVariable = '{{currentDate}}'
const currentTimeVariable = '{{currentTime}}'
const currentDateTimeVariable = '{{currentDateTime}}'

const form = ref({
  call_name: '',
  agent_id: '',
  agent_phone_number_id: '',
  recipients: '',
  scheduled_time_unix: ''
})

const variables = ref([])
const saving = ref(false)

// Load form data from localStorage on component mount
onMounted(() => {
  if (process.client) {
    loadFormData()
  }
})

// Save form data to localStorage whenever it changes
watch(form, () => {
  if (process.client) {
    saveFormData()
  }
}, { deep: true })

watch(variables, () => {
  if (process.client) {
    saveFormData()
  }
}, { deep: true })

const loadFormData = () => {
  if (typeof localStorage === 'undefined') return
  
  const savedData = localStorage.getItem('batchCallForm')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      if (parsed.form) {
        form.value = { ...form.value, ...parsed.form }
      }
      if (parsed.variables) {
        variables.value = parsed.variables
      }
    } catch (e) {
      console.error('Error loading form data:', e)
    }
  }
}

const saveFormData = () => {
  if (typeof localStorage === 'undefined') return
  
  const dataToSave = {
    form: form.value,
    variables: variables.value
  }
  localStorage.setItem('batchCallForm', JSON.stringify(dataToSave))
}

const addVariable = () => {
  variables.value.push({ key: '', value: '' })
}

const removeVariable = (index: number) => {
  variables.value.splice(index, 1)
}

const handleSubmit = async () => {
  saving.value = true
  try {
    // Convert variables array to object and add built-in variables
    const now = new Date()
    const variableData = {
      currentDate: now.toISOString().split('T')[0],
      currentTime: now.toTimeString().split(' ')[0],
      currentDateTime: now.toISOString().replace('T', ' ').split('.')[0]
    }
    
    variables.value.forEach(variable => {
      if (variable.key.trim() && variable.value.trim()) {
        variableData[variable.key.trim()] = variable.value.trim()
      }
    })

    // Parse recipients and include dynamic variables for each
    const recipientNumbers = form.value.recipients
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(phone => ({ 
        phone_number: phone,
        conversation_initiation_client_data: {
          dynamic_variables: variableData
        }
      }))

    // Convert datetime to Unix timestamp if provided
    let scheduledTimeUnix = null
    if (form.value.scheduled_time_unix) {
      scheduledTimeUnix = Math.floor(new Date(form.value.scheduled_time_unix).getTime() / 1000)
    }

    const batchCallData = {
      call_name: form.value.call_name,
      agent_id: form.value.agent_id,
      agent_phone_number_id: form.value.agent_phone_number_id,
      recipients: recipientNumbers,
      scheduled_time_unix: scheduledTimeUnix
    }

    await $fetch('/api/admin/elevenlabs/batch-calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      },
      body: batchCallData
    })

    emit('submit', batchCallData)
    
    // Reset form
    form.value = {
      call_name: '',
      agent_id: '',
      agent_phone_number_id: '',
      recipients: '',
      scheduled_time_unix: ''
    }
    variables.value = []
    
    // Clear localStorage
    localStorage.removeItem('batchCallForm')
    
  } catch (error) {
    console.error('Failed to create batch call:', error)
    throw error
  } finally {
    saving.value = false
  }
}
</script>