<template>
  <PageCard>
    <!-- Loading State -->
    <div v-if="isAuthChecking" class="relative z-10 flex w-full max-w-md flex-col items-center justify-center py-16 px-4 sm:px-6">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
        <p class="text-purple-200 text-sm">Lade Daten...</p>
      </div>
    </div>

    <!-- Authenticated Content -->
    <div v-else class="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 px-4 sm:px-6">
      <!-- Patron Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-400/80 to-purple-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          💜
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Patron Dashboard
        </h1>
        <p class="text-sm text-purple-100/80">
          Übersicht über deinen Patron-Status und verfügbare Funktionen
        </p>
      </div>

      <!-- Authenticated Content -->
      <div class="w-full space-y-6">
        
        <!-- User Profile -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-white text-lg">Profil</h3>
            <div class="flex gap-2">
              <UBadge 
                :color="patreonAuth.isPatron.value ? 'purple' : 'gray'" 
                variant="soft"
              >
                {{ patreonAuth.isPatron.value ? 'Aktiver Patron' : 'Kein Patron' }}
              </UBadge>
            </div>
          </div>
          
          <div v-if="patreonAuth.user.value" class="flex items-center gap-4">
            <div v-if="patreonAuth.user.value.image_url" class="w-16 h-16 rounded-full overflow-hidden">
              <img 
                :src="patreonAuth.user.value.image_url" 
                :alt="patreonAuth.user.value.full_name"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-user" class="w-8 h-8 text-purple-300" />
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-white text-lg">{{ patreonAuth.user.value.full_name }}</h4>
              <p class="text-sm text-gray-300">{{ patreonAuth.user.value.email }}</p>
              <div class="flex items-center gap-2 mt-2">
                <UBadge 
                  :color="patreonAuth.user.value.is_email_verified ? 'green' : 'yellow'" 
                  size="sm"
                >
                  {{ patreonAuth.user.value.is_email_verified ? 'E-Mail verifiziert' : 'E-Mail nicht verifiziert' }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>

        <!-- Patron Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Current Tier -->
          <div class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-purple-300 text-base">Aktuelle Mitgliedschaft</h3>
              <UIcon name="i-heroicons-star" class="w-5 h-5 text-purple-400" />
            </div>
            
            <div v-if="patreonAuth.getHighestTier.value" class="space-y-3">
              <div>
                <h4 class="font-bold text-purple-300 text-lg">{{ patreonAuth.getHighestTier.value.title }}</h4>
                <p class="text-sm text-purple-200">
                  {{ patreonAuth.formatCurrency(patreonAuth.getHighestTier.value.amount_cents, patreonAuth.getHighestTier.value.currency) }} / Monat
                </p>
              </div>
              
              <div v-if="patreonAuth.getHighestTier.value.description" class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p class="text-sm text-purple-100">{{ patreonAuth.getHighestTier.value.description }}</p>
              </div>
            </div>
            
            <div v-else class="text-center py-8">
              <UIcon name="i-heroicons-x-circle" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-300">Keine aktive Mitgliedschaft</p>
              <p class="text-sm text-gray-400 mt-1">Werde Patron, um Zugang zu erweiterten Funktionen zu erhalten</p>
            </div>
          </div>

          <!-- Lifetime Support -->
          <div class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-green-300 text-base">Gesamtunterstützung</h3>
              <UIcon name="i-heroicons-currency-dollar" class="w-5 h-5 text-green-400" />
            </div>
            
            <div v-if="patreonAuth.lifetimeSupport.value > 0" class="space-y-3">
              <div>
                <h4 class="font-bold text-green-300 text-lg">{{ patreonAuth.formatCurrency(patreonAuth.lifetimeSupport.value) }}</h4>
                <p class="text-sm text-green-200">
                  Vielen Dank für deine Unterstützung! 💜
                </p>
              </div>
            </div>
            
            <div v-else class="text-center py-8">
              <UIcon name="i-heroicons-heart" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-300">Noch keine Unterstützung</p>
              <p class="text-sm text-gray-400 mt-1">Werde Patron, um das Projekt zu unterstützen</p>
            </div>
          </div>
        </div>

        <!-- Entitlements & Usage -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-white text-lg">Funktionen & Nutzung</h3>
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-blue-400" />
          </div>
          
          <!-- Loading State for Usage Data -->
          <div v-if="usage.isLoading.value" class="flex items-center justify-center py-8">
            <div class="text-center">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
              <p class="text-blue-200 text-sm">Lade Nutzungsdaten...</p>
            </div>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <!-- AI Voice Calls -->
            <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-phone" class="w-5 h-5 text-blue-400" />
                  <span class="font-medium text-white">AI-Anrufe</span>
                </div>
                <UBadge 
                  :color="usage.canUseFeature('aiCalls') ? 'green' : 'gray'" 
                  size="sm"
                >
                  {{ usage.getFeatureStatusText('aiCalls') }}
                </UBadge>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-300">Verwendet:</span>
                  <span class="text-white font-medium">{{ usage.usageData?.aiCalls?.used || 0 }} / {{ usage.usageData?.aiCalls?.limit || 0 }}</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${usage.getUsagePercentage('aiCalls')}%` }"
                  ></div>
                </div>
                <p class="text-xs text-gray-400">
                  KARL kann für dich anrufen
                </p>
              </div>
            </div>

            <!-- Email Sending -->
            <div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-yellow-400" />
                  <span class="font-medium text-white">E-Mail senden</span>
                </div>
                <UBadge 
                  :color="usage.usageData?.emailSending?.status === 'active' ? 'green' : 'yellow'" 
                  size="sm"
                >
                  {{ usage.getFeatureStatusText('emailSending') }}
                </UBadge>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-300">Verwendet:</span>
                  <span class="text-white font-medium">{{ usage.usageData?.emailSending?.used || 0 }} / {{ usage.usageData?.emailSending?.limit || 0 }}</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${usage.getUsagePercentage('emailSending')}%` }"
                  ></div>
                </div>
                <p class="text-xs text-gray-400">
                  Sende E-Mails an Therapeuten (geplant)
                </p>
              </div>
            </div>

            <!-- Email Receiving -->
            <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-inbox" class="w-5 h-5 text-orange-400" />
                  <span class="font-medium text-white">E-Mail empfangen</span>
                </div>
                <UBadge 
                  :color="usage.usageData?.emailReceiving?.status === 'active' ? 'green' : 'yellow'" 
                  size="sm"
                >
                  {{ usage.getFeatureStatusText('emailReceiving') }}
                </UBadge>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-300">Verwendet:</span>
                  <span class="text-white font-medium">{{ usage.usageData?.emailReceiving?.used || 0 }} / {{ usage.usageData?.emailReceiving?.limit || 0 }}</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${usage.getUsagePercentage('emailReceiving')}%` }"
                  ></div>
                </div>
                <p class="text-xs text-gray-400">
                  Empfange Antworten von Therapeuten (geplant)
                </p>
              </div>
            </div>

          </div>
        </div>

        <!-- Usage History -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-white text-lg">Nutzungshistorie</h3>
            <div class="flex gap-2">
              <button 
                @click="usage.refreshUsageData"
                :disabled="usage.isLoading.value || usage.isHistoryLoading.value"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm disabled:opacity-50"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': usage.isLoading.value || usage.isHistoryLoading.value }" />
                {{ (usage.isLoading.value || usage.isHistoryLoading.value) ? 'Lädt...' : 'Aktualisieren' }}
              </button>
            </div>
          </div>
          
          <!-- Loading State for Usage History -->
          <div v-if="usage.isHistoryLoading.value" class="flex items-center justify-center py-8">
            <div class="text-center">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
              <p class="text-blue-200 text-sm">Lade Nutzungshistorie...</p>
            </div>
          </div>
          
          <div v-else class="space-y-4">
            <div v-if="!usage.usageHistory.value || usage.usageHistory.value.length === 0" class="text-center py-8">
              <UIcon name="i-heroicons-clock" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-300">Noch keine Nutzungshistorie</p>
              <p class="text-sm text-gray-400 mt-1">Verwende KARL, um deine Aktivitäten hier zu sehen</p>
            </div>
            
            <div v-else class="space-y-3 max-h-64 overflow-y-auto">
              <div 
                v-for="entry in (usage.usageHistory.value || [])" 
                :key="entry.id"
                class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <UIcon :name="usage.getUsageIcon(entry.type)" class="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ entry.description }}</p>
                    <p class="text-xs text-gray-400">{{ usage.formatDate(entry.date) }}</p>
                  </div>
                </div>
                <UBadge 
                  :color="entry.status === 'success' ? 'green' : entry.status === 'error' ? 'red' : 'yellow'"
                  size="sm"
                >
                  {{ usage.getStatusText(entry.status) }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 justify-center">
          <button 
            @click="patreonAuth.getUserProfile"
            :disabled="patreonAuth.isLoading.value"
            class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all text-sm font-medium disabled:opacity-50"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            Patron-Status aktualisieren
          </button>
          
          <button 
            @click="$router.push('/logout')"
            class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </div>

      <!-- Back Button -->
      <button 
        @click="$router.push('/therapists')" 
        class="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-white text-sm font-medium transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95"
      >
        <div class="relative z-10 flex items-center gap-2">
          <span class="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          Zurück zu Therapeuten
        </div>
        <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </button>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
// Import composables explicitly
import { usePatreonOAuth } from '~/composables/usePatreonOAuth'
import { useUsageTracking } from '~/composables/useUsageTracking'

// Meta configuration
definePageMeta({
  title: 'Patron Dashboard'
})

// Composables
const patreonAuth = usePatreonOAuth()
const usage = useUsageTracking()

// Loading state for auth check
const isAuthChecking = ref(true)

// Client-side authentication check and redirect logic (like admin page)
onMounted(async () => {
  try {
    // Wait for auth to initialize
    if (patreonAuth.isInitializing.value) {
      await new Promise<void>((resolve) => {
        const unwatch = watch(patreonAuth.isInitializing, (initializing) => {
          if (!initializing) {
            unwatch()
            resolve()
          }
        })
      })
    }
    
    // Check if authenticated
    if (!patreonAuth.isAuthenticated.value) {
      await navigateTo('/login?access_required=true&error=patreon_auth_required&return_to=/patron')
    } else {
      // User is authenticated, show the page
      isAuthChecking.value = false
    }
  } catch (error) {
    console.error('Auth check error:', error)
    await navigateTo('/login?access_required=true&error=auth_failed&return_to=/patron')
  }
})
</script>