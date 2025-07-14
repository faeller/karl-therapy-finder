<template>
  <div 
    v-if="show && agent" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <div @click.stop class="w-full max-w-3xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <UIcon name="i-heroicons-pencil" class="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Edit Agent</h2>
              <p class="text-sm text-white/60">{{ agent.name }}</p>
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
          <!-- Agent Info -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 class="text-lg font-semibold text-blue-300 mb-3">Agent Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-white/60">Name</p>
                <p class="text-white font-medium">{{ agent.name }}</p>
              </div>
              <div>
                <p class="text-sm text-white/60">Agent ID</p>
                <p class="text-white font-medium font-mono text-xs">{{ agent.agent_id }}</p>
              </div>
              <div v-if="agent.language">
                <p class="text-sm text-white/60">Language</p>
                <p class="text-white font-medium">{{ agent.language }}</p>
              </div>
              <div v-if="agent.voice_id">
                <p class="text-sm text-white/60">Voice ID</p>
                <p class="text-white font-medium font-mono text-xs">{{ agent.voice_id }}</p>
              </div>
            </div>
          </div>
          
          <!-- System Prompt -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 class="text-lg font-semibold text-blue-300 mb-3">System Prompt</h4>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-white/80">
                Edit the system prompt for this agent
              </label>
              <textarea
                v-model="form.prompt"
                rows="12"
                placeholder="Enter the system prompt that defines how this agent should behave..."
                :disabled="saving"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
              ></textarea>
              <p class="text-xs text-white/50">
                The system prompt defines the agent's personality, behavior, and how it responds to users. Use variables like {{ currentDateVariable }} if needed.
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
            @click="handleSave"
            :disabled="saving"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-check" class="w-4 h-4" />
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  agent: any
  sessionId: string
}

interface Emits {
  (event: 'close'): void
  (event: 'save', updatedAgent: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentDateVariable = '{{currentDate}}'

const form = ref({
  prompt: ''
})

const saving = ref(false)

// Watch for agent changes to populate form
watch(() => props.agent, async (newAgent) => {
  if (newAgent && props.show) {
    await loadAgentDetails()
  }
}, { immediate: true })

// Watch for show changes to load data
watch(() => props.show, async (show) => {
  if (show && props.agent) {
    await loadAgentDetails()
  }
})

const loadAgentDetails = async () => {
  if (!props.agent) return
  
  try {
    const agentDetails = await $fetch(`/api/admin/elevenlabs/agents/${props.agent.agent_id}`, {
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      }
    })
    
    form.value.prompt = agentDetails.conversation_config?.agent?.prompt?.prompt || ''
  } catch (error) {
    console.error('Failed to load agent details:', error)
  }
}

const handleSave = async () => {
  if (!props.agent) return
  
  saving.value = true
  try {
    const updatedAgent = await $fetch(`/api/admin/elevenlabs/agents/${props.agent.agent_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      },
      body: {
        prompt: form.value.prompt
      }
    })
    
    emit('save', updatedAgent)
    
  } catch (error) {
    console.error('Failed to save agent:', error)
    throw error
  } finally {
    saving.value = false
  }
}
</script>