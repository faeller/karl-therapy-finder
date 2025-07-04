<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-7xl flex-col items-center gap-6">
      <!-- Admin Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-400/80 to-amber-600/80 text-xl font-bold text-white shadow-lg backdrop-blur-sm">
              🔐
            </div>
            <div>
              <h1 class="text-xl font-bold text-white tracking-tight">Karl Admin Dashboard</h1>
              <p class="text-blue-100/80 text-sm">Waitlist Management</p>
            </div>
          </div>
          <UButton
            @click="logout"
            color="red"
            variant="ghost"
            size="sm"
            icon="i-heroicons-arrow-right-on-rectangle"
          >
            Logout
          </UButton>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="w-full grid gap-4 lg:grid-cols-3">
        <div class="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-users" class="w-5 h-5 text-blue-300" />
            <span class="text-blue-200 font-medium">Gesamt Wartelist</span>
          </div>
          <div class="text-2xl font-bold text-blue-100 mt-1">
            {{ waitlistData?.total || 0 }}
          </div>
        </div>

        <div class="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-green-300" />
            <span class="text-green-200 font-medium">Pending</span>
          </div>
          <div class="text-2xl font-bold text-green-100 mt-1">
            {{ pendingCount }}
          </div>
        </div>

        <div class="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-phone" class="w-5 h-5 text-purple-300" />
            <span class="text-purple-200 font-medium">Contacted</span>
          </div>
          <div class="text-2xl font-bold text-purple-100 mt-1">
            {{ contactedCount }}
          </div>
        </div>
      </div>

      <!-- Waitlist Table -->
      <div class="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Waitlist Entries</h2>
          <UButton
            @click="refreshData"
            :loading="isLoading"
            color="blue"
            size="sm"
            icon="i-heroicons-arrow-path"
          >
            Refresh
          </UButton>
        </div>

        <div v-if="isLoading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-blue-300 mx-auto mb-2" />
          <p class="text-blue-200">Loading waitlist data...</p>
        </div>

        <div v-else-if="waitlistData?.entries?.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left text-blue-200 font-medium p-3">ID</th>
                <th class="text-left text-blue-200 font-medium p-3">Name</th>
                <th class="text-left text-blue-200 font-medium p-3">Email</th>
                <th class="text-left text-blue-200 font-medium p-3">PLZ</th>
                <th class="text-left text-blue-200 font-medium p-3">Alter</th>
                <th class="text-left text-blue-200 font-medium p-3">Probleme</th>
                <th class="text-left text-blue-200 font-medium p-3">Status</th>
                <th class="text-left text-blue-200 font-medium p-3">Erstellt</th>
                <th class="text-left text-blue-200 font-medium p-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="entry in waitlistData.entries" 
                :key="entry.id"
                class="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td class="p-3 text-white font-mono">{{ entry.id }}</td>
                <td class="p-3 text-white">{{ entry.profile?.nickname || 'N/A' }}</td>
                <td class="p-3 text-blue-200">{{ entry.profile?.contactEmail || 'N/A' }}</td>
                <td class="p-3 text-white font-mono">{{ entry.plz }}</td>
                <td class="p-3 text-white">{{ entry.profile?.age || 'N/A' }}</td>
                <td class="p-3 text-white">
                  <span v-if="entry.profile?.problems?.length" class="text-xs bg-blue-500/20 px-2 py-1 rounded">
                    {{ entry.profile.problems.length }} Probleme
                  </span>
                  <span v-else class="text-gray-400">N/A</span>
                </td>
                <td class="p-3">
                  <span 
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      entry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' :
                      entry.status === 'contacted' ? 'bg-green-500/20 text-green-200' :
                      'bg-gray-500/20 text-gray-200'
                    ]"
                  >
                    {{ entry.status }}
                  </span>
                </td>
                <td class="p-3 text-white text-xs">
                  {{ formatDate(entry.createdAt) }}
                </td>
                <td class="p-3">
                  <UButton
                    @click="viewDetails(entry)"
                    color="blue"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-eye"
                  >
                    Details
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-8">
          <p class="text-blue-200">Keine Wartelist-Einträge gefunden</p>
        </div>
      </div>

      <!-- Detail Modal -->
      <UModal v-model="showDetailModal">
        <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white" v-if="selectedEntry">
          <h3 class="text-xl font-bold text-white mb-6">Entry Details - ID {{ selectedEntry.id }}</h3>
          
          <div class="space-y-4">
            <!-- Contact Information -->
            <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl backdrop-blur-sm">
              <h4 class="font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-user" class="w-4 h-4" />
                Kontaktinformationen
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="font-medium text-blue-300">Name:</span>
                  <span class="ml-2 text-white">{{ selectedEntry.profile?.nickname || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-300">E-Mail:</span>
                  <span class="ml-2 text-white">{{ selectedEntry.profile?.contactEmail || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-300">PLZ:</span>
                  <span class="ml-2 text-white font-mono">{{ selectedEntry.plz }}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-300">Alter:</span>
                  <span class="ml-2 text-white">{{ selectedEntry.profile?.age || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Location Details -->
            <div class="bg-green-500/10 border border-green-500/20 p-4 rounded-xl backdrop-blur-sm" v-if="selectedEntry.profile?.location">
              <h4 class="font-semibold text-green-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                Standort
              </h4>
              <div class="text-sm">
                <span class="font-medium text-green-300">Ort:</span>
                <span class="ml-2 text-white">{{ selectedEntry.profile.location }}</span>
              </div>
            </div>

            <!-- Problems/Issues -->
            <div class="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl backdrop-blur-sm" v-if="selectedEntry.profile?.problems?.length">
              <h4 class="font-semibold text-purple-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
                Probleme ({{ selectedEntry.profile.problems.length }})
              </h4>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="problem in selectedEntry.profile.problems" 
                  :key="problem"
                  class="inline-block bg-purple-500/20 text-purple-200 border border-purple-500/30 px-3 py-1 rounded-full text-xs"
                >
                  {{ problem }}
                </span>
              </div>
            </div>

            <!-- Insurance Information -->
            <div class="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl backdrop-blur-sm" v-if="selectedEntry.profile?.insurance">
              <h4 class="font-semibold text-orange-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
                Versicherung
              </h4>
              <div class="text-sm">
                <span class="font-medium text-orange-300">Krankenkasse:</span>
                <span class="ml-2 text-white">{{ selectedEntry.profile.insurance }}</span>
              </div>
            </div>

            <!-- Therapy Preferences -->
            <div class="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm" v-if="selectedEntry.profile?.therapyType || selectedEntry.profile?.preferredGender">
              <h4 class="font-semibold text-indigo-200 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-heart" class="w-4 h-4" />
                Therapie-Präferenzen
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div v-if="selectedEntry.profile.therapyType">
                  <span class="font-medium text-indigo-300">Therapieart:</span>
                  <span class="ml-2 text-white">{{ selectedEntry.profile.therapyType }}</span>
                </div>
                <div v-if="selectedEntry.profile.preferredGender">
                  <span class="font-medium text-indigo-300">Bevorzugtes Geschlecht:</span>
                  <span class="ml-2 text-white">{{ selectedEntry.profile.preferredGender }}</span>
                </div>
              </div>
            </div>

            <!-- Status and Timestamps -->
            <div class="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <h4 class="font-semibold text-white mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                Status & Zeitstempel
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="font-medium text-white/70">Status:</span>
                  <span 
                    :class="[
                      'ml-2 px-2 py-1 rounded-full text-xs font-medium',
                      selectedEntry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' :
                      selectedEntry.status === 'contacted' ? 'bg-green-500/20 text-green-200 border border-green-500/30' :
                      'bg-gray-500/20 text-gray-200 border border-gray-500/30'
                    ]"
                  >
                    {{ selectedEntry.status }}
                  </span>
                </div>
                <div>
                  <span class="font-medium text-white/70">Erstellt:</span>
                  <span class="ml-2 text-white">{{ formatDate(selectedEntry.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Raw JSON (collapsible) -->
            <details class="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <summary class="font-semibold text-white cursor-pointer hover:text-blue-200 transition-colors flex items-center gap-2">
                <UIcon name="i-heroicons-code-bracket" class="w-4 h-4" />
                Raw JSON Daten
              </summary>
              <pre class="mt-3 p-3 bg-black/30 border border-white/10 rounded-lg text-xs overflow-auto max-h-96 text-blue-100">{{ JSON.stringify(selectedEntry.profile, null, 2) }}</pre>
            </details>
            
            <div class="flex justify-end gap-2 pt-4">
              <UButton @click="showDetailModal = false" color="blue" variant="outline">
                Schließen
              </UButton>
            </div>
          </div>
        </div>
      </UModal>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const waitlistData = ref<any>(null)
const isLoading = ref(true)
const showDetailModal = ref(false)
const selectedEntry = ref<any>(null)

const pendingCount = computed(() => {
  return waitlistData.value?.entries?.filter((e: any) => e.status === 'pending').length || 0
})

const contactedCount = computed(() => {
  return waitlistData.value?.entries?.filter((e: any) => e.status === 'contacted').length || 0
})

const fetchWaitlistData = async () => {
  try {
    isLoading.value = true
    const response = await $fetch('/api/admin/waitlist')
    waitlistData.value = response
  } catch (error) {
    console.error('Failed to fetch waitlist data:', error)
    // If unauthorized, redirect to login
    if (error.status === 401) {
      await navigateTo('/admin/login')
    }
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  fetchWaitlistData()
}

const logout = async () => {
  try {
    // Clear admin cookie
    await $fetch('/api/admin/logout', { method: 'POST' })
  } catch (error) {
    // Continue logout even if API fails
  }
  await navigateTo('/admin/login')
}

const viewDetails = (entry: any) => {
  selectedEntry.value = entry
  showDetailModal.value = true
}

const formatDate = (date: any) => {
  return new Date(date).toLocaleString('de-DE')
}

// Check authentication and load data on mount
onMounted(() => {
  fetchWaitlistData()
})
</script>