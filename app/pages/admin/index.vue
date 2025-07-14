<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-16">
    <!-- Animated background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div class="absolute -bottom-40 right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
    </div>

    <!-- Admin Sub-Header (minimal bar) -->
    <div class="fixed top-16 left-0 right-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-10 justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="flex h-6 w-6 items-center justify-center rounded-lg border border-purple-400/40 bg-gradient-to-br from-purple-500/70 to-purple-600/70 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
              ⚡
            </div>
            <h1 class="text-base font-semibold text-white tracking-tight">Admin Dashboard</h1>
          </div>
          <div class="flex items-center space-x-3">
            <NuxtLink to="/debug" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-sm font-medium transition-all border border-white/20 shadow-sm">
              Back to Debug
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="relative z-10 flex items-center justify-center h-64">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
        <p class="text-purple-200 text-sm">Loading admin dashboard...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-red-500/40">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-red-300 text-base flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
            Access Denied
          </h3>
          <UBadge color="red" variant="soft">Error</UBadge>
        </div>
        <p class="text-red-200/90 text-sm">{{ error.message }}</p>
      </div>
    </div>

    <!-- Admin Dashboard Content -->
    <div v-else class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-10">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <!-- System Status -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <UIcon name="i-heroicons-cpu-chip" class="w-6 h-6 text-green-400" />
            </div>
            <div class="flex-1">
              <dt class="text-sm font-medium text-purple-200/80 truncate">System Status</dt>
              <dd class="text-lg font-bold text-white">Online</dd>
            </div>
          </div>
        </div>

        <!-- Uptime -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <UIcon name="i-heroicons-clock" class="w-6 h-6 text-blue-400" />
            </div>
            <div class="flex-1">
              <dt class="text-sm font-medium text-purple-200/80 truncate">Uptime</dt>
              <dd class="text-lg font-bold text-white">{{ formatUptime(uptime) }}</dd>
            </div>
          </div>
        </div>

        <!-- Memory Usage -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <UIcon name="i-heroicons-circle-stack" class="w-6 h-6 text-yellow-400" />
            </div>
            <div class="flex-1">
              <dt class="text-sm font-medium text-purple-200/80 truncate">Memory</dt>
              <dd class="text-lg font-bold text-white">{{ formatBytes(memoryUsage.used) }}</dd>
            </div>
          </div>
        </div>

        <!-- Version -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <UIcon name="i-heroicons-code-bracket" class="w-6 h-6 text-purple-400" />
            </div>
            <div class="flex-1">
              <dt class="text-sm font-medium text-purple-200/80 truncate">Version</dt>
              <dd class="text-lg font-bold text-white">{{ version }}</dd>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-white/20 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-purple-200/70 hover:text-purple-200 hover:border-purple-300/50',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all'
            ]"
          >
            <UIcon :name="tab.icon" class="w-4 h-4 mr-2 inline" />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
        <!-- Performance Tab -->
        <div v-if="activeTab === 'performance'" class="p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-purple-400" />
            Performance Metrics
          </h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Memory Chart Placeholder -->
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 class="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-circle-stack" class="w-4 h-4" />
                Memory Usage
              </h4>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Used</span>
                  <span class="text-white font-medium">{{ formatBytes(memoryUsage.used) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Total</span>
                  <span class="text-white font-medium">{{ formatBytes(memoryUsage.total) }}</span>
                </div>
                <div class="w-full bg-purple-900/30 rounded-full h-2">
                  <div 
                    class="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                    :style="{ width: `${(memoryUsage.used / memoryUsage.total) * 100}%` }"
                  ></div>
                </div>
                <div class="text-xs text-purple-200/60 text-center">
                  {{ Math.round((memoryUsage.used / memoryUsage.total) * 100) }}% utilized
                </div>
              </div>
            </div>

            <!-- Process Info -->
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 class="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4" />
                Process Information
              </h4>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Node.js Version</span>
                  <span class="text-white font-medium">{{ nodeVersion }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Platform</span>
                  <span class="text-white font-medium">{{ platform }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Architecture</span>
                  <span class="text-white font-medium">{{ arch }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Logs Tab -->
        <div v-else-if="activeTab === 'logs'" class="p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-purple-400" />
            System Logs
          </h3>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-wrench-screwdriver" class="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-white mb-2">Coming Soon</h4>
            <p class="text-purple-200/70">Server logs monitoring will be available here.</p>
          </div>
        </div>

        <!-- Jobs Tab (Future) -->
        <div v-else-if="activeTab === 'jobs'" class="p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-queue-list" class="w-5 h-5 text-purple-400" />
            Job Queue
          </h3>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-wrench-screwdriver" class="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-white mb-2">Coming Soon</h4>
            <p class="text-purple-200/70">Job queue management will be available here.</p>
          </div>
        </div>

        <!-- Calls Tab -->
        <div v-else-if="activeTab === 'calls'" class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <UIcon name="i-heroicons-phone" class="w-5 h-5 text-purple-400" />
              ElevenLabs Call Management
            </h3>
            <div class="flex gap-2">
              <UButton 
                @click="refreshElevenLabsData" 
                size="sm" 
                variant="soft"
                :loading="elevenLabsLoading"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
                Refresh
              </UButton>
              <UButton 
                @click="openSettingsModal" 
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
          <div v-if="!elevenLabsSettings?.hasApiKey" class="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-orange-400" />
              <div>
                <h4 class="text-sm font-medium text-orange-200">ElevenLabs API Configuration Required</h4>
                <p class="text-xs text-orange-200/70 mt-1">Configure your ElevenLabs API key in settings to use call management features.</p>
              </div>
              <UButton @click="openSettingsModal" size="sm" color="orange" variant="soft">
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
                  @click="activeCallTab = subTab.id"
                  :class="[
                    activeCallTab === subTab.id
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

            <!-- Conversations -->
            <div v-if="activeCallTab === 'conversations'">
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
                      <UButton @click="viewConversation(conversation.conversation_id)" size="sm" variant="soft">
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

            <!-- Agents -->
            <div v-if="activeCallTab === 'agents'">
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

            <!-- Batch Calls -->
            <div v-if="activeCallTab === 'batch'">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-md font-medium text-white">Batch Calls</h4>
                <UButton @click="createBatchCall" size="sm" color="green" variant="soft">
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
                        @click="viewBatchCall(batch.id)" 
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
            
            <!-- Outbound Calls -->
            <div v-if="activeCallTab === 'outbound'">
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
        </div>

        <!-- Settings Tab -->
        <div v-else-if="activeTab === 'settings'" class="p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-purple-400" />
            System Settings
          </h3>
          <div class="space-y-4">
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 class="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
                Admin Configuration
              </h4>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Admin Email</span>
                  <span class="text-white font-medium">{{ adminUser?.email }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Email Verified</span>
                  <UBadge :color="adminUser?.is_email_verified ? 'green' : 'red'" size="sm">
                    {{ adminUser?.is_email_verified ? 'Verified' : 'Unverified' }}
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Patreon Integration -->
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 class="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
                <UIcon name="i-simple-icons-patreon" class="w-4 h-4" />
                Patreon Integration
              </h4>
              
              <!-- Connected State -->
              <div v-if="patreonStatus?.connected" class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Status</span>
                  <UBadge color="green" size="sm">Connected</UBadge>
                </div>
                <div v-if="patreonStatus.user" class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Account</span>
                  <span class="text-white font-medium">{{ patreonStatus.user.name || patreonStatus.user.email }}</span>
                </div>
                <div v-if="patreonStatus.campaign" class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Campaign</span>
                  <span class="text-white font-medium">{{ patreonStatus.campaign.name }}</span>
                </div>
                <div v-if="patreonStatus.campaign" class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Patrons</span>
                  <span class="text-white font-medium">{{ patreonStatus.campaign.patronCount }}</span>
                </div>
                <div v-if="patreonStatus.campaignError" class="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                  <p class="text-xs text-orange-200">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 mr-1 inline" />
                    {{ patreonStatus.campaignError }}
                  </p>
                </div>
                <div class="pt-2 flex gap-2 flex-wrap">
                  <UButton 
                    @click="refreshPatreonStatus" 
                    size="sm" 
                    variant="soft"
                    :loading="patreonLoading"
                  >
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
                    Aktualisieren
                  </UButton>
                  <UButton 
                    @click="syncPatreonFunding" 
                    size="sm" 
                    color="green" 
                    variant="soft"
                    :loading="syncLoading"
                  >
                    <UIcon name="i-heroicons-currency-euro" class="w-4 h-4 mr-1" />
                    Funding sync
                  </UButton>
                  <UButton 
                    @click="disconnectPatreon" 
                    size="sm" 
                    color="red" 
                    variant="soft"
                    :loading="patreonLoading"
                  >
                    Trennen
                  </UButton>
                </div>
              </div>

              <!-- Not Connected State -->
              <div v-else class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-purple-200/70">Status</span>
                  <UBadge color="orange" size="sm">Not Connected</UBadge>
                </div>
                
                <p class="text-xs text-purple-200/60">
                  Verbinde dein Patreon-Account, um automatisch Finanzierungsdaten zu synchronisieren.
                </p>
                
                <!-- Simple Connect Button -->
                <div class="pt-2">
                  <UButton 
                    @click="loginWithPatreon" 
                    size="sm" 
                    color="orange"
                    :loading="patreonLoading"
                    class="w-full justify-center"
                  >
                    <UIcon name="i-simple-icons-patreon" class="w-4 h-4 mr-2" />
                    Mit Patreon anmelden
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ElevenLabs Settings Modal -->
    <div 
      v-if="showSettingsModal" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click="showSettingsModal = false"
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
              @click="showSettingsModal = false" 
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
                  v-model="settingsForm.apiKey"
                  type="password"
                  placeholder="Enter your ElevenLabs API key"
                  :disabled="settingsSaving"
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
                  v-model="settingsForm.webhookSecret"
                  type="password"
                  placeholder="Enter webhook secret for HMAC validation"
                  :disabled="settingsSaving"
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p class="text-xs text-white/60 mt-2">
                  Used for secure webhook validation. Configure this in your ElevenLabs webhook settings.
                </p>
              </div>

              <!-- Current Status -->
              <div v-if="elevenLabsSettings?.hasApiKey" class="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-400" />
                  <span class="text-sm font-medium text-green-300">
                    API Key Currently Configured
                  </span>
                </div>
                <p class="text-xs text-green-400/80">
                  Preview: {{ elevenLabsSettings.apiKeyPreview }}
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
                </div>
                <p class="text-xs text-blue-300/60 mt-3">
                  Configure these URLs in your ElevenLabs dashboard under webhook settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 pt-4 border-t border-white/10 bg-white/5">
          <div class="flex justify-end gap-3">
            <button 
              @click="showSettingsModal = false"
              :disabled="settingsSaving"
              class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              @click="saveSettings"
              :disabled="!settingsForm.apiKey.trim() || settingsSaving"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon v-if="settingsSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-check" class="w-4 h-4" />
              {{ settingsSaving ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation Details Modal -->
    <div 
      v-if="showConversationModal && selectedConversation" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click="showConversationModal = false"
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
                <p class="text-sm text-white/60">{{ selectedConversation.agent_name || 'Unknown Agent' }}</p>
              </div>
            </div>
            <button 
              @click="showConversationModal = false" 
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
                    <code class="text-blue-300 bg-blue-900/40 px-2 py-1 rounded text-xs">{{ selectedConversation.conversation_id }}</code>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/60">Agent ID:</span>
                    <code class="text-blue-300 bg-blue-900/40 px-2 py-1 rounded text-xs">{{ selectedConversation.agent_id }}</code>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/60">Status:</span>
                    <UBadge 
                      :color="selectedConversation.status === 'done' ? 'green' : selectedConversation.status === 'failed' ? 'red' : 'blue'" 
                      size="sm"
                    >
                      {{ selectedConversation.status }}
                    </UBadge>
                  </div>
                </div>
              </div>

              <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 class="text-sm font-medium text-white/80 mb-3">Call Metrics</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-white/60">Duration:</span>
                    <span class="text-white">{{ formatDuration(selectedConversation.metadata?.call_duration_secs || 0) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/60">Start Time:</span>
                    <span class="text-white">{{ formatDate(selectedConversation.metadata?.start_time_unix_secs || 0) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/60">Audio Available:</span>
                    <UBadge :color="selectedConversation.has_audio ? 'green' : 'gray'" size="sm">
                      {{ selectedConversation.has_audio ? 'Yes' : 'No' }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transcript -->
            <div v-if="selectedConversation.transcript?.length" class="space-y-4">
              <h4 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
                Conversation Transcript
              </h4>
              
              <div class="bg-white/5 rounded-xl p-4 border border-white/10 max-h-96 overflow-y-auto">
                <div class="space-y-4">
                  <div 
                    v-for="(message, index) in selectedConversation.transcript" 
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
              @click="showConversationModal = false"
              class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Call Creation Modal -->
    <div 
      v-if="showBatchCallModal" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click="showBatchCallModal = false"
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
              @click="showBatchCallModal = false" 
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
                    v-model="batchCallForm.call_name"
                    type="text"
                    placeholder="Enter a name for this batch call"
                    :disabled="batchCallSaving"
                    class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                  <label class="block text-sm font-medium text-white/80 mb-2">
                    Agent *
                  </label>
                  <select
                    v-model="batchCallForm.agent_id"
                    :disabled="batchCallSaving"
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
                  v-model="batchCallForm.agent_phone_number_id"
                  type="text"
                  placeholder="Enter the phone number ID for the agent"
                  :disabled="batchCallSaving"
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
                  v-model="batchCallForm.recipients"
                  rows="6"
                  placeholder="Enter phone numbers (one per line)&#10;+1234567890&#10;+1987654321&#10;+1555123456"
                  :disabled="batchCallSaving"
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
                    v-for="(variable, index) in batchCallVariables" 
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
                  v-model="batchCallForm.scheduled_time_unix"
                  type="datetime-local"
                  :disabled="batchCallSaving"
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
              @click="showBatchCallModal = false"
              :disabled="batchCallSaving"
              class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              @click="submitBatchCall"
              :disabled="!batchCallForm.call_name.trim() || !batchCallForm.agent_id || !batchCallForm.recipients.trim() || batchCallSaving"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon v-if="batchCallSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-heroicons-phone-arrow-up-right" class="w-4 h-4" />
              {{ batchCallSaving ? 'Creating...' : 'Create Batch Call' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Outbound Call Creation Modal -->
  <div 
    v-if="showOutboundCallModal" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="showOutboundCallModal = false"
  >
    <div @click.stop class="w-full max-w-xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <UIcon name="i-heroicons-phone-arrow-down-left" class="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Make Outbound Call</h2>
              <p class="text-sm text-white/60">Initiate a single outbound call</p>
            </div>
          </div>
          <button 
            @click="showOutboundCallModal = false" 
            class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="space-y-4">
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Agent *
            </label>
            <select
              v-model="outboundCallForm.agent_id"
              :disabled="outboundCallSaving"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an agent</option>
              <option v-for="agent in agents" :key="agent.agent_id" :value="agent.agent_id">
                {{ agent.name }}
              </option>
            </select>
          </div>
          
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Agent Phone Number ID *
            </label>
            <input
              v-model="outboundCallForm.agent_phone_number_id"
              type="text"
              placeholder="Enter the phone number ID for the agent"
              :disabled="outboundCallSaving"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-medium text-white/80 mb-2">
              Phone Number *
            </label>
            <input
              v-model="outboundCallForm.to_number"
              type="text"
              placeholder="Enter the phone number to call (e.g., +1234567890)"
              :disabled="outboundCallSaving"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-6 pt-4 border-t border-white/10 bg-white/5">
        <div class="flex justify-end gap-3">
          <button 
            @click="showOutboundCallModal = false"
            :disabled="outboundCallSaving"
            class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            @click="submitOutboundCall"
            :disabled="!outboundCallForm.agent_id || !outboundCallForm.agent_phone_number_id || !outboundCallForm.to_number.trim() || outboundCallSaving"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="outboundCallSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-phone-arrow-down-left" class="w-4 h-4" />
            {{ outboundCallSaving ? 'Calling...' : 'Make Call' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Batch Call Detail Modal -->
  <div 
    v-if="showBatchCallDetailModal" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="showBatchCallDetailModal = false"
  >
    <div @click.stop class="w-full max-w-4xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <UIcon name="i-heroicons-phone-arrow-up-right" class="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Batch Call Details</h2>
              <p class="text-sm text-white/60">{{ selectedBatchCall?.name }}</p>
            </div>
          </div>
          <button 
            @click="showBatchCallDetailModal = false" 
            class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div v-if="batchCallLoading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
          <p class="text-purple-200/70 text-sm">Loading batch call details...</p>
        </div>
        
        <div v-else-if="selectedBatchCall" class="space-y-6">
          <!-- Overview -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 class="text-lg font-semibold text-purple-300 mb-3">Overview</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-white/60">Status</p>
                <UBadge 
                  :color="selectedBatchCall.status === 'completed' ? 'green' : selectedBatchCall.status === 'failed' ? 'red' : selectedBatchCall.status === 'cancelled' ? 'orange' : 'blue'"
                  size="sm"
                >
                  {{ selectedBatchCall.status }}
                </UBadge>
              </div>
              <div>
                <p class="text-sm text-white/60">Total Calls</p>
                <p class="text-white font-medium">{{ selectedBatchCall.total_calls_scheduled }}</p>
              </div>
              <div>
                <p class="text-sm text-white/60">Dispatched</p>
                <p class="text-white font-medium">{{ selectedBatchCall.total_calls_dispatched }}</p>
              </div>
              <div>
                <p class="text-sm text-white/60">Created</p>
                <p class="text-white font-medium">{{ formatDate(selectedBatchCall.created_at_unix) }}</p>
              </div>
            </div>
          </div>
          
          <!-- Recipients -->
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 class="text-lg font-semibold text-purple-300 mb-3">Recipients ({{ selectedBatchCall.recipients?.length || 0 }})</h4>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div 
                v-for="(recipient, index) in selectedBatchCall.recipients" 
                :key="index"
                class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span class="text-xs font-medium text-blue-300">{{ index + 1 }}</span>
                  </div>
                  <div>
                    <p class="text-white font-medium">{{ recipient.phone_number }}</p>
                    <p class="text-xs text-white/60">{{ recipient.conversation_id ? 'Conversation ID: ' + recipient.conversation_id : 'No conversation' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <UBadge 
                    :color="recipient.status === 'completed' ? 'green' : recipient.status === 'failed' ? 'red' : recipient.status === 'cancelled' ? 'orange' : 'blue'"
                    size="sm"
                  >
                    {{ recipient.status }}
                  </UBadge>
                  <span class="text-xs text-white/60">{{ formatDate(recipient.updated_at_unix) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-6 pt-4 border-t border-white/10 bg-white/5">
        <div class="flex justify-end">
          <button 
            @click="showBatchCallDetailModal = false"
            class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Agent Edit Modal -->
  <div 
    v-if="showAgentEditModal" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="showAgentEditModal = false"
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
              <p class="text-sm text-white/60">{{ selectedAgent?.name }}</p>
            </div>
          </div>
          <button 
            @click="showAgentEditModal = false" 
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
                <p class="text-white font-medium">{{ selectedAgent?.name }}</p>
              </div>
              <div>
                <p class="text-sm text-white/60">Agent ID</p>
                <p class="text-white font-medium font-mono text-xs">{{ selectedAgent?.agent_id }}</p>
              </div>
              <div v-if="selectedAgent?.language">
                <p class="text-sm text-white/60">Language</p>
                <p class="text-white font-medium">{{ selectedAgent.language }}</p>
              </div>
              <div v-if="selectedAgent?.voice_id">
                <p class="text-sm text-white/60">Voice ID</p>
                <p class="text-white font-medium font-mono text-xs">{{ selectedAgent.voice_id }}</p>
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
                v-model="agentEditForm.prompt"
                rows="12"
                placeholder="Enter the system prompt that defines how this agent should behave..."
                :disabled="agentEditSaving"
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
            @click="showAgentEditModal = false"
            :disabled="agentEditSaving"
            class="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            @click="saveAgentEdit"
            :disabled="agentEditSaving"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="agentEditSaving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-heroicons-check" class="w-4 h-4" />
            {{ agentEditSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Admin Dashboard'
})

const config = useRuntimeConfig()
const activeTab = ref('performance')

const tabs = [
  { id: 'performance', name: 'Performance', icon: 'i-heroicons-chart-bar' },
  { id: 'logs', name: 'Logs', icon: 'i-heroicons-document-text' },
  { id: 'jobs', name: 'Jobs', icon: 'i-heroicons-queue-list' },
  { id: 'calls', name: 'Calls', icon: 'i-heroicons-phone' },
  { id: 'settings', name: 'Settings', icon: 'i-heroicons-cog-6-tooth' }
]

// Admin verification
const sessionId = ref<string | null>(null)
const adminData = ref<any>(null)
const pending = ref(true)
const error = ref<any>(null)

// System metrics
const systemMetrics = ref<any>(null)

// Patreon integration
const patreonStatus = ref<any>(null)
const patreonLoading = ref(false)
const syncLoading = ref(false)

// ElevenLabs integration
const activeCallTab = ref('conversations')
const elevenLabsSettings = ref<any>(null)
const elevenLabsLoading = ref(false)
const conversations = ref<any[]>([])
const conversationsLoading = ref(false)
const conversationFilter = ref('')
const agents = ref<any[]>([])
const agentsLoading = ref(false)
const batchCalls = ref<any[]>([])
const batchCallsLoading = ref(false)

// Outbound calls data  
const outboundCalls = ref<any[]>([])
const outboundCallsLoading = ref(false)
const showOutboundCallModal = ref(false)
const outboundCallForm = ref({
  agent_id: '',
  agent_phone_number_id: '',
  to_number: '',
  conversation_initiation_client_data: null
})
const outboundCallSaving = ref(false)

// ElevenLabs settings modal
const showSettingsModal = ref(false)
const settingsForm = ref({
  apiKey: '',
  webhookSecret: ''
})
const settingsSaving = ref(false)

// Conversation details modal
const showConversationModal = ref(false)
const selectedConversation = ref<any>(null)
const conversationLoading = ref(false)

// Batch call creation modal
const showBatchCallModal = ref(false)
const batchCallForm = ref({
  call_name: '',
  agent_id: '',
  agent_phone_number_id: '',
  scheduled_time_unix: null,
  recipients: '',
  variables: {}
})
const batchCallSaving = ref(false)
const showBatchCallDetailModal = ref(false)
const selectedBatchCall = ref(null)
const batchCallLoading = ref(false)

// Agent edit modal
const showAgentEditModal = ref(false)
const selectedAgent = ref(null)
const agentEditForm = ref({
  prompt: ''
})
const agentEditSaving = ref(false)
const batchCallVariables = ref([])

// Variable display helpers
const currentDateVariable = '{{currentDate}}'
const currentTimeVariable = '{{currentTime}}'
const currentDateTimeVariable = '{{currentDateTime}}'

// Variable management functions
const addVariable = () => {
  batchCallVariables.value.push({ key: '', value: '' })
}

const removeVariable = (index) => {
  batchCallVariables.value.splice(index, 1)
}

// Agent edit functions
const editAgent = async (agent) => {
  try {
    selectedAgent.value = agent
    // Get the full agent details with prompt
    const agentDetails = await $fetch(`/api/admin/elevenlabs/agents/${agent.agent_id}`, {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    
    agentEditForm.value = {
      prompt: agentDetails.conversation_config?.agent?.prompt?.prompt || ''
    }
    
    showAgentEditModal.value = true
  } catch (error) {
    console.error('Failed to load agent details:', error)
    const toast = useToast()
    toast.add({
      title: 'Load failed',
      description: 'Could not load agent details',
      color: 'red',
      timeout: 3000
    })
  }
}

const saveAgentEdit = async () => {
  if (!selectedAgent.value) return
  
  try {
    agentEditSaving.value = true
    
    await $fetch(`/api/admin/elevenlabs/agents/${selectedAgent.value.agent_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      },
      body: {
        prompt: agentEditForm.value.prompt
      }
    })
    
    // Update the agent in the local list
    const agentIndex = agents.value.findIndex(a => a.agent_id === selectedAgent.value.agent_id)
    if (agentIndex !== -1) {
      const updatedAgent = { ...agents.value[agentIndex] }
      if (!updatedAgent.conversation_config) {
        updatedAgent.conversation_config = { agent: { prompt: {} } }
      }
      if (!updatedAgent.conversation_config.agent) {
        updatedAgent.conversation_config.agent = { prompt: {} }
      }
      if (!updatedAgent.conversation_config.agent.prompt) {
        updatedAgent.conversation_config.agent.prompt = {}
      }
      updatedAgent.conversation_config.agent.prompt.prompt = agentEditForm.value.prompt
      agents.value[agentIndex] = updatedAgent
    }
    
    showAgentEditModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Agent Updated',
      description: 'Agent system prompt has been updated successfully',
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    console.error('Failed to update agent:', error)
    const toast = useToast()
    toast.add({
      title: 'Update failed',
      description: error.data?.message || 'Could not update agent',
      color: 'red',
      timeout: 5000
    })
  } finally {
    agentEditSaving.value = false
  }
}

const callTabs = [
  { id: 'conversations', name: 'Conversations', icon: 'i-heroicons-chat-bubble-left-right' },
  { id: 'agents', name: 'Agents', icon: 'i-heroicons-user-group' },
  { id: 'batch', name: 'Batch Calls', icon: 'i-heroicons-phone-arrow-up-right' },
  { id: 'outbound', name: 'Outbound Calls', icon: 'i-heroicons-phone-arrow-down-left' }
]

// Admin verification and redirect logic
onMounted(async () => {
  try {
    sessionId.value = localStorage.getItem('patreon_debug_session')
    const sessionExpiry = localStorage.getItem('patreon_debug_session_expires')
    
    if (!sessionId.value || !sessionExpiry || Date.now() >= parseInt(sessionExpiry)) {
      await navigateTo('/debug?admin_required=true&error=patreon_auth_required')
      return
    }

    // Verify admin access (server will check email)
    adminData.value = await $fetch('/api/admin/verify', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })

    if (!adminData.value.isAdmin) {
      await navigateTo('/debug?admin_required=true&error=access_denied')
      return
    }

    // Get system metrics
    systemMetrics.value = await $fetch('/api/admin/system-metrics', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })

    // Get Patreon status
    patreonStatus.value = await $fetch('/api/admin/patreon/status', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })

    // Get ElevenLabs settings
    try {
      elevenLabsSettings.value = await $fetch('/api/admin/elevenlabs/settings', {
        headers: {
          'Authorization': `Bearer ${sessionId.value}`
        }
      })
      
      // Load ElevenLabs data if API key is configured
      if (elevenLabsSettings.value?.hasApiKey) {
        await loadElevenLabsData()
      }
    } catch (elevenLabsError) {
      console.warn('ElevenLabs settings not available:', elevenLabsError)
    }

  } catch (err: any) {
    console.error('Admin access error:', err)
    if (err.statusCode === 403) {
      await navigateTo('/debug?admin_required=true&error=access_denied')
    } else if (err.statusCode === 401) {
      await navigateTo('/debug?admin_required=true&error=patreon_auth_required')
    } else if (err.statusCode === 500 && err.data?.message?.includes('Admin email not configured')) {
      await navigateTo('/debug?admin_required=true&error=admin_email_not_configured')
    } else {
      await navigateTo('/debug?admin_required=true&error=unknown')
    }
  } finally {
    pending.value = false
  }
})

const adminUser = computed(() => adminData.value?.user)
const version = config.public.version

const uptime = computed(() => systemMetrics.value?.uptime || 0)
const memoryUsage = computed(() => systemMetrics.value?.memory || { used: 0, total: 0 })
const nodeVersion = computed(() => systemMetrics.value?.nodeVersion || 'Unknown')
const platform = computed(() => systemMetrics.value?.platform || 'Unknown')
const arch = computed(() => systemMetrics.value?.arch || 'Unknown')


// Helper functions
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

const formatDate = (unixTimestamp: number) => {
  return new Date(unixTimestamp * 1000).toLocaleString('de-DE')
}

// Computed properties
const filteredConversations = computed(() => {
  if (!conversationFilter.value) return conversations.value
  
  const filter = conversationFilter.value.toLowerCase()
  return conversations.value.filter(conv => 
    conv.agent_name.toLowerCase().includes(filter) ||
    conv.conversation_id.toLowerCase().includes(filter) ||
    conv.call_successful.toLowerCase().includes(filter)
  )
})

const webhookBaseUrl = computed(() => {
  if (process.client && window?.location?.origin) {
    return window.location.origin
  }
  return 'https://your-domain.com'
})

// Patreon integration methods
const loginWithPatreon = async () => {
  try {
    patreonLoading.value = true
    
    // Call the login endpoint to get the OAuth URL
    const response = await $fetch('/api/admin/patreon/login', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })

    if (response.authUrl) {
      // Redirect to Patreon OAuth
      window.location.href = response.authUrl
    } else {
      throw new Error('No authorization URL received')
    }
    
  } catch (error: any) {
    console.error('Failed to login with Patreon:', error)
    const toast = useToast()
    toast.add({
      title: 'Login failed',
      description: error.data?.message || 'Failed to start Patreon login',
      color: 'red',
      timeout: 5000
    })
    patreonLoading.value = false
  }
}

const refreshPatreonStatus = async () => {
  try {
    patreonLoading.value = true
    
    patreonStatus.value = await $fetch('/api/admin/patreon/status', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    
    const toast = useToast()
    toast.add({
      title: 'Status aktualisiert',
      description: 'Patreon-Status wurde neu geladen',
      color: 'green',
      timeout: 2000
    })
  } catch (error: any) {
    console.error('Failed to refresh Patreon status:', error)
    const toast = useToast()
    toast.add({
      title: 'Aktualisierung fehlgeschlagen',
      description: error.data?.message || 'Status konnte nicht aktualisiert werden',
      color: 'red',
      timeout: 5000
    })
  } finally {
    patreonLoading.value = false
  }
}

const disconnectPatreon = async () => {
  try {
    patreonLoading.value = true
    
    const response = await $fetch('/api/admin/patreon/disconnect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })

    patreonStatus.value = { connected: false, status: 'not_configured' }
    
    const toast = useToast()
    toast.add({
      title: 'Patreon getrennt',
      description: 'Campaign-Verbindung wurde entfernt',
      color: 'orange',
      timeout: 3000
    })
  } catch (error: any) {
    console.error('Failed to disconnect Patreon:', error)
    const toast = useToast()
    toast.add({
      title: 'Trennen fehlgeschlagen',
      description: error.data?.message || 'Patreon konnte nicht getrennt werden',
      color: 'red',
      timeout: 5000
    })
  } finally {
    patreonLoading.value = false
  }
}

const syncPatreonFunding = async () => {
  try {
    syncLoading.value = true
    
    const response = await $fetch('/api/admin/sync-patreon', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })

    const toast = useToast()
    if (response.success) {
      const { data, patreonData } = response
      toast.add({
        title: 'Funding synchronisiert',
        description: `€${patreonData?.monthlyRevenueEur?.toFixed(2) || '0.00'} von ${patreonData?.activePatronCount || 0} aktiven Patrons`,
        color: 'green',
        timeout: 5000
      })
    } else {
      toast.add({
        title: 'Sync teilweise erfolgreich',
        description: 'Daten wurden aktualisiert, aber einige Informationen fehlen',
        color: 'yellow',
        timeout: 5000
      })
    }
  } catch (error: any) {
    console.error('Failed to sync Patreon funding:', error)
    const toast = useToast()
    toast.add({
      title: 'Sync fehlgeschlagen',
      description: error.data?.message || 'Funding-Daten konnten nicht synchronisiert werden',
      color: 'red',
      timeout: 5000
    })
  } finally {
    syncLoading.value = false
  }
}

// ElevenLabs integration methods
const loadElevenLabsData = async () => {
  await Promise.all([
    loadConversations(),
    loadAgents(),
    loadBatchCalls(),
    loadOutboundCalls()
  ])
}

const refreshElevenLabsData = async () => {
  try {
    elevenLabsLoading.value = true
    await loadElevenLabsData()
    
    const toast = useToast()
    toast.add({
      title: 'Data refreshed',
      description: 'ElevenLabs data has been updated',
      color: 'green',
      timeout: 2000
    })
  } catch (error: any) {
    console.error('Failed to refresh ElevenLabs data:', error)
    const toast = useToast()
    toast.add({
      title: 'Refresh failed',
      description: error.data?.message || 'Failed to refresh data',
      color: 'red',
      timeout: 5000
    })
  } finally {
    elevenLabsLoading.value = false
  }
}

const loadConversations = async () => {
  try {
    conversationsLoading.value = true
    const result = await $fetch('/api/admin/elevenlabs/conversations', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    conversations.value = result.conversations || []
  } catch (error) {
    console.error('Failed to load conversations:', error)
    conversations.value = []
  } finally {
    conversationsLoading.value = false
  }
}

const loadAgents = async () => {
  try {
    agentsLoading.value = true
    const result = await $fetch('/api/admin/elevenlabs/agents', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    agents.value = result.agents || []
  } catch (error) {
    console.error('Failed to load agents:', error)
    agents.value = []
  } finally {
    agentsLoading.value = false
  }
}

const loadBatchCalls = async () => {
  try {
    batchCallsLoading.value = true
    const result = await $fetch('/api/admin/elevenlabs/batch-calls', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    batchCalls.value = result.batch_calls || []
  } catch (error) {
    console.error('Failed to load batch calls:', error)
    batchCalls.value = []
    // If batch calling is not available, hide the tab
    if (error.statusCode === 404) {
      console.log('Batch calling not available on this account')
    }
  } finally {
    batchCallsLoading.value = false
  }
}

const viewConversation = async (conversationId: string) => {
  try {
    conversationLoading.value = true
    const conversation = await $fetch(`/api/admin/elevenlabs/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    
    selectedConversation.value = conversation
    showConversationModal.value = true
  } catch (error: any) {
    console.error('Failed to view conversation:', error)
    const toast = useToast()
    toast.add({
      title: 'Failed to load conversation',
      description: error.data?.message || 'Could not retrieve conversation details',
      color: 'red',
      timeout: 5000
    })
  } finally {
    conversationLoading.value = false
  }
}

const deleteConversation = async (conversationId: string) => {
  if (!confirm('Are you sure you want to delete this conversation?')) {
    return
  }
  
  try {
    await $fetch(`/api/admin/elevenlabs/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    
    // Remove from local array
    conversations.value = conversations.value.filter(c => c.conversation_id !== conversationId)
    
    const toast = useToast()
    toast.add({
      title: 'Conversation deleted',
      description: 'Conversation has been permanently removed',
      color: 'orange',
      timeout: 3000
    })
  } catch (error: any) {
    console.error('Failed to delete conversation:', error)
    const toast = useToast()
    toast.add({
      title: 'Delete failed',
      description: error.data?.message || 'Could not delete conversation',
      color: 'red',
      timeout: 5000
    })
  }
}

const createAgent = () => {
  // TODO: Open agent creation modal
  const toast = useToast()
  toast.add({
    title: 'Coming soon',
    description: 'Agent creation UI will be available soon',
    color: 'blue',
    timeout: 3000
  })
}


const deleteAgent = async (agentId: string) => {
  if (!confirm('Are you sure you want to delete this agent?')) {
    return
  }
  
  try {
    await $fetch(`/api/admin/elevenlabs/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    
    // Remove from local array
    agents.value = agents.value.filter(a => a.agent_id !== agentId)
    
    const toast = useToast()
    toast.add({
      title: 'Agent deleted',
      description: 'Agent has been permanently removed',
      color: 'orange',
      timeout: 3000
    })
  } catch (error: any) {
    console.error('Failed to delete agent:', error)
    const toast = useToast()
    toast.add({
      title: 'Delete failed',
      description: error.data?.message || 'Could not delete agent',
      color: 'red',
      timeout: 5000
    })
  }
}

const createBatchCall = () => {
  // Load saved form data from localStorage
  const savedData = localStorage.getItem('elevenlabs_batch_call_form')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      batchCallForm.value = {
        call_name: '',
        agent_id: parsed.agent_id || '',
        agent_phone_number_id: parsed.agent_phone_number_id || '',
        scheduled_time_unix: null,
        recipients: parsed.recipients || '',
        variables: parsed.variables || {}
      }
      // Load variables into array format
      batchCallVariables.value = Object.entries(parsed.variables || {}).map(([key, value]) => ({ key, value }))
    } catch (error) {
      console.error('Failed to load saved form data:', error)
    }
  } else {
    // Reset form
    batchCallForm.value = {
      call_name: '',
      agent_id: '',
      agent_phone_number_id: '',
      scheduled_time_unix: null,
      recipients: '',
      variables: {}
    }
    batchCallVariables.value = []
  }
  showBatchCallModal.value = true
}

const saveBatchCallFormData = () => {
  // Convert variables array to object
  const variables = {}
  batchCallVariables.value.forEach(variable => {
    if (variable.key.trim() && variable.value.trim()) {
      variables[variable.key.trim()] = variable.value.trim()
    }
  })
  
  // Save form data to localStorage (excluding call_name which should be unique)
  const dataToSave = {
    agent_id: batchCallForm.value.agent_id,
    agent_phone_number_id: batchCallForm.value.agent_phone_number_id,
    recipients: batchCallForm.value.recipients,
    variables
  }
  localStorage.setItem('elevenlabs_batch_call_form', JSON.stringify(dataToSave))
}

const viewBatchCall = async (batchId: string) => {
  try {
    batchCallLoading.value = true
    selectedBatchCall.value = await $fetch(`/api/admin/elevenlabs/batch-calls/${batchId}`, {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    showBatchCallDetailModal.value = true
  } catch (error) {
    console.error('Failed to load batch call details:', error)
    const toast = useToast()
    toast.add({
      title: 'Load failed',
      description: 'Could not load batch call details',
      color: 'red',
      timeout: 3000
    })
  } finally {
    batchCallLoading.value = false
  }
}

const submitBatchCall = async () => {
  if (!batchCallForm.value.call_name.trim() || !batchCallForm.value.agent_id || !batchCallForm.value.recipients.trim()) {
    const toast = useToast()
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields',
      color: 'red',
      timeout: 3000
    })
    return
  }

  try {
    batchCallSaving.value = true
    
    // Save form data to localStorage
    saveBatchCallFormData()
    
    // Parse recipients (one phone number per line)
    const recipients = batchCallForm.value.recipients
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(phone_number => ({ phone_number }))
    
    if (recipients.length === 0) {
      throw new Error('No valid phone numbers found')
    }
    
    // Convert variables array to object and add built-in variables
    const now = new Date()
    const variables = {
      currentDate: now.toISOString().split('T')[0], // YYYY-MM-DD
      currentTime: now.toTimeString().split(' ')[0], // HH:MM:SS
      currentDateTime: now.toISOString().replace('T', ' ').split('.')[0] // YYYY-MM-DD HH:MM:SS
    }
    
    // Add custom variables
    batchCallVariables.value.forEach(variable => {
      if (variable.key.trim() && variable.value.trim()) {
        variables[variable.key.trim()] = variable.value.trim()
      }
    })

    const requestBody = {
      call_name: batchCallForm.value.call_name.trim(),
      agent_id: batchCallForm.value.agent_id,
      agent_phone_number_id: batchCallForm.value.agent_phone_number_id,
      recipients,
      variables
    }

    if (batchCallForm.value.scheduled_time_unix) {
      requestBody.scheduled_time_unix = batchCallForm.value.scheduled_time_unix
    }

    const result = await $fetch('/api/admin/elevenlabs/batch-calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      },
      body: requestBody
    })

    // Add to local list
    batchCalls.value.unshift(result)
    
    showBatchCallModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Batch Call Created',
      description: `Successfully created batch call with ${recipients.length} recipients`,
      color: 'green',
      timeout: 5000
    })
  } catch (error: any) {
    console.error('Failed to create batch call:', error)
    const toast = useToast()
    toast.add({
      title: 'Creation Failed',
      description: error.data?.message || 'Could not create batch call',
      color: 'red',
      timeout: 5000
    })
  } finally {
    batchCallSaving.value = false
  }
}

const cancelBatchCall = async (batchId: string) => {
  if (!confirm('Are you sure you want to cancel this batch call?')) {
    return
  }
  
  try {
    await $fetch(`/api/admin/elevenlabs/batch-calls/${batchId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    
    // Update local status
    const batch = batchCalls.value.find(b => b.id === batchId)
    if (batch) {
      batch.status = 'cancelled'
    }
    
    const toast = useToast()
    toast.add({
      title: 'Batch call cancelled',
      description: 'Batch call has been cancelled successfully',
      color: 'orange',
      timeout: 3000
    })
  } catch (error: any) {
    console.error('Failed to cancel batch call:', error)
    const toast = useToast()
    toast.add({
      title: 'Cancel failed',
      description: error.data?.message || 'Could not cancel batch call',
      color: 'red',
      timeout: 5000
    })
  }
}

// Outbound calls functions
const loadOutboundCalls = async () => {
  try {
    outboundCallsLoading.value = true
    const result = await $fetch('/api/admin/elevenlabs/outbound-calls', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })
    outboundCalls.value = result.calls || []
  } catch (error) {
    console.error('Failed to load outbound calls:', error)
    outboundCalls.value = []
  } finally {
    outboundCallsLoading.value = false
  }
}

const createOutboundCall = () => {
  outboundCallForm.value = {
    agent_id: '',
    agent_phone_number_id: '',
    to_number: '',
    conversation_initiation_client_data: null
  }
  showOutboundCallModal.value = true
}

const submitOutboundCall = async () => {
  if (!outboundCallForm.value.agent_id || !outboundCallForm.value.agent_phone_number_id || !outboundCallForm.value.to_number.trim()) {
    const toast = useToast()
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields',
      color: 'red',
      timeout: 3000
    })
    return
  }

  try {
    outboundCallSaving.value = true
    
    const result = await $fetch('/api/admin/elevenlabs/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      },
      body: {
        agent_id: outboundCallForm.value.agent_id,
        agent_phone_number_id: outboundCallForm.value.agent_phone_number_id,
        to_number: outboundCallForm.value.to_number.trim(),
        conversation_initiation_client_data: outboundCallForm.value.conversation_initiation_client_data
      }
    })
    
    const toast = useToast()
    if (result.success) {
      toast.add({
        title: 'Call initiated',
        description: 'Outbound call has been initiated successfully',
        color: 'green',
        timeout: 3000
      })
      
      // Reload outbound calls
      loadOutboundCalls()
      
      showOutboundCallModal.value = false
    } else {
      toast.add({
        title: 'Call failed',
        description: result.message || 'Failed to initiate outbound call',
        color: 'red',
        timeout: 5000
      })
    }
  } catch (error: any) {
    console.error('Failed to create outbound call:', error)
    const toast = useToast()
    toast.add({
      title: 'Call failed',
      description: error.data?.message || 'Failed to initiate outbound call',
      color: 'red',
      timeout: 5000
    })
  } finally {
    outboundCallSaving.value = false
  }
}

const openSettingsModal = () => {
  // Reset form
  settingsForm.value = {
    apiKey: '',
    webhookSecret: ''
  }
  showSettingsModal.value = true
}

const saveSettings = async () => {
  if (!settingsForm.value.apiKey.trim()) {
    const toast = useToast()
    toast.add({
      title: 'API Key Required',
      description: 'Please enter your ElevenLabs API key',
      color: 'red',
      timeout: 3000
    })
    return
  }

  try {
    settingsSaving.value = true
    
    await $fetch('/api/admin/elevenlabs/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      },
      body: {
        apiKey: settingsForm.value.apiKey.trim(),
        webhookSecret: settingsForm.value.webhookSecret.trim() || undefined
      }
    })

    // Refresh settings
    elevenLabsSettings.value = await $fetch('/api/admin/elevenlabs/settings', {
      headers: {
        'Authorization': `Bearer ${sessionId.value}`
      }
    })

    // Load ElevenLabs data if API key is now configured
    if (elevenLabsSettings.value?.hasApiKey) {
      await loadElevenLabsData()
    }

    showSettingsModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Settings Saved',
      description: 'ElevenLabs configuration has been updated successfully',
      color: 'green',
      timeout: 3000
    })
  } catch (error: any) {
    console.error('Failed to save ElevenLabs settings:', error)
    const toast = useToast()
    toast.add({
      title: 'Save Failed',
      description: error.data?.message || 'Failed to save settings',
      color: 'red',
      timeout: 5000
    })
  } finally {
    settingsSaving.value = false
  }
}

</script>