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

        <!-- Calls Tab (Future) -->
        <div v-else-if="activeTab === 'calls'" class="p-6">
          <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-phone" class="w-5 h-5 text-purple-400" />
            Call Management
          </h3>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-phone" class="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-white mb-2">Coming Soon</h4>
            <p class="text-purple-200/70">Call triggering and management will be available here.</p>
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

</script>