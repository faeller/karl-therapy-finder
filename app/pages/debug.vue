<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 px-4 sm:px-6">
      <!-- Debug Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-400/80 to-purple-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          🐛
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Debug & Testing
        </h1>
        <p class="text-sm text-purple-100/80">
          Development tools and testing utilities
        </p>
      </div>

      <!-- Admin Access Notification -->
      <div v-if="adminRequired" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-red-500/40">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-red-300 text-base flex items-center gap-2">
            <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5" />
            Admin Access Required
          </h3>
          <UBadge color="red" variant="soft">Access Denied</UBadge>
        </div>
        <p class="text-red-200/90 text-sm mb-3">
          {{ getAdminErrorMessage(adminError) }}
        </p>
        <div v-if="adminError === 'patreon_auth_required'" class="text-xs text-purple-100/70">
          Use the Patreon OAuth section below to authenticate and gain admin access.
        </div>
      </div>

      <!-- Debug Mode Toggle -->
      <div class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-purple-300 text-base">Debug Mode</h3>
          <UBadge color="green" variant="soft">Feature Toggle</UBadge>
        </div>
        <p class="text-purple-100/80 text-sm mb-4">
          Enable experimental features like email extraction and contact automation
        </p>
        
        <ClientOnly>
          <div class="flex items-center gap-3">
            <button
              @click="toggleDebugMode(!debugMode)"
              :class="[
                'relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out',
                debugMode 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-600 hover:bg-gray-500'
              ]"
            >
              <span 
                :class="[
                  'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out',
                  debugMode ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="text-sm text-white font-medium">
              {{ debugMode ? 'Enabled' : 'Disabled' }}
            </span>
            <UBadge 
              v-if="debugMode" 
              color="green" 
              variant="soft" 
              size="xs"
            >
              ACTIVE
            </UBadge>
          </div>
        </ClientOnly>
      </div>

      <!-- Debug Tools -->
      <div class="w-full space-y-6">
        
        <!-- PDF Testing Section -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-purple-300 text-base">PDF Testing</h3>
            <UBadge color="purple" variant="soft">Test Tools</UBadge>
          </div>
          <p class="text-purple-100/80 text-sm mb-4">
            Test PDF generation with various edge cases and long content
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              @click="generateLongNamesPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
              Generate Long Names PDF
            </button>
            
            <button 
              @click="generateEmptyPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-document" class="w-4 h-4" />
              Generate Empty PDF
            </button>
            
            <button 
              @click="generateMaxLengthPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
              Generate Maximum Length PDF
            </button>
            
            <button 
              @click="generateSpecialCharsPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-language" class="w-4 h-4" />
              Generate Special Characters PDF
            </button>
          </div>
        </div>

        <!-- LocalStorage Debug -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-green-300 text-base">LocalStorage Debug</h3>
            <div class="flex gap-2">
              <UBadge color="green" variant="soft">{{ Object.keys(storageData).length }} Keys</UBadge>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <button 
              @click="loadStorageData"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all text-sm"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
              Refresh Data
            </button>
            
            <button 
              @click="clearAllStorage"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              Clear All
            </button>
            
            <div class="flex flex-col gap-2">
              <button 
                @click="exportStorageData"
                class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm"
              >
                <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
                Export JSON
              </button>
              <button 
                @click="exportAsBase64"
                class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all text-sm"
              >
                <UIcon name="i-heroicons-code-bracket" class="w-4 h-4" />
                Export Base64
              </button>
              <div class="relative">
                <button 
                  @click="exportEncrypted"
                  class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all text-sm w-full"
                >
                  <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" />
                  Export Encrypted
                </button>
                <div v-if="!isSecureEncryptionAvailable" class="absolute -top-1 -right-1">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title="Insecure encryption warning"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div v-for="(value, key) in storageData" :key="key" class="p-3 rounded-lg bg-white/5 border border-white/10">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-white text-sm">{{ key }}</h4>
                <UBadge color="gray" size="xs">{{ getDataSize(value) }}</UBadge>
              </div>
              <pre class="text-xs text-green-300 bg-black/20 p-2 rounded overflow-x-auto">{{ formatStorageValue(value) }}</pre>
            </div>
          </div>
        </div>

        <!-- Import Data Section -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-orange-300 text-base">Import Data</h3>
            <UBadge color="orange" variant="soft">JSON/Base64/Encrypted</UBadge>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-orange-200 mb-2">
                Select import format:
              </label>
              <div class="flex gap-2 mb-4">
                <button 
                  @click="importFormat = 'json'"
                  :class="[
                    'px-3 py-1 rounded text-xs font-medium transition-all',
                    importFormat === 'json' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                  ]"
                >
                  JSON
                </button>
                <button 
                  @click="importFormat = 'base64'"
                  :class="[
                    'px-3 py-1 rounded text-xs font-medium transition-all',
                    importFormat === 'base64' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                  ]"
                >
                  Base64
                </button>
                <div class="relative">
                  <button 
                    @click="importFormat = 'encrypted'"
                    :class="[
                      'px-3 py-1 rounded text-xs font-medium transition-all',
                      importFormat === 'encrypted' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                    ]"
                  >
                    Encrypted
                  </button>
                  <div v-if="!isSecureEncryptionAvailable" class="absolute -top-1 -right-1">
                    <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Insecure encryption warning"></div>
                  </div>
                </div>
              </div>
              
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-orange-200 mb-2">
                    Upload file:
                  </label>
                  <input
                    ref="fileInput"
                    type="file"
                    @change="handleFileUpload"
                    accept=".karl,.karl.encrypted,.json,.base64,.encrypted,.txt"
                    class="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500/20 file:text-orange-300 hover:file:bg-orange-500/30 file:cursor-pointer cursor-pointer"
                  />
                </div>
                
                <div class="text-center text-orange-300 text-sm">
                  or
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-orange-200 mb-2">
                    Paste data:
                  </label>
                  <textarea
                    v-model="importData"
                    rows="4"
                    placeholder="Paste your exported data here..."
                    class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div v-if="importFormat === 'encrypted'" class="space-y-2">
              <div v-if="!isSecureEncryptionAvailable" class="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-yellow-400" />
                  <span class="text-sm font-medium text-yellow-400">Security Warning</span>
                </div>
                <p class="text-xs text-yellow-300">
                  Your browser doesn't support secure encryption. Data will be encrypted using crypto-js (a discontinued library). While more secure than basic encryption, this is not recommended for sensitive information. Please use a modern browser (Chrome, Firefox, Safari, Edge) for proper security.
                </p>
              </div>
              
              <label class="block text-sm font-medium text-orange-200">
                Password:
              </label>
              <input
                v-model="importPassword"
                type="password"
                placeholder="Enter password for encrypted data"
                class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            
            <div class="flex gap-2">
              <button 
                @click="importStorageData"
                :disabled="!importData.trim()"
                class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
                Import Data
              </button>
              <button 
                @click="clearImportForm"
                class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        <!-- Patreon OAuth Section -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-orange-300 text-base">Patreon OAuth</h3>
            <div class="flex gap-2">
              <UBadge 
                :color="patreonAuth.isAuthenticated.value ? 'green' : 'gray'" 
                variant="soft"
              >
                {{ patreonAuth.isAuthenticated.value ? 'Connected' : 'Disconnected' }}
              </UBadge>
              <UBadge v-if="patreonAuth.isPatron.value" color="purple" variant="soft">
                Patron
              </UBadge>
            </div>
          </div>
          
          <p class="text-orange-100/80 text-sm mb-4">
            Connect to Patreon to verify supporter status and access tier information
          </p>

          <!-- Authentication Status -->
          <div v-if="!patreonAuth.isAuthenticated.value" class="space-y-3">
            <button 
              @click="patreonAuth.startOAuthFlow"
              :disabled="patreonAuth.isLoading.value"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon name="i-heroicons-link" class="w-4 h-4" />
              {{ patreonAuth.isLoading.value ? 'Connecting...' : 'Connect to Patreon' }}
            </button>
            
            <div v-if="patreonAuth.authError.value" class="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div class="flex items-center gap-2 mb-1">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-400" />
                <span class="text-sm font-medium text-red-400">Authentication Error</span>
              </div>
              <p class="text-xs text-red-300">{{ patreonAuth.authError.value }}</p>
            </div>
          </div>

          <!-- Connected State -->
          <div v-else class="space-y-4">
            <!-- Session Status -->
            <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-heroicons-clock" class="w-4 h-4 text-blue-400" />
                <span class="text-sm font-medium text-white">Debug Session</span>
              </div>
              <div class="text-sm text-blue-200">
                <template v-if="sessionStatus">
                  <span v-if="!sessionStatus.expired">
                    Expires in {{ sessionStatus.timeLeftMinutes }}m {{ sessionStatus.timeLeftSeconds }}s
                  </span>
                  <span v-else class="text-red-300">Session expired</span>
                </template>
                <span v-else>Session active</span>
              </div>
            </div>

            <!-- User Info -->
            <div v-if="patreonAuth.user.value" class="p-3 bg-white/5 border border-white/10 rounded-lg">
              <div class="flex items-center gap-3 mb-3">
                <div v-if="patreonAuth.user.value.image_url" class="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    :src="patreonAuth.user.value.image_url" 
                    :alt="patreonAuth.user.value.full_name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-else class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-user" class="w-5 h-5 text-orange-300" />
                </div>
                <div>
                  <h4 class="font-medium text-white text-sm">{{ patreonAuth.user.value.full_name }}</h4>
                  <p class="text-xs text-gray-300">{{ patreonAuth.user.value.email }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <UBadge 
                      :color="patreonAuth.user.value.is_email_verified ? 'green' : 'yellow'" 
                      size="xs"
                    >
                      {{ patreonAuth.user.value.is_email_verified ? 'Verified' : 'Unverified' }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tier Information -->
            <div class="space-y-3">
              <h4 class="font-medium text-orange-200 text-sm">Supporter Status</h4>
              
              <!-- Patron Status -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-heart" class="w-4 h-4 text-pink-400" />
                    <span class="text-sm font-medium text-white">Patron Status</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <UBadge 
                      :color="patreonAuth.isPatron.value ? 'green' : 'gray'" 
                      variant="soft"
                      size="sm"
                    >
                      {{ patreonAuth.isPatron.value ? 'Active Patron' : 'Not a Patron' }}
                    </UBadge>
                  </div>
                </div>

                <div class="p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4 text-green-400" />
                    <span class="text-sm font-medium text-white">Lifetime Support</span>
                  </div>
                  <p class="text-lg font-bold text-green-300">
                    {{ patreonAuth.formatCurrency(patreonAuth.lifetimeSupport.value) }}
                  </p>
                </div>
              </div>

              <!-- Current Tier -->
              <div v-if="patreonAuth.getHighestTier.value" class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-star" class="w-4 h-4 text-purple-400" />
                  <span class="text-sm font-medium text-white">Current Tier</span>
                </div>
                <div class="space-y-1">
                  <h5 class="font-bold text-purple-300">{{ patreonAuth.getHighestTier.value.title }}</h5>
                  <p class="text-sm text-purple-200">
                    {{ patreonAuth.formatCurrency(patreonAuth.getHighestTier.value.amount_cents, patreonAuth.getHighestTier.value.currency) }} / month
                  </p>
                  <p v-if="patreonAuth.getHighestTier.value.description" class="text-xs text-purple-100/80">
                    {{ patreonAuth.getHighestTier.value.description }}
                  </p>
                </div>
              </div>

              <!-- All Memberships -->
              <div v-if="patreonAuth.memberships.value.length" class="space-y-2">
                <h5 class="font-medium text-orange-200 text-sm">All Memberships</h5>
                <div class="space-y-2 max-h-32 overflow-y-auto">
                  <div 
                    v-for="membership in patreonAuth.memberships.value" 
                    :key="membership.campaign_id"
                    class="p-2 bg-white/5 border border-white/10 rounded text-xs"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-medium text-white">Campaign {{ membership.campaign_id.slice(-8) }}</span>
                      <UBadge 
                        :color="membership.patron_status === 'active_patron' ? 'green' : 'gray'"
                        size="xs"
                      >
                        {{ membership.patron_status }}
                      </UBadge>
                    </div>
                    <div class="text-gray-300">
                      <p>Lifetime: {{ patreonAuth.formatCurrency(membership.lifetime_support_cents) }}</p>
                      <p>Current: {{ patreonAuth.formatCurrency(membership.currently_entitled_amount_cents) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button 
                @click="patreonAuth.getUserProfile"
                :disabled="patreonAuth.isLoading.value"
                class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all text-sm disabled:opacity-50"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                Refresh
              </button>
              
              <NuxtLink 
                to="/admin"
                class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm"
              >
                <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
                Admin Dashboard
              </NuxtLink>
              
              <button 
                @click="patreonAuth.logout"
                class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <button 
          @click="$router.push('/therapists')" 
          class="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-white text-sm font-medium transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95"
        >
          <div class="relative z-10 flex items-center gap-2">
            <span class="group-hover:-translate-x-1 transition-transform duration-300">←</span>
            Back to Therapeuten
          </div>
          <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
// Meta configuration
definePageMeta({
  title: 'Debug & Testing'
})

// Storage data for debugging
const storageData = ref<Record<string, any>>({})

// Debug mode toggle
const { debugMode, toggleDebugMode } = useDebugMode()

// Patreon OAuth integration
const patreonAuth = usePatreonOAuth()

// Admin access notifications
const route = useRoute()
const adminRequired = computed(() => route.query.admin_required === 'true')
const adminError = computed(() => route.query.error as string)

const getAdminErrorMessage = (error: string) => {
  switch (error) {
    case 'patreon_auth_required':
      return 'Please authenticate with Patreon to access the admin dashboard'
    case 'access_denied':
      return 'Access denied: Your Patreon email does not match the admin email'
    case 'admin_email_not_configured':
      return 'Admin email not configured in environment variables'
    default:
      return 'Unknown error occurred while accessing admin dashboard'
  }
}

// Session status with auto-refresh
const sessionStatus = ref(null)
const updateSessionStatus = () => {
  sessionStatus.value = patreonAuth.getSessionStatus()
}

// Update session status every second when authenticated
let sessionTimer = null
watch(() => patreonAuth.isAuthenticated.value, (authenticated) => {
  if (authenticated) {
    updateSessionStatus()
    sessionTimer = setInterval(updateSessionStatus, 1000)
  } else {
    if (sessionTimer) {
      clearInterval(sessionTimer)
      sessionTimer = null
    }
    sessionStatus.value = null
  }
}, { immediate: true })

onUnmounted(() => {
  if (sessionTimer) {
    clearInterval(sessionTimer)
  }
})

// Import/Export reactive variables
const importFormat = ref<'json' | 'base64' | 'encrypted'>('json')
const importData = ref('')
const importPassword = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Check if secure encryption is available
const isSecureEncryptionAvailable = ref(false)

// Check encryption support
const checkEncryptionSupport = () => {
  if (process.client) {
    isSecureEncryptionAvailable.value = !!(crypto && crypto.subtle)
  }
}

// Load localStorage data
const loadStorageData = () => {
  if (process.client) {
    const data: Record<string, any> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const value = localStorage.getItem(key)
          data[key] = value ? JSON.parse(value) : value
        } catch {
          data[key] = localStorage.getItem(key)
        }
      }
    }
    storageData.value = data
  }
}

// Clear all localStorage
const clearAllStorage = () => {
  if (process.client) {
    if (confirm('Are you sure you want to clear all localStorage data? This cannot be undone.')) {
      localStorage.clear()
      loadStorageData()
    }
  }
}

// Import crypto-js for fallback encryption
import CryptoJS from 'crypto-js'

// Crypto-js based encryption as fallback (DEPRECATED LIBRARY - use with caution!)
const cryptoJsEncrypt = (data: string, password: string): string => {
  console.warn('⚠️ SECURITY WARNING: Using crypto-js fallback encryption!')
  console.warn('📚 crypto-js is a discontinued library - please use a modern browser for proper security!')
  console.warn('🔒 While more secure than XOR, this is still not recommended for sensitive data')
  console.warn('📱 Consider using Chrome, Firefox, Safari, or Edge for secure Web Crypto API support')
  
  const encrypted = CryptoJS.AES.encrypt(data, password).toString()
  return encrypted
}

const cryptoJsDecrypt = (encryptedData: string, password: string): string => {
  console.warn('⚠️ SECURITY WARNING: Using crypto-js fallback decryption!')
  console.warn('📚 crypto-js is a discontinued library - please use a modern browser for proper security!')
  console.warn('🔓 While more secure than XOR, this is still not recommended for sensitive data')
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, password)
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
    
    // Check if decryption actually worked (empty string means wrong password)
    if (!decryptedString) {
      throw new Error('Wrong password')
    }
    
    return decryptedString
  } catch (error) {
    throw new Error('Wrong password')
  }
}

// Encryption/decryption utilities with fallback
const encryptData = async (data: string, password: string): Promise<string> => {
  try {
    // Try Web Crypto API first
    if (crypto.subtle) {
      console.log('🔐 Using Web Crypto API (AES-GCM) for encryption')
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      
      // Create a simple key from password (fixed length)
      const passwordBuffer = encoder.encode(password.padEnd(32, '0').substring(0, 32))
      
      // Import the key directly
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      )
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      // Encrypt the data
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      )
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encryptedData), iv.length)
      
      return 'webcrypto:' + btoa(String.fromCharCode(...combined))
    } else {
      console.warn('⚠️ Web Crypto API not available, falling back to crypto-js encryption')
      alert('🔒 SECURITY WARNING: Your browser does not support secure encryption!\n\n' +
            'The data will be encrypted using crypto-js (a discontinued library).\n' +
            'While more secure than basic encryption, this is not recommended for sensitive data.\n' +
            'Please use a modern browser (Chrome, Firefox, Safari, Edge) for proper security.\n\n' +
            'Continue only if you understand the security limitations.')
      // Fallback to crypto-js encryption
      return 'cryptojs:' + cryptoJsEncrypt(data, password)
    }
  } catch (error) {
    console.error('❌ Web Crypto API failed:', error)
    console.warn('⚠️ Falling back to crypto-js encryption')
    alert('🔒 SECURITY WARNING: Secure encryption failed!\n\n' +
          'The data will be encrypted using crypto-js (a discontinued library).\n' +
          'While more secure than basic encryption, this is not recommended for sensitive data.\n' +
          'Please use a modern browser (Chrome, Firefox, Safari, Edge) for proper security.\n\n' +
          'Continue only if you understand the security limitations.')
    // Fallback to crypto-js encryption
    return 'cryptojs:' + cryptoJsEncrypt(data, password)
  }
}

const decryptData = async (encryptedData: string, password: string): Promise<string> => {
  try {
    if (encryptedData.startsWith('webcrypto:')) {
      // Web Crypto API decryption
      const data = encryptedData.substring(10)
      const encoder = new TextEncoder()
      
      // Decode the base64 data
      const combined = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)))
      const iv = combined.slice(0, 12)
      const encryptedBytes = combined.slice(12)
      
      // Create the same key
      const passwordBuffer = encoder.encode(password.padEnd(32, '0').substring(0, 32))
      
      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      )
      
      // Decrypt the data
      try {
        const decryptedData = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          encryptedBytes
        )
        
        return new TextDecoder().decode(decryptedData)
      } catch (cryptoError) {
        throw new Error('Wrong password')
      }
    } else if (encryptedData.startsWith('cryptojs:')) {
      // Crypto-js decryption
      const data = encryptedData.substring(9)
      return cryptoJsDecrypt(data, password)
    } else if (encryptedData.startsWith('simple:')) {
      // Legacy simple XOR decryption (if any old data exists)
      const data = encryptedData.substring(7)
      console.warn('⚠️ SECURITY WARNING: Decrypting legacy simple XOR data - not secure!')
      console.warn('🔓 Please re-export your data for better security')
      // Simple fallback for legacy data
      const passwordBytes = new TextEncoder().encode(password)
      const encryptedBytes = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)))
      const decrypted = new Uint8Array(encryptedBytes.length)
      
      for (let i = 0; i < encryptedBytes.length; i++) {
        decrypted[i] = encryptedBytes[i] ^ passwordBytes[i % passwordBytes.length]
      }
      
      return new TextDecoder().decode(decrypted)
    } else if (encryptedData.startsWith('rc4:')) {
      // Legacy RC4 support (if any old data exists)
      const data = encryptedData.substring(4)
      console.warn('⚠️ SECURITY WARNING: Decrypting legacy RC4 data - not secure!')
      console.warn('🔓 Please re-export your data for better security')
      return cryptoJsDecrypt(data, password) // Use crypto-js for better compatibility
    } else {
      // Try to detect format and decrypt with crypto-js
      try {
        console.warn('⚠️ SECURITY WARNING: Attempting to decrypt unknown format with crypto-js!')
        return cryptoJsDecrypt(encryptedData, password)
      } catch {
        throw new Error('Invalid encrypted data format')
      }
    }
  } catch (error) {
    // Check if it's a wrong password error
    if (error instanceof Error && error.message === 'Wrong password') {
      throw new Error('Wrong password')
    }
    throw new Error(`Decryption failed: ${error}`)
  }
}

// Export storage data as JSON
const exportStorageData = () => {
  if (process.client) {
    const dataStr = JSON.stringify(storageData.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `karl-backup-${new Date().toISOString().split('T')[0]}.karl`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Export storage data as Base64
const exportAsBase64 = () => {
  if (process.client) {
    const dataStr = JSON.stringify(storageData.value)
    const base64Data = btoa(dataStr)
    const blob = new Blob([base64Data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `karl-backup-${new Date().toISOString().split('T')[0]}.karl`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Export storage data as encrypted
const exportEncrypted = async () => {
  if (process.client) {
    const password = prompt('Enter password for encryption:')
    if (!password) return
    
    try {
      const dataStr = JSON.stringify(storageData.value)
      const encryptedData = await encryptData(dataStr, password)
      const blob = new Blob([encryptedData], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `karl-backup-${new Date().toISOString().split('T')[0]}.karl.encrypted`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Encryption failed: ' + error)
    }
  }
}

// Import storage data
const importStorageData = async () => {
  if (!process.client || !importData.value.trim()) return
  
  try {
    let parsedData: Record<string, any>
    
    if (importFormat.value === 'json') {
      parsedData = JSON.parse(importData.value)
    } else if (importFormat.value === 'base64') {
      const decodedData = atob(importData.value)
      parsedData = JSON.parse(decodedData)
    } else if (importFormat.value === 'encrypted') {
      if (!importPassword.value) {
        alert('Password is required for encrypted data')
        return
      }
      const decryptedData = await decryptData(importData.value, importPassword.value)
      parsedData = JSON.parse(decryptedData)
    }
    
    const confirmation = confirm(
      `Are you sure you want to import this data? This will overwrite your current localStorage data.\n\nKeys to import: ${Object.keys(parsedData).join(', ')}`
    )
    
    if (confirmation) {
      for (const [key, value] of Object.entries(parsedData)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
      loadStorageData()
      clearImportForm()
      alert('Data imported successfully!')
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Wrong password') {
      alert('❌ Wrong password! Please check your password and try again.')
    } else {
      alert('Import failed: ' + error)
    }
  }
}

// Handle file upload
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    const content = await file.text()
    importData.value = content
    
    // Auto-detect format based on file extension
    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.karl.encrypted')) {
      importFormat.value = 'encrypted'
    } else if (fileName.endsWith('.karl')) {
      // For .karl files, try to detect content type
      try {
        JSON.parse(content)
        importFormat.value = 'json'
      } catch {
        // Check if it looks like base64
        if (/^[A-Za-z0-9+/]*={0,2}$/.test(content.trim())) {
          importFormat.value = 'base64'
        } else {
          importFormat.value = 'encrypted'
        }
      }
    } else {
      // Legacy extension handling
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension === 'json') {
        importFormat.value = 'json'
      } else if (extension === 'base64') {
        importFormat.value = 'base64'
      } else if (extension === 'encrypted') {
        importFormat.value = 'encrypted'
      } else if (extension === 'txt' || !extension) {
        // Try to auto-detect format based on content
        try {
          JSON.parse(content)
          importFormat.value = 'json'
        } catch {
          // Check if it looks like base64
          if (/^[A-Za-z0-9+/]*={0,2}$/.test(content.trim())) {
            importFormat.value = 'base64'
          } else {
            importFormat.value = 'encrypted'
          }
        }
      }
    }
  } catch (error) {
    alert('Error reading file: ' + error)
  }
}

// Clear import form
const clearImportForm = () => {
  importData.value = ''
  importPassword.value = ''
  importFormat.value = 'json'
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Format storage value for display
const formatStorageValue = (value: any): string => {
  if (typeof value === 'string') {
    return value.length > 200 ? value.substring(0, 200) + '...' : value
  }
  return JSON.stringify(value, null, 2).length > 400 
    ? JSON.stringify(value, null, 2).substring(0, 400) + '...'
    : JSON.stringify(value, null, 2)
}

// Get data size
const getDataSize = (value: any): string => {
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// Use shared PDF generator
const { previewPdf } = usePdfGenerator()

const generateLongNamesPdf = async () => {
  const testData = [
    {
      name: 'Dr. med. Maximilian Alexander von Hohenzollern-Sigmaringen',
      address: 'Psychiatrische Praxis für Psychoanalytische und Tiefenpsychologische Therapie, Maximilianstraße 123, 80539 München',
      date: '15.12.2024',
      time: '14:30',
      waitingTime: 'Ausführliche Erklärung der aktuellen Wartelistensituation: Aufgrund der hohen Nachfrage nach psychotherapeutischen Behandlungsplätzen und der begrenzten Kapazitäten sind derzeit keine freien Termine verfügbar'
    },
    {
      name: 'Prof. Dr. phil. Maria-Elisabeth Konstantinopolitanska-Schmidt',
      address: 'Zentrum für Verhaltenstherapie und Traumabehandlung',
      date: '16.12.2024',
      time: '09:15',
      waitingTime: 'Über 12 Monate Wartezeit'
    }
  ]
  await previewPdf(testData)
}

const generateEmptyPdf = async () => {
  await previewPdf([])
}

const generateMaxLengthPdf = async () => {
  const testData = Array.from({ length: 50 }, (_, i) => ({
    name: `Dr. Therapeut ${i + 1}`,
    address: `Praxis für Psychotherapie, Teststraße ${i + 1}, 12345 Berlin`,
    date: new Date(2024, 11, i % 30 + 1).toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    time: `${(9 + (i % 8)).toString().padStart(2, '0')}:${((i % 4) * 15).toString().padStart(2, '0')}`,
    waitingTime: i % 3 === 0 ? 'Über 6 Monate' : i % 3 === 1 ? 'Aktuell keine Behandlungsplätze verfügbar' : 'Über 3 Monate'
  }))
  await previewPdf(testData)
}

const generateSpecialCharsPdf = async () => {
  const testData = [
    {
      name: 'Dr. Müller-Weiß',
      address: 'Praxis für Ängste & Depressionen, Äußere Straße 1, 12345 Köln',
      date: '15.12.2024',
      time: '14:00',
      waitingTime: 'Längere Wartezeit wegen Überbelastung § 13 Abs. 3'
    },
    {
      name: 'José María González-Pérez',
      address: 'Terapía Española, Cañón del Río 23, 28001 Madrid',
      date: '16.12.2024',
      time: '15:30',
      waitingTime: 'Más de 6 meses de espera (>6 Monate)'
    },
    {
      name: 'Dr. François Lefèvre',
      address: 'Thérapie Française, Rue de l\'Église 45, 75001 Paris',
      date: '17.12.2024',
      time: '10:00',
      waitingTime: 'Délai d\'attente supérieur à 3 mois'
    }
  ]
  await previewPdf(testData)
}

// Initialize on mount
onMounted(() => {
  loadStorageData()
  checkEncryptionSupport()
})
</script>