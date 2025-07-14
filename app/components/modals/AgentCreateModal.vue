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
              <UIcon name="i-heroicons-plus" class="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Create New Agent</h2>
              <p class="text-sm text-white/60">Set up a new conversational AI agent</p>
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
          <!-- Agent Name -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Agent Name *
            </label>
            <input
              v-model="agentName"
              type="text"
              placeholder="Enter agent name..."
              :disabled="loading"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <!-- Language -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Language
            </label>
            <select
              v-model="language"
              :disabled="loading"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </div>

          <!-- Voice ID -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Voice ID (Optional)
            </label>
            <input
              v-model="voiceId"
              type="text"
              placeholder="Enter voice ID..."
              :disabled="loading"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p class="text-xs text-white/60 mt-2">
              Optional voice ID from your ElevenLabs voice library
            </p>
          </div>

          <!-- System Prompt -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              System Prompt (Optional)
            </label>
            <textarea
              v-model="prompt"
              placeholder="Enter the agent's system prompt..."
              :disabled="loading"
              rows="6"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            ></textarea>
            <p class="text-xs text-white/60 mt-2">
              Instructions that define how the agent should behave and respond
            </p>
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
            @click="createAgent"
            :disabled="!agentName.trim() || loading"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-plus" class="w-4 h-4" />
            {{ loading ? 'Creating...' : 'Create Agent' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  sessionId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [agent: any]
}>()

const loading = ref(false)
const agentName = ref('')
const language = ref('en')
const voiceId = ref('')
const prompt = ref('')

const createAgent = async () => {
  if (!agentName.value) return

  loading.value = true
  
  try {
    const agentData = {
      name: agentName.value,
      language: language.value,
      voice_id: voiceId.value || undefined,
      prompt: prompt.value || undefined
    }

    const result = await $fetch('/api/admin/elevenlabs/agents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${props.sessionId}` },
      body: agentData
    })

    const toast = useToast()
    toast.add({
      title: 'Agent created',
      description: `Agent "${agentName.value}" has been created`,
      color: 'green',
      timeout: 3000
    })
    
    emit('save', result)
    
    // Reset form
    agentName.value = ''
    language.value = 'en'
    voiceId.value = ''
    prompt.value = ''
  } catch (error) {
    console.error('Failed to create agent:', error)
    const toast = useToast()
    toast.add({
      title: 'Creation failed',
      description: 'Could not create agent',
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
    agentName.value = ''
    language.value = 'en'
    voiceId.value = ''
    prompt.value = ''
  }
})
</script>