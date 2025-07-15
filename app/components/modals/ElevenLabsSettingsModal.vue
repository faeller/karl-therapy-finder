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
            <div class="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">ElevenLabs Settings</h2>
              <p class="text-sm text-white/60">Configure your ElevenLabs API integration</p>
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
          <!-- API Configuration -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <UIcon name="i-heroicons-key" class="w-5 h-5" />
              API Configuration
            </h3>
            
            <!-- API Key -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <label class="block text-sm font-medium text-white/80 mb-2">
                API Key *
              </label>
              <input
                v-model="form.apiKey"
                type="password"
                placeholder="Enter your ElevenLabs API key"
                :disabled="saving"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p class="text-xs text-white/60 mt-2">
                Get your API key from 
                <a href="https://elevenlabs.io/app/settings/profile" target="_blank" class="text-purple-400 hover:text-purple-300 underline">
                  ElevenLabs Profile Settings
                </a>
              </p>
            </div>

            <!-- Webhook Secret -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <label class="block text-sm font-medium text-white/80 mb-2">
                Webhook Secret (Optional)
              </label>
              <input
                v-model="form.webhookSecret"
                type="password"
                placeholder="Enter webhook secret for HMAC validation"
                :disabled="saving"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p class="text-xs text-white/60 mt-2">
                Used for secure webhook validation. Configure this in your ElevenLabs webhook settings.
              </p>
            </div>

            <!-- Phone Number ID -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <label class="block text-sm font-medium text-white/80 mb-2">
                Phone Number ID (Required for outbound calls)
              </label>
              <input
                v-model="form.phoneNumberId"
                type="text"
                placeholder="Enter your ElevenLabs phone number ID"
                :disabled="saving"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p class="text-xs text-white/60 mt-2">
                Phone number ID from your ElevenLabs account needed to make outbound calls.
              </p>
            </div>

            <!-- Current Status -->
            <div v-if="settings?.hasApiKey" class="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-400" />
                <span class="text-sm font-medium text-green-300">
                  API Key Currently Configured
                </span>
              </div>
              <p class="text-xs text-green-400/80">
                Preview: {{ settings.apiKeyPreview }}
              </p>
            </div>
          </div>

          <!-- Webhook Configuration -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" />
              Webhook Configuration
            </h3>
            
            <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 class="text-sm font-medium text-blue-300 mb-3">Webhook URLs</h4>
              <div class="space-y-3">
                <div>
                  <span class="text-xs font-medium text-blue-300/80">Transcription Webhook:</span>
                  <code class="block text-blue-300 bg-blue-900/40 px-3 py-2 rounded mt-1 text-xs break-all">
                    {{ webhookBaseUrl }}/api/webhooks/elevenlabs/transcription
                  </code>
                </div>
                <div>
                  <span class="text-xs font-medium text-blue-300/80">Audio Webhook:</span>
                  <code class="block text-blue-300 bg-blue-900/40 px-3 py-2 rounded mt-1 text-xs break-all">
                    {{ webhookBaseUrl }}/api/webhooks/elevenlabs/audio
                  </code>
                </div>
                <div>
                  <span class="text-xs font-medium text-blue-300/80">Postcall Webhook:</span>
                  <code class="block text-blue-300 bg-blue-900/40 px-3 py-2 rounded mt-1 text-xs break-all">
                    {{ webhookBaseUrl }}/api/webhooks/elevenlabs/postcall
                  </code>
                  <p class="text-xs text-blue-300/60 mt-1">
                    Updates call status and results when calls complete
                  </p>
                </div>
              </div>
              <p class="text-xs text-blue-300/60 mt-3">
                Configure these URLs in your ElevenLabs dashboard under webhook settings. The postcall webhook is essential for tracking call completion and results.
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
            :disabled="!form.apiKey.trim() || saving"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-check" class="w-4 h-4" />
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  settings: any
  sessionId: string
}

interface Emits {
  (event: 'close'): void
  (event: 'save', data: { apiKey: string; webhookSecret: string; phoneNumberId: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = useRuntimeConfig()
const webhookBaseUrl = config.public.siteUrl || 'https://your-domain.com'

const form = ref({
  apiKey: '',
  webhookSecret: '',
  phoneNumberId: ''
})

const saving = ref(false)

const handleSave = async () => {
  if (!form.value.apiKey.trim()) return
  
  saving.value = true
  try {
    await $fetch('/api/admin/elevenlabs/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.sessionId}`
      },
      body: {
        apiKey: form.value.apiKey,
        webhookSecret: form.value.webhookSecret,
        phoneNumberId: form.value.phoneNumberId
      }
    })
    
    emit('save', {
      apiKey: form.value.apiKey,
      webhookSecret: form.value.webhookSecret,
      phoneNumberId: form.value.phoneNumberId
    })
    
    // Reset form
    form.value.apiKey = ''
    form.value.webhookSecret = ''
    form.value.phoneNumberId = ''
    
  } catch (error) {
    console.error('Failed to save settings:', error)
    throw error
  } finally {
    saving.value = false
  }
}
</script>