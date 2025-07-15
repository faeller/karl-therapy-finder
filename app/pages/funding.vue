<template>
  <div class="relative">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div class="max-w-4xl mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Transparente 
            <span class="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Finanzierung
            </span>
          </h1>
          <p class="mt-6 text-xl text-blue-100/80 max-w-3xl mx-auto">
            KARL wird durch die Community finanziert. Hier siehst du, wie viel der Service kostet und ob die Kosten für {{ currentPeriod }} gedeckt sind.
          </p>
        </div>
      </div>
    </div>

    <!-- Support Section (Always Visible) -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div class="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
        <h3 class="text-2xl font-bold text-white mb-4 text-center">Unterstütze KARL</h3>
        <p class="text-blue-200/80 mb-6 max-w-2xl mx-auto text-center">
          KARL ist ein kostenloses Tool, das Menschen dabei hilft, schneller Therapieplätze zu finden. 
          Deine Unterstützung hilft dabei, den Service am Laufen zu halten und weiterzuentwickeln.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton 
            to="https://www.patreon.com/karlhelps"
            target="_blank"
            size="lg"
            class="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <UIcon name="i-simple-icons-patreon" class="w-5 h-5 mr-2" />
            Auf Patreon unterstützen
          </UButton>
          
          <UButton 
            to="https://github.com/faeller/karl-therapy-finder"
            target="_blank"
            variant="outline"
            size="lg"
            class="border-white/20 text-white hover:bg-white/10"
          >
            <UIcon name="i-simple-icons-github" class="w-5 h-5 mr-2" />
            Code auf GitHub
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="max-w-4xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
      <!-- Status Overview -->
      <div class="mb-12">
        <!-- Error State -->
        <div v-if="error" class="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-red-500/40">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-red-300 text-lg flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
              Fehler beim Laden
            </h3>
            <UBadge color="red" variant="soft">Fehler</UBadge>
          </div>
          <p class="text-red-200/90">{{ error.message }}</p>
        </div>
        
        <!-- Loading or Loaded Content -->
        <div v-else class="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-8">
          <div class="text-center mb-6">
            <!-- Loading State -->
            <div v-if="pending">
              <div class="flex items-center justify-center mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                  <div>
                    <div class="h-8 w-48 bg-white/20 rounded animate-pulse mb-2"></div>
                    <div class="h-4 w-32 bg-white/10 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Loaded Content -->
            <div v-else>
              <div class="flex items-center justify-center mb-4">
                <div class="flex items-start gap-4">
                  <UIcon 
                    :name="fundingData?.funding?.isCovered ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-circle'" 
                    :class="fundingData?.funding?.isCovered ? 'text-green-400' : 'text-orange-400'"
                    class="w-10 h-10 flex-shrink-0" 
                  />
                  <div>
                    <h2 class="text-3xl font-bold text-white leading-tight">
                      {{ fundingData?.funding?.isCovered ? 'Kosten gedeckt ✓' : 'Kosten nicht gedeckt' }}
                    </h2>
                    <p class="text-blue-200/70 text-sm mt-1">{{ currentPeriod }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <!-- Loading State -->
              <template v-if="pending">
                <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div class="h-8 w-20 bg-white/20 rounded mx-auto mb-2 animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/10 rounded mx-auto animate-pulse"></div>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div class="h-8 w-20 bg-white/20 rounded mx-auto mb-2 animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/10 rounded mx-auto animate-pulse"></div>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div class="h-8 w-12 bg-white/20 rounded mx-auto mb-2 animate-pulse"></div>
                  <div class="h-4 w-20 bg-white/10 rounded mx-auto animate-pulse"></div>
                </div>
              </template>
              
              <!-- Loaded Content -->
              <template v-else>
                <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div class="text-2xl font-bold text-white">{{ formatEuro(fundingData?.funding?.received || 0) }}</div>
                  <div class="text-blue-200/70 text-sm">Erhalten</div>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div class="text-2xl font-bold text-white">{{ formatEuro(fundingData?.funding?.required || 0) }}</div>
                  <div class="text-blue-200/70 text-sm">Benötigt</div>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div :class="fundingData?.funding?.isCovered ? 'text-green-400' : 'text-orange-400'" class="text-2xl font-bold">
                    {{ fundingData?.funding?.isCovered ? '0€' : formatEuro(fundingData?.funding?.deficit || 0) }}
                  </div>
                  <div class="text-blue-200/70 text-sm">{{ fundingData?.funding?.isCovered ? 'Überschuss' : 'Fehlbetrag' }}</div>
                </div>
              </template>
            </div>

            <!-- Progress Bar -->
            <div class="mt-6">
              <!-- Loading State -->
              <div v-if="pending">
                <div class="w-full bg-blue-900/30 rounded-full h-3">
                  <div class="h-3 bg-white/20 rounded-full w-2/3 animate-pulse"></div>
                </div>
                <div class="h-3 w-24 bg-white/10 rounded mx-auto mt-2 animate-pulse"></div>
              </div>
              
              <!-- Loaded Content -->
              <div v-else>
                <div class="w-full bg-blue-900/30 rounded-full h-3">
                  <div 
                    class="h-3 rounded-full transition-all duration-500"
                    :class="fundingData?.funding?.isCovered ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-orange-500 to-red-500'"
                    :style="{ width: `${Math.min(100, ((fundingData?.funding?.received || 0) / (fundingData?.funding?.required || 1)) * 100)}%` }"
                  ></div>
                </div>
                <div class="text-xs text-blue-200/60 text-center mt-2">
                  {{ Math.round(((fundingData?.funding?.received || 0) / (fundingData?.funding?.required || 1)) * 100) }}% finanziert
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Patreon Status (only show if data exists) -->
      <div v-if="pending || fundingData?.patreon" class="mb-12">
        <div class="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-8">
          <!-- Loading State -->
          <div v-if="pending">
            <div class="text-center mb-6">
              <div class="flex items-center justify-center gap-3 mb-4">
                <div class="w-8 h-8 bg-orange-500/20 rounded animate-pulse"></div>
                <div class="h-8 w-48 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div class="h-4 w-64 bg-white/10 rounded mx-auto animate-pulse mb-2"></div>
              <div class="h-3 w-40 bg-white/10 rounded mx-auto animate-pulse"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="h-8 w-6 bg-orange-400/20 rounded mx-auto mb-2 animate-pulse"></div>
                <div class="h-4 w-20 bg-white/10 rounded mx-auto animate-pulse"></div>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="h-8 w-8 bg-orange-400/20 rounded mx-auto mb-2 animate-pulse"></div>
                <div class="h-4 w-24 bg-white/10 rounded mx-auto animate-pulse"></div>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="h-8 w-16 bg-orange-400/20 rounded mx-auto mb-2 animate-pulse"></div>
                <div class="h-4 w-16 bg-white/10 rounded mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <!-- Loaded Patreon Content -->
          <div v-else>
            <div class="text-center mb-6">
              <div class="flex items-center justify-center gap-3 mb-4">
                <UIcon name="i-simple-icons-patreon" class="w-8 h-8 text-orange-500" />
                <h3 class="text-2xl font-bold text-white">Live Patreon Daten</h3>
              </div>
              <p class="text-blue-200/70">
                Aktuellste Finanzierungsdaten direkt von Patreon
                <span v-if="fundingData?.patreon?.lastSyncAt" class="block text-xs mt-1">
                  Zuletzt aktualisiert: {{ formatDate(fundingData.patreon.lastSyncAt) }}
                </span>
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="text-2xl font-bold text-orange-400">{{ fundingData?.patreon?.activePatronCount || 0 }}</div>
                <div class="text-blue-200/70 text-sm">Aktive Patrons</div>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="text-2xl font-bold text-orange-400">{{ fundingData?.patreon?.patronCount || 0 }}</div>
                <div class="text-blue-200/70 text-sm">Gesamt Follower</div>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="text-2xl font-bold text-orange-400">{{ formatEuro(fundingData?.patreon?.monthlyRevenueEur || 0) }}</div>
                <div class="text-blue-200/70 text-sm">Monatlich</div>
              </div>
            </div>

            <div v-if="fundingData?.patreon?.isMonthly" class="mt-4 text-center">
              <UBadge color="green" variant="soft" size="sm">
                <UIcon name="i-heroicons-calendar" class="w-3 h-3 mr-1" />
                Monatliche Abrechnung
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Cost Breakdown -->
      <div class="mb-12">
        <!-- Title -->
        <div class="text-center mb-6">
          <!-- Loading State -->
          <div v-if="pending" class="h-8 w-48 bg-white/20 rounded mx-auto animate-pulse"></div>
          <!-- Loaded Content -->
          <h3 v-else class="text-2xl font-bold text-white">Monatliche Kosten</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Loading State -->
          <template v-if="pending">
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 bg-blue-400/20 rounded animate-pulse"></div>
                <div class="h-5 w-28 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div class="h-8 w-16 bg-white/20 rounded mb-2 animate-pulse"></div>
              <div class="h-4 w-full bg-white/10 rounded animate-pulse"></div>
              <div class="h-4 w-3/4 bg-white/10 rounded animate-pulse mt-1"></div>
            </div>
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 bg-green-400/20 rounded animate-pulse"></div>
                <div class="h-5 w-16 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div class="h-8 w-12 bg-white/20 rounded mb-2 animate-pulse"></div>
              <div class="h-4 w-32 bg-white/10 rounded animate-pulse"></div>
            </div>
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 bg-purple-400/20 rounded animate-pulse"></div>
                <div class="h-5 w-24 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div class="h-8 w-16 bg-white/20 rounded mb-2 animate-pulse"></div>
              <div class="h-4 w-full bg-white/10 rounded animate-pulse"></div>
              <div class="h-4 w-4/5 bg-white/10 rounded animate-pulse mt-1"></div>
            </div>
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 bg-yellow-400/20 rounded animate-pulse"></div>
                <div class="h-5 w-16 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div class="h-8 w-16 bg-white/20 rounded mb-2 animate-pulse"></div>
              <div class="h-4 w-3/4 bg-white/10 rounded animate-pulse"></div>
            </div>
          </template>
          
          <!-- Loaded Content -->
          <template v-else>
            <!-- Phone Number -->
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <UIcon name="i-heroicons-phone" class="w-6 h-6 text-blue-400" />
                <h4 class="font-semibold text-white">Telefonnummer</h4>
              </div>
              <div class="text-2xl font-bold text-white mb-2">{{ formatEuro(fundingData?.costs?.phoneNumber || 0) }}</div>
              <p class="text-blue-200/70 text-sm">Monatliche Kosten für KARLs Telefonnummer bei Twilio</p>
            </div>

            <!-- Domain -->
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <UIcon name="i-heroicons-globe-alt" class="w-6 h-6 text-green-400" />
                <h4 class="font-semibold text-white">Domain</h4>
              </div>
              <div class="text-2xl font-bold text-white mb-2">{{ formatEuro(fundingData?.costs?.domain || 0) }}</div>
              <p class="text-blue-200/70 text-sm">karl-helps.org (10€/Jahr)</p>
            </div>

            <!-- Calling Infrastructure -->
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <UIcon name="i-heroicons-microphone" class="w-6 h-6 text-purple-400" />
                <h4 class="font-semibold text-white">Voice-Service</h4>
              </div>
              <div class="text-2xl font-bold text-white mb-2">{{ formatEuro(fundingData?.costs?.calling || 0) }}</div>
              <p class="text-blue-200/70 text-sm">Fixpreis + zusätzlich 28ct/min im Durchschnitt</p>
            </div>

            <!-- Hosting -->
            <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
              <div class="flex items-center gap-3 mb-4">
                <UIcon name="i-heroicons-server" class="w-6 h-6 text-yellow-400" />
                <h4 class="font-semibold text-white">Hosting</h4>
              </div>
              <div class="text-2xl font-bold text-white mb-2">{{ formatEuro(fundingData?.costs?.hosting || 0) }}</div>
              <p class="text-blue-200/70 text-sm">Server und Infrastruktur</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Funding History -->
      <div>
        <h3 class="text-2xl font-bold text-white mb-6 text-center">Finanzierungsverlauf</h3>
        
        <!-- Loading state for history -->
        <div v-if="historyPending">
          <!-- Summary stats skeleton -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div v-for="i in 4" :key="i" class="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div class="h-6 w-16 bg-white/20 rounded mx-auto mb-2 animate-pulse"></div>
              <div class="h-3 w-20 bg-white/10 rounded mx-auto animate-pulse"></div>
            </div>
          </div>
          
          <!-- History table skeleton -->
          <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <div class="p-4 space-y-3">
                <!-- Table header skeleton -->
                <div class="grid grid-cols-5 gap-4 pb-3 border-b border-white/10">
                  <div class="h-4 w-12 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                </div>
                <!-- Table rows skeleton -->
                <div v-for="i in 6" :key="i" class="grid grid-cols-5 gap-4 py-2">
                  <div class="h-4 w-20 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-6 w-20 bg-white/20 rounded animate-pulse"></div>
                  <div class="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- History content -->
        <div v-else-if="historyData && historyData.history && historyData.history.length > 0">
          <!-- Summary stats -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div class="text-lg font-bold text-white">{{ formatEuro(historyData?.summary?.totalReceived || 0) }}</div>
              <div class="text-xs text-blue-200/70">Gesamt erhalten</div>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div class="text-lg font-bold text-white">{{ formatEuro(historyData?.summary?.averageMonthlyReceived || 0) }}</div>
              <div class="text-xs text-blue-200/70">⌀ pro Monat</div>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div class="text-lg font-bold text-white">{{ historyData?.summary?.monthsTracked || 0 }}</div>
              <div class="text-xs text-blue-200/70">Monate erfasst</div>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div class="text-lg font-bold text-white">{{ Math.round(((historyData?.summary?.totalReceived || 0) / (historyData?.summary?.totalRequired || 1)) * 100) }}%</div>
              <div class="text-xs text-blue-200/70">Gesamt abgedeckt</div>
            </div>
          </div>
          
          <!-- History table -->
          <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-white/5">
                  <tr class="border-b border-white/10">
                    <th class="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Monat</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Erhalten</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Benötigt</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">Gesamt</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr 
                    v-for="record in (historyData?.history || []).slice().reverse()" 
                    :key="record.month"
                    class="hover:bg-white/5 transition-colors"
                  >
                    <td class="px-4 py-3 text-sm text-white font-medium">{{ formatMonth(record.month) }}</td>
                    <td class="px-4 py-3 text-sm text-white">{{ formatEuro(record.data.received || 0) }}</td>
                    <td class="px-4 py-3 text-sm text-purple-200/70">{{ formatEuro(record.data.required || 0) }}</td>
                    <td class="px-4 py-3 text-sm">
                      <UBadge 
                        :color="(record.data.received || 0) >= (record.data.required || 0) ? 'green' : 'orange'" 
                        size="sm"
                      >
                        {{ (record.data.received || 0) >= (record.data.required || 0) ? 'Gedeckt' : 'Nicht gedeckt' }}
                      </UBadge>
                    </td>
                    <td class="px-4 py-3 text-sm text-blue-200">{{ formatEuro(record.data.runningTotal || 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <!-- No history state -->
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-chart-bar-square" class="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
          <p class="text-purple-200/70">Noch keine Finanzierungsdaten verfügbar</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Funding - KARL'
})

// Check Patreon connection status and redirect if not connected
const { isConnected: patreonConnected } = usePatreonStatus()

// Redirect to home if Patreon is not connected
watch(patreonConnected, (connected) => {
  if (connected === false) {
    navigateTo('/')
  }
}, { immediate: true })

// Fetch funding status (client-only to prevent blocking)
const { data: fundingData, pending, error } = useFetch('/api/funding/status', {
  server: false
})

// Fetch funding history (client-only to prevent blocking)
const { data: historyData, pending: historyPending, error: historyError } = useFetch('/api/funding/history', {
  server: false
})

// Computed properties
const currentPeriod = computed(() => {
  return fundingData.value?.period?.month || new Date().toLocaleDateString('de-DE', { 
    month: 'long', 
    year: 'numeric' 
  })
})

// Helper functions
const formatEuro = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('de-DE', { 
    month: 'long', 
    year: 'numeric' 
  })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>