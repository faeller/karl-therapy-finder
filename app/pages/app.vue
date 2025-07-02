<template>
  <PageCard>
    <div class="relative z-10 flex w-full flex-col items-center gap-6">
      <!-- KARL Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400 to-blue-600 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          K
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">
          <template v-if="!isPiniaLoading">
            {{ greeting }} {{ onboardingStore.formData.nickname || 'dort' }}! 👋
          </template>
          <template v-else>
            <div class="flex items-center gap-2 justify-center">
              <div class="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
              Lade Profil...
            </div>
          </template>
        </h1>
        <p class="text-sm text-blue-100/80">
          <template v-if="!isPiniaLoading">
            {{ therapistData && therapistData.therapists.length > 0 
              ? `${therapistData.therapists.length} Therapeuten in ${therapistData.plz} gefunden`
              : onboardingStore.formData.location 
                ? 'Suche Therapeuten in deiner Nähe...'
                : 'Bitte vervollständige dein Profil im Onboarding.'
            }}
          </template>
          <template v-else>
            Lade deine gespeicherten Daten...
          </template>
        </p>
      </div>

      <!-- Filters -->
      <div v-if="!isPiniaLoading && onboardingStore.formData.location" class="w-full space-y-4">
        <!-- Filter Toggle -->
        <UCollapsible>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-funnel" class="w-5 h-5 text-blue-300" />
                <span class="text-blue-200 font-medium">Filter</span>
                <UBadge v-if="hasActiveFilters" color="blue" variant="soft" size="xs">
                  {{ Object.values(filters).filter(v => v && v !== '').length }}
                </UBadge>
              </div>
              <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-blue-300 transition-transform ui-open:rotate-180" />
            </div>
          </template>

          <div class="pt-4 space-y-4">
            <!-- Filter Grid -->
            <div class="grid grid-cols-1 gap-4">
              <!-- Therapy Type -->
              <div>
                <label class="block text-xs font-medium text-blue-200 mb-2">Therapieart</label>
                <USelect 
                  v-model="filters.therapyType"
                  :options="therapyTypeOptions"
                  size="sm"
                  class="w-full"
                />
              </div>

              <!-- Max Distance -->
              <div>
                <label class="block text-xs font-medium text-blue-200 mb-2">Maximale Entfernung</label>
                <USelect 
                  v-model="filters.maxDistance"
                  :options="distanceOptions"
                  size="sm"
                  class="w-full"
                />
              </div>

              <!-- Specialization -->
              <div>
                <label class="block text-xs font-medium text-blue-200 mb-2">Spezialisierung</label>
                <UInput 
                  v-model="filters.specialization"
                  placeholder="z.B. Depression, Angst, Trauma..."
                  size="sm"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Filter Actions -->
            <div class="flex items-center gap-2 pt-2">
              <UButton 
                v-if="hasActiveFilters"
                @click="clearFilters"
                variant="ghost"
                size="xs"
                color="gray"
              >
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                Filter zurücksetzen
              </UButton>
              <div class="text-xs text-blue-100/60">
                Filter werden automatisch angewendet
              </div>
            </div>
          </div>
        </UCollapsible>
      </div>

      <!-- Loading State -->
      <div v-if="isPiniaLoading || pending" class="w-full space-y-4">
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="w-8 h-8 border-2 border-blue-400/30 rounded-full"></div>
              <div class="absolute inset-0 w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <div class="text-blue-200 font-medium text-sm">
                {{ isPiniaLoading ? 'Lade Profildaten...' : 'Suche Therapeuten...' }}
              </div>
              <div class="text-blue-100/60 text-xs">Das kann einen Moment dauern</div>
            </div>
          </div>
        </div>
        
        <!-- Loading Skeleton -->
        <div class="space-y-3">
          <div v-for="i in 3" :key="i" class="rounded-xl bg-white/5 backdrop-blur-sm p-4 border border-white/10 animate-pulse">
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 rounded-lg bg-blue-500/20"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-blue-500/20 rounded w-3/4"></div>
                <div class="h-3 bg-blue-500/15 rounded w-1/2"></div>
                <div class="flex gap-2">
                  <div class="h-3 bg-blue-500/15 rounded w-16"></div>
                  <div class="h-3 bg-blue-500/15 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="w-full rounded-xl bg-red-500/20 backdrop-blur-sm p-4 border border-red-500/30">
        <div class="flex items-center gap-2 text-red-200">
          <span class="text-lg">⚠️</span>
          <span class="text-sm">Fehler beim Laden der Therapeuten-Daten</span>
        </div>
      </div>

      <!-- No Location State -->
      <div v-else-if="!isPiniaLoading && !onboardingStore.formData.location" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
        <div class="text-center space-y-3">
          <div class="text-blue-300 text-lg">📍</div>
          <h3 class="font-bold text-blue-300 text-base">Standort fehlt</h3>
          <p class="text-blue-100/80 text-sm">
            Bitte vervollständige dein Profil, um Therapeuten in deiner Nähe zu finden.
          </p>
          <button @click="$router.push('/onboarding')" class="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-white text-sm font-medium transition-colors hover:bg-blue-600">
            Profil vervollständigen
          </button>
        </div>
      </div>

      <!-- Therapist Results -->
      <div v-else-if="!isPiniaLoading && therapistData && therapistData.therapists.length > 0" class="w-full space-y-4">
        <!-- Results Header -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-blue-300 text-base">Gefundene Therapeuten</h3>
              <p class="text-blue-100/80 text-sm">PLZ {{ therapistData.plz }} • {{ therapistData.radius }}km Umkreis</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-white">{{ therapistData.therapists.length }}</div>
              <div class="text-xs text-blue-100/80">verfügbar</div>
            </div>
          </div>
        </div>

        <!-- Therapist List -->
        <div class="space-y-3 max-h-80 overflow-y-auto">
          <div 
            v-for="therapist in therapistData.therapists" 
            :key="therapist.id"
            class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
            @click="openTherapistProfile(therapist.profileUrl)"
          >
            <div class="flex items-start gap-3">
              <!-- Profile Image -->
              <div class="flex-shrink-0">
                <div v-if="therapist.image" class="w-12 h-12 rounded-lg overflow-hidden">
                  <img :src="therapist.image" :alt="therapist.name" class="w-full h-full object-cover">
                </div>
                <div v-else class="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </div>

              <!-- Therapist Info -->
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-white text-sm group-hover:text-blue-200 transition-colors">
                  {{ therapist.name }}
                </h4>
                <p class="text-blue-100/80 text-xs mt-1">
                  {{ therapist.qualification }}
                </p>
                <div class="flex items-center gap-4 mt-2 text-xs text-blue-100/60">
                  <div class="flex items-center gap-1">
                    <span>📍</span>
                    <span>{{ therapist.distance }}km</span>
                  </div>
                  <div v-if="therapist.phone" class="flex items-center gap-1">
                    <span>📞</span>
                    <span>{{ therapist.phone }}</span>
                  </div>
                </div>
              </div>

              <!-- Arrow -->
              <div class="flex-shrink-0 text-blue-100/40 group-hover:text-blue-200 transition-colors">
                <span class="text-sm">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results State -->
      <div v-else-if="!isPiniaLoading && therapistData && therapistData.therapists.length === 0" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
        <div class="text-center space-y-3">
          <div class="text-blue-300 text-lg">🔍</div>
          <h3 class="font-bold text-blue-300 text-base">Keine Therapeuten gefunden</h3>
          <p class="text-blue-100/80 text-sm">
            In PLZ {{ therapistData.plz }} wurden keine passenden Therapeuten gefunden.
          </p>
        </div>
      </div>
      
      <!-- Back Button -->
      <button @click="$router.push('/')" class="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-white text-sm font-medium transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95">
        <div class="relative z-10 flex items-center gap-2">
          <span class="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          Zurück zum Start
        </div>
        <div class="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </button>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
interface TherapistData {
  id: string
  name: string
  qualification: string
  address: string
  phone: string
  distance: number
  profileUrl: string
  image?: string
}

interface TherapistSearchResult {
  plz: string
  totalResults: number
  radius: number
  therapists: TherapistData[]
}

const onboardingStore = useOnboardingStore()

// Loading state for Pinia data
const isPiniaLoading = ref(true)

// Filter state
const filters = ref({
  therapyType: '',
  maxDistance: null as number | null,
  specialization: ''
})

// Check if Pinia data is loaded
onMounted(() => {
  // Simulate loading delay for persisted state
  const checkPiniaLoaded = () => {
    if (onboardingStore.$state) {
      isPiniaLoading.value = false
    } else {
      setTimeout(checkPiniaLoaded, 100)
    }
  }
  
  // Small delay to ensure persisted state is loaded
  setTimeout(() => {
    isPiniaLoading.value = false
  }, 500)
})

// Extract PLZ from location string (assuming format like "90403 Nürnberg" or "Nürnberg, 90403")
const extractPlz = (location: string): string | null => {
  const plzMatch = location.match(/\b(\d{5})\b/)
  return plzMatch ? plzMatch[1] : null
}

// Get greeting based on time of day
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
})

// Extract PLZ from user's location
const userPlz = computed(() => {
  if (!onboardingStore.formData.location) return null
  return extractPlz(onboardingStore.formData.location)
})

// Fetch therapist data
const { data: therapistData, pending, error, refresh } = await useLazyFetch<TherapistSearchResult>('/api/therapists', {
  query: computed(() => ({
    plz: userPlz.value,
    therapyType: filters.value.therapyType || undefined,
    maxDistance: filters.value.maxDistance || undefined,
    specialization: filters.value.specialization || undefined
  })),
  default: () => null,
  server: false // Only fetch on client side to avoid SSR issues
})

// Therapy type options
const therapyTypeOptions = [
  { label: 'Alle Therapiearten', value: '' },
  { label: 'Verhaltenstherapie', value: 'verhaltenstherapie' },
  { label: 'Tiefenpsychologie', value: 'tiefenpsychologie' },
  { label: 'Systemische Therapie', value: 'systemisch' },
  { label: 'Kinder- & Jugendtherapie', value: 'kinder' }
]

// Distance options
const distanceOptions = [
  { label: 'Beliebige Entfernung', value: null },
  { label: 'Bis 5 km', value: 5 },
  { label: 'Bis 10 km', value: 10 },
  { label: 'Bis 25 km', value: 25 },
  { label: 'Bis 50 km', value: 50 }
]

// Clear all filters
const clearFilters = () => {
  filters.value = {
    therapyType: '',
    maxDistance: null,
    specialization: ''
  }
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return filters.value.therapyType || 
         filters.value.maxDistance !== null || 
         filters.value.specialization
})

// Open therapist profile in new tab
const openTherapistProfile = (profileUrl: string) => {
  window.open(profileUrl, '_blank', 'noopener,noreferrer')
}
</script>