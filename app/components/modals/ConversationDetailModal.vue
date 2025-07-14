<template>
  <div 
    v-if="show && conversation" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <div @click.stop class="w-full max-w-4xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Conversation Details</h2>
              <p class="text-sm text-white/60">{{ conversation.agent_name || 'Unknown Agent' }}</p>
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
          <!-- Conversation Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 class="text-sm font-medium text-white/80 mb-3">Basic Information</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-white/60">Conversation ID:</span>
                  <code class="text-blue-300 bg-blue-900/40 px-2 py-1 rounded text-xs">{{ conversation.conversation_id }}</code>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/60">Agent ID:</span>
                  <code class="text-blue-300 bg-blue-900/40 px-2 py-1 rounded text-xs">{{ conversation.agent_id }}</code>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/60">Status:</span>
                  <UBadge 
                    :color="conversation.status === 'done' ? 'green' : conversation.status === 'failed' ? 'red' : 'blue'" 
                    size="sm"
                  >
                    {{ conversation.status }}
                  </UBadge>
                </div>
              </div>
            </div>

            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 class="text-sm font-medium text-white/80 mb-3">Call Metrics</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-white/60">Duration:</span>
                  <span class="text-white">{{ formatDuration(conversation.metadata?.call_duration_secs || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/60">Start Time:</span>
                  <span class="text-white">{{ formatDate(conversation.metadata?.start_time_unix_secs || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-white/60">Audio Available:</span>
                  <UBadge :color="conversation.has_audio ? 'green' : 'gray'" size="sm">
                    {{ conversation.has_audio ? 'Yes' : 'No' }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- Transcript -->
          <div v-if="conversation.transcript?.length" class="space-y-4">
            <h4 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
              Conversation Transcript
            </h4>
            
            <div class="bg-white/5 rounded-xl p-4 border border-white/10 max-h-96 overflow-y-auto">
              <div class="space-y-4">
                <div 
                  v-for="(message, index) in conversation.transcript" 
                  :key="index"
                  class="flex gap-3"
                >
                  <div class="flex-shrink-0">
                    <div :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                      message.role === 'agent' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    ]">
                      {{ message.role === 'agent' ? 'AI' : 'U' }}
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-medium" :class="message.role === 'agent' ? 'text-purple-300' : 'text-green-300'">
                        {{ message.role === 'agent' ? 'Agent' : 'User' }}
                      </span>
                      <span class="text-xs text-white/40">{{ formatDuration(message.time_in_call_secs) }}</span>
                    </div>
                    <p class="text-sm text-white/80 leading-relaxed">{{ message.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Transcript -->
          <div v-else class="text-center py-8">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-white/20 mx-auto mb-2" />
            <p class="text-white/60 text-sm">No transcript available for this conversation</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 pt-4 border-t border-white/10 bg-white/5">
        <div class="flex justify-end">
          <button 
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  conversation: any
}

interface Emits {
  (event: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

const formatDate = (unixSeconds: number): string => {
  return new Date(unixSeconds * 1000).toLocaleString()
}
</script>