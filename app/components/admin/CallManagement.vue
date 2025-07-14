<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <UIcon name="i-heroicons-phone" class="w-5 h-5 text-purple-400" />
        ElevenLabs Call Management
      </h3>
      <div class="flex gap-2">
        <UButton 
          @click="refreshData" 
          size="sm" 
          variant="soft"
          :loading="loading"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
          Refresh
        </UButton>
        <UButton 
          @click="showSettings = true" 
          size="sm" 
          color="indigo"
          variant="soft"
        >
          <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-1" />
          Settings
        </UButton>
      </div>
    </div>

    <!-- API Settings Check -->
    <div v-if="!settings?.hasApiKey" class="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-orange-400" />
        <div>
          <h4 class="text-sm font-medium text-orange-200">ElevenLabs API Configuration Required</h4>
          <p class="text-xs text-orange-200/70 mt-1">Configure your ElevenLabs API key in settings to use call management features.</p>
        </div>
        <UButton @click="showSettings = true" size="sm" color="orange" variant="soft">
          Configure
        </UButton>
      </div>
    </div>

    <div v-else>
      <!-- Sub Navigation -->
      <div class="border-b border-white/20 mb-6">
        <nav class="-mb-px flex space-x-6">
          <button
            v-for="subTab in callTabs"
            :key="subTab.id"
            @click="activeTab = subTab.id"
            :class="[
              activeTab === subTab.id
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-purple-200/70 hover:text-purple-200 hover:border-purple-300/50',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all'
            ]"
          >
            <UIcon :name="subTab.icon" class="w-4 h-4 mr-2 inline" />
            {{ subTab.name }}
          </button>
        </nav>
      </div>

      <!-- Conversations Tab -->
      <div v-if="activeTab === 'conversations'">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-md font-medium text-white">Recent Conversations</h4>
          <div class="flex gap-2">
            <UInput 
              v-model="conversationFilter"
              placeholder="Filter conversations..."
              size="sm"
              class="w-48"
            />
          </div>
        </div>
        
        <div v-if="conversationsLoading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">Loading conversations...</p>
        </div>
        
        <div v-else-if="conversations?.length" class="space-y-3">
          <div 
            v-for="conversation in filteredConversations" 
            :key="conversation.conversation_id"
            class="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm font-medium text-white">{{ conversation.agent_name }}</span>
                  <UBadge 
                    :color="conversation.call_successful === 'success' ? 'green' : conversation.call_successful === 'failure' ? 'red' : 'orange'" 
                    size="sm"
                  >
                    {{ conversation.call_successful }}
                  </UBadge>
                  <UBadge 
                    :color="conversation.status === 'done' ? 'green' : conversation.status === 'failed' ? 'red' : 'blue'" 
                    size="sm" 
                    variant="soft"
                  >
                    {{ conversation.status }}
                  </UBadge>
                </div>
                <div class="text-xs text-purple-200/70 space-y-1">
                  <p>ID: {{ conversation.conversation_id }}</p>
                  <p>Duration: {{ formatDuration(conversation.call_duration_secs) }}</p>
                  <p>Messages: {{ conversation.message_count }}</p>
                  <p>Started: {{ formatDate(conversation.start_time_unix_secs) }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton @click="viewConversation(conversation)" size="sm" variant="soft">
                  <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                </UButton>
                <UButton @click="deleteConversation(conversation.conversation_id)" size="sm" color="red" variant="soft">
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                </UButton>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="w-8 h-8 text-purple-400/50 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">No conversations found</p>
        </div>
      </div>

      <!-- Agents Tab -->
      <div v-if="activeTab === 'agents'">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-md font-medium text-white">Voice Agents</h4>
          <UButton @click="createAgent" size="sm" color="green" variant="soft">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            Create Agent
          </UButton>
        </div>
        
        <div v-if="agentsLoading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">Loading agents...</p>
        </div>
        
        <div v-else-if="agents?.length" class="grid gap-4">
          <div 
            v-for="agent in agents" 
            :key="agent.agent_id"
            class="bg-white/5 border border-white/10 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-white mb-2">{{ agent.name }}</h5>
                <div class="text-xs text-purple-200/70 space-y-1">
                  <p>ID: {{ agent.agent_id }}</p>
                  <p v-if="agent.language">Language: {{ agent.language }}</p>
                  <p v-if="agent.voice_id">Voice: {{ agent.voice_id }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton @click="editAgent(agent)" size="sm" variant="soft">
                  <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                </UButton>
                <UButton @click="deleteAgent(agent.agent_id)" size="sm" color="red" variant="soft">
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                </UButton>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-purple-400/50 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">No agents found</p>
        </div>
      </div>

      <!-- Batch Calls Tab -->
      <div v-if="activeTab === 'batch'">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-md font-medium text-white">Batch Calls</h4>
          <UButton @click="showBatchCallModal = true" size="sm" color="green" variant="soft">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            Start Batch Call
          </UButton>
        </div>
        
        <div v-if="batchCallsLoading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">Loading batch calls...</p>
        </div>
        
        <div v-else-if="batchCalls?.length" class="space-y-3">
          <div 
            v-for="batch in batchCalls" 
            :key="batch.id"
            class="bg-white/5 border border-white/10 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm font-medium text-white">{{ batch.name }}</span>
                  <UBadge 
                    :color="batch.status === 'completed' ? 'green' : batch.status === 'failed' ? 'red' : batch.status === 'cancelled' ? 'orange' : 'blue'" 
                    size="sm"
                  >
                    {{ batch.status }}
                  </UBadge>
                </div>
                <div class="text-xs text-purple-200/70 space-y-1">
                  <p>Agent: {{ batch.agent_name }}</p>
                  <p>Dispatched: {{ batch.total_calls_dispatched }}/{{ batch.total_calls_scheduled }}</p>
                  <p>Created: {{ formatDate(batch.created_at_unix) }}</p>
                  <p v-if="batch.scheduled_time_unix">Scheduled: {{ formatDate(batch.scheduled_time_unix) }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton 
                  @click="viewBatchCall(batch)" 
                  size="sm" 
                  color="blue" 
                  variant="soft"
                >
                  View
                </UButton>
                <UButton 
                  v-if="batch.status === 'pending' || batch.status === 'in_progress'" 
                  @click="cancelBatchCall(batch.id)" 
                  size="sm" 
                  color="red" 
                  variant="soft"
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-phone-arrow-up-right" class="w-8 h-8 text-purple-400/50 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">No batch calls found</p>
        </div>
      </div>
      
      <!-- Outbound Calls Tab -->
      <div v-if="activeTab === 'outbound'">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-md font-medium text-white">Outbound Calls</h4>
          <UButton @click="createOutboundCall" size="sm" color="green" variant="soft">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            Make Call
          </UButton>
        </div>
        
        <div v-if="outboundCallsLoading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">Loading outbound calls...</p>
        </div>
        
        <div v-else-if="outboundCalls?.length" class="space-y-3">
          <div 
            v-for="call in outboundCalls" 
            :key="call.id"
            class="bg-white/5 border border-white/10 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <UBadge 
                    :color="call.status === 'initiated' ? 'blue' : call.status === 'completed' ? 'green' : call.status === 'failed' ? 'red' : 'yellow'"
                    size="sm"
                  >
                    {{ call.status }}
                  </UBadge>
                  <span class="text-xs text-white/60">{{ new Date(call.created_at).toLocaleString() }}</span>
                </div>
                
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-phone" class="w-4 h-4 text-blue-400" />
                    <span class="text-sm text-white/90">{{ call.to_number }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-user" class="w-4 h-4 text-green-400" />
                    <span class="text-sm text-white/70">{{ call.agent_name || call.agent_id }}</span>
                  </div>
                  <div v-if="call.conversation_id" class="flex items-center gap-2">
                    <UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4 text-purple-400" />
                    <span class="text-sm text-white/70">{{ call.conversation_id }}</span>
                  </div>
                  <div v-if="call.call_sid" class="flex items-center gap-2">
                    <UIcon name="i-heroicons-phone-arrow-up-right" class="w-4 h-4 text-orange-400" />
                    <span class="text-sm text-white/70">{{ call.call_sid }}</span>
                  </div>
                  <div v-if="call.error_message" class="flex items-center gap-2">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-400" />
                    <span class="text-sm text-red-300">{{ call.error_message }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-phone-arrow-down-left" class="w-8 h-8 text-purple-400/50 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">No outbound calls found</p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ElevenLabsSettingsModal
      :show="showSettings"
      :settings="settings"
      :session-id="sessionId"
      @close="showSettings = false"
      @save="handleSettingsSave"
    />

    <ConversationDetailModal
      :show="showConversationModal"
      :conversation="selectedConversation"
      @close="showConversationModal = false"
    />

    <AgentEditModal
      :show="showAgentEditModal"
      :agent="selectedAgent"
      :session-id="sessionId"
      @close="showAgentEditModal = false"
      @save="handleAgentSave"
    />

    <AgentCreateModal
      :show="showAgentCreateModal"
      :session-id="sessionId"
      @close="showAgentCreateModal = false"
      @save="handleAgentCreate"
    />

    <BatchCallModal
      :show="showBatchCallModal"
      :agents="agents"
      :session-id="sessionId"
      @close="showBatchCallModal = false"
      @submit="handleBatchCallSubmit"
    />

    <OutboundCallModal
      :show="showOutboundCallModal"
      :agents="agents"
      :settings="settings"
      :session-id="sessionId"
      @close="showOutboundCallModal = false"
      @submit="handleOutboundCallSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import ElevenLabsSettingsModal from '~/components/modals/ElevenLabsSettingsModal.vue'
import ConversationDetailModal from '~/components/modals/ConversationDetailModal.vue'
import AgentEditModal from '~/components/modals/AgentEditModal.vue'
import AgentCreateModal from '~/components/modals/AgentCreateModal.vue'
import BatchCallModal from '~/components/modals/BatchCallModal.vue'
import OutboundCallModal from '~/components/modals/OutboundCallModal.vue'

interface Props {
  sessionId: string
}

const props = defineProps<Props>()

const activeTab = ref('conversations')
const loading = ref(false)
const conversationFilter = ref('')

// Modal states
const showSettings = ref(false)
const showConversationModal = ref(false)
const showAgentEditModal = ref(false)
const showAgentCreateModal = ref(false)
const showBatchCallModal = ref(false)
const showOutboundCallModal = ref(false)

// Selected items
const selectedConversation = ref(null)
const selectedAgent = ref(null)

// Data
const settings = ref(null)
const conversations = ref([])
const agents = ref([])
const batchCalls = ref([])
const outboundCalls = ref([])

// Loading states
const conversationsLoading = ref(false)
const agentsLoading = ref(false)
const batchCallsLoading = ref(false)
const outboundCallsLoading = ref(false)

const callTabs = [
  { id: 'conversations', name: 'Conversations', icon: 'i-heroicons-chat-bubble-left-right' },
  { id: 'agents', name: 'Agents', icon: 'i-heroicons-user-group' },
  { id: 'batch', name: 'Batch Calls', icon: 'i-heroicons-phone-arrow-up-right' },
  { id: 'outbound', name: 'Outbound Calls', icon: 'i-heroicons-phone-arrow-down-left' }
]

const filteredConversations = computed(() => {
  if (!conversationFilter.value) return conversations.value
  return conversations.value.filter(conv => 
    conv.agent_name?.toLowerCase().includes(conversationFilter.value.toLowerCase()) ||
    conv.conversation_id?.toLowerCase().includes(conversationFilter.value.toLowerCase())
  )
})

const formatDuration = (seconds: number): string => {
  if (!seconds) return '0s'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

const formatDate = (unixSeconds: number): string => {
  if (!unixSeconds) return 'N/A'
  return new Date(unixSeconds * 1000).toLocaleString()
}

const refreshData = async () => {
  loading.value = true
  try {
    // Load settings first, then data that depends on API key
    await loadSettings()
    if (settings.value?.hasApiKey) {
      await Promise.all([
        loadConversations(),
        loadAgents(),
        loadBatchCalls(),
        loadOutboundCalls()
      ])
    }
  } finally {
    loading.value = false
  }
}

const loadSettings = async () => {
  try {
    settings.value = await $fetch('/api/admin/elevenlabs/settings', {
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

const loadConversations = async () => {
  if (!settings.value?.hasApiKey) return
  
  conversationsLoading.value = true
  try {
    const result = await $fetch('/api/admin/elevenlabs/conversations', {
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
    conversations.value = result.conversations || []
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    conversationsLoading.value = false
  }
}

const loadAgents = async () => {
  if (!settings.value?.hasApiKey) return
  
  agentsLoading.value = true
  try {
    const result = await $fetch('/api/admin/elevenlabs/agents', {
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
    agents.value = result.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
  } finally {
    agentsLoading.value = false
  }
}

const loadBatchCalls = async () => {
  if (!settings.value?.hasApiKey) return
  
  batchCallsLoading.value = true
  try {
    const result = await $fetch('/api/admin/elevenlabs/batch-calls', {
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
    batchCalls.value = result.batch_calls || []
  } catch (error) {
    console.error('Failed to load batch calls:', error)
  } finally {
    batchCallsLoading.value = false
  }
}

const loadOutboundCalls = async () => {
  if (!settings.value?.hasApiKey) return
  
  outboundCallsLoading.value = true
  try {
    const result = await $fetch('/api/admin/elevenlabs/outbound-calls', {
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
    outboundCalls.value = result.calls || []
  } catch (error) {
    console.error('Failed to load outbound calls:', error)
  } finally {
    outboundCallsLoading.value = false
  }
}

const viewConversation = (conversation: any) => {
  selectedConversation.value = conversation
  showConversationModal.value = true
}

const deleteConversation = async (conversationId: string) => {
  if (!confirm('Are you sure you want to delete this conversation?')) return
  
  try {
    await $fetch(`/api/admin/elevenlabs/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
    
    await loadConversations()
    
    const toast = useToast()
    toast.add({
      title: 'Conversation deleted',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    const toast = useToast()
    toast.add({
      title: 'Delete failed',
      description: 'Could not delete conversation',
      color: 'red',
      timeout: 3000
    })
  }
}

const editAgent = (agent: any) => {
  selectedAgent.value = agent
  showAgentEditModal.value = true
}

const deleteAgent = async (agentId: string) => {
  if (!confirm('Are you sure you want to delete this agent?')) return
  
  try {
    await $fetch(`/api/admin/elevenlabs/agents/${agentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
    
    await loadAgents()
    
    const toast = useToast()
    toast.add({
      title: 'Agent deleted',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    const toast = useToast()
    toast.add({
      title: 'Delete failed',
      description: 'Could not delete agent',
      color: 'red',
      timeout: 3000
    })
  }
}

const createAgent = () => {
  showAgentCreateModal.value = true
}

const createOutboundCall = () => {
  showOutboundCallModal.value = true
}

const viewBatchCall = (batch: any) => {
  const toast = useToast()
  toast.add({
    title: 'Feature not implemented',
    description: 'Batch call detail view not yet implemented',
    color: 'orange',
    timeout: 3000
  })
}

const cancelBatchCall = async (batchId: string) => {
  if (!confirm('Are you sure you want to cancel this batch call?')) return
  
  try {
    await $fetch(`/api/admin/elevenlabs/batch-calls/${batchId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${props.sessionId}` }
    })
    
    await loadBatchCalls()
    
    const toast = useToast()
    toast.add({
      title: 'Batch call cancelled',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to cancel batch call:', error)
    const toast = useToast()
    toast.add({
      title: 'Cancel failed',
      description: 'Could not cancel batch call',
      color: 'red',
      timeout: 3000
    })
  }
}

const handleSettingsSave = async (data: any) => {
  try {
    await loadSettings()
    showSettings.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Settings saved',
      color: 'green',
      timeout: 3000
    })
    
    // Refresh data after settings change
    await refreshData()
  } catch (error) {
    console.error('Failed to save settings:', error)
    const toast = useToast()
    toast.add({
      title: 'Save failed',
      description: 'Could not save settings',
      color: 'red',
      timeout: 3000
    })
  }
}

const handleAgentSave = async (updatedAgent: any) => {
  try {
    await loadAgents()
    showAgentEditModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Agent updated',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to save agent:', error)
    const toast = useToast()
    toast.add({
      title: 'Save failed',
      description: 'Could not save agent',
      color: 'red',
      timeout: 3000
    })
  }
}

const handleAgentCreate = async (newAgent: any) => {
  try {
    await loadAgents()
    showAgentCreateModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Agent created',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to create agent:', error)
    const toast = useToast()
    toast.add({
      title: 'Create failed',
      description: 'Could not create agent',
      color: 'red',
      timeout: 3000
    })
  }
}

const handleBatchCallSubmit = async (data: any) => {
  try {
    await loadBatchCalls()
    showBatchCallModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Batch call created',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to create batch call:', error)
    const toast = useToast()
    toast.add({
      title: 'Create failed',
      description: 'Could not create batch call',
      color: 'red',
      timeout: 3000
    })
  }
}

const handleOutboundCallSubmit = async (data: any) => {
  try {
    await loadOutboundCalls()
    showOutboundCallModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Outbound call initiated',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to initiate outbound call:', error)
    const toast = useToast()
    toast.add({
      title: 'Call failed',
      description: 'Could not initiate outbound call',
      color: 'red',
      timeout: 3000
    })
  }
}

// Load initial data
onMounted(() => {
  refreshData()
})
</script>