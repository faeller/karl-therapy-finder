<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-6xl flex-col items-center gap-6">
      <!-- KARL Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          K
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">
          <template v-if="!isPiniaLoading">
            {{ greeting }} {{ onboardingStore.formData.nickname || '' }}! 👋
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
      <div v-if="!isPiniaLoading && onboardingStore.formData.location" class="w-full">
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-heroicons-funnel" class="w-4 h-4 text-blue-300" />
            <span class="text-blue-200 font-medium text-sm">Filter</span>
            <UBadge v-if="hasActiveFilters" color="blue" variant="soft" size="xs">{{ activeFiltersCount }}</UBadge>
            <button 
              v-if="hasActiveFilters"
              @click="clearFilters"
              class="ml-auto text-xs text-blue-300 hover:text-blue-200 transition-colors"
            >
              Zurücksetzen
            </button>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-2">
            <!-- Therapy Type -->
            <select 
              v-model="filters.therapyType"
              class="text-xs px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Therapiearten" class="text-gray-900">Alle Therapien</option>
              <option v-for="option in therapyTypeOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option.replace('Kinder- & Jugendtherapie', 'K&J-Therapie') }}
              </option>
            </select>

            <!-- Problem -->
            <select 
              v-model="filters.problem"
              class="text-xs px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Probleme" class="text-gray-900">Alle Probleme</option>
              <option v-for="option in problemOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option }}
              </option>
            </select>

            <!-- Age Group -->
            <select 
              v-model="filters.ageGroup"
              class="text-xs px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Altersgruppen" class="text-gray-900">Alle Altersgruppen</option>
              <option v-for="option in ageGroupOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option }}
              </option>
            </select>

            <!-- Billing -->
            <select 
              v-model="filters.billing"
              class="text-xs px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Abrechnungsarten" class="text-gray-900">Alle Abrechnungen</option>
              <option v-for="option in billingOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option.replace('Gesetzliche Krankenversicherung', 'Gesetzlich').replace('Private Krankenversicherung', 'Privat') }}
              </option>
            </select>

            <!-- Gender -->
            <select 
              v-model="filters.gender"
              class="text-xs px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Egal" class="text-gray-900">Geschlecht egal</option>
              <option v-for="option in genderOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option }}
              </option>
            </select>

            <!-- Free Places -->
            <select 
              v-model="filters.freePlaces"
              class="text-xs px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Egal" class="text-gray-900">Alle Plätze</option>
              <option v-for="option in freePlacesOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option }}
              </option>
            </select>

            <!-- Specialization -->
            <div class="relative">
              <input 
                v-model="filters.specialization"
                type="text"
                placeholder="Spezialisierung..."
                class="text-xs px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent w-full"
              />
              <!-- Loading indicator for search -->
              <div 
                v-if="filters.specialization !== debouncedSpecialization && filters.specialization"
                class="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <div class="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
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

// Load filters from localStorage or use defaults
const getStoredFilters = () => {
  if (process.client) {
    try {
      const stored = localStorage.getItem('therapist-filters')
      if (stored) {
        return { ...{
          therapyType: 'Alle Therapiearten',
          gender: 'Egal',
          problem: 'Alle Probleme',
          ageGroup: 'Alle Altersgruppen',
          billing: 'Alle Abrechnungsarten',
          freePlaces: 'Egal',
          specialization: ''
        }, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load stored filters:', error)
    }
  }
  return {
    therapyType: 'Alle Therapiearten',
    gender: 'Egal',
    problem: 'Alle Probleme',
    ageGroup: 'Alle Altersgruppen',
    billing: 'Alle Abrechnungsarten',
    freePlaces: 'Egal',
    specialization: ''
  }
}

// Filter state (using display values)
const filters = ref(getStoredFilters())

// Debounced specialization for API calls
const debouncedSpecialization = ref(filters.value.specialization)

// Debounce the specialization field to avoid excessive API calls
watch(() => filters.value.specialization, (newValue) => {
  // Clear existing timeout
  if (process.client && window.specializationTimeout) {
    clearTimeout(window.specializationTimeout)
  }
  
  // Set new timeout for 500ms delay
  if (process.client) {
    window.specializationTimeout = setTimeout(() => {
      debouncedSpecialization.value = newValue
    }, 500)
  }
}, { immediate: true })

// Save filters to localStorage whenever they change
watch(filters, (newFilters) => {
  if (process.client) {
    try {
      localStorage.setItem('therapist-filters', JSON.stringify(newFilters))
    } catch (error) {
      console.warn('Failed to save filters:', error)
    }
  }
}, { deep: true })

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

// Cleanup timeout on unmount
onUnmounted(() => {
  if (process.client && window.specializationTimeout) {
    clearTimeout(window.specializationTimeout)
  }
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

// Map display values to API values
const therapyTypeMap: Record<string, string> = {
  'Alle Therapiearten': '',
  'Verhaltenstherapie': 'verhaltenstherapie',
  'Tiefenpsychologie': 'tiefenpsychologie', 
  'Systemische Therapie': 'systemisch',
  'Kinder- & Jugendtherapie': 'kinder'
}


const genderMap: Record<string, string | null> = {
  'Egal': null,
  'Weiblich': '2',
  'Männlich': '1'
}

const problemMap: Record<string, string | null> = {
  'Alle Probleme': null,
  'Depression': 'depression',
  'Angst - Phobie': 'angst',
  'Trauma': 'trauma',
  'Beziehungsprobleme': 'beziehung',
  'Burnout': 'burnout',
  'Essstörungen': 'ess',
  'Sucht': 'sucht',
  'ADHS': 'adhs',
  'Zwangsstörungen': 'zwang'
}

const ageGroupMap: Record<string, string | null> = {
  'Alle Altersgruppen': null,
  'Kinder (0-12)': 'kinder',
  'Jugendliche (13-17)': 'jugend',
  'Erwachsene (18-64)': 'erwachsene',
  'Senioren (65+)': 'senioren'
}

const billingMap: Record<string, string | null> = {
  'Alle Abrechnungsarten': null,
  'Gesetzliche Krankenversicherung': '7',
  'Private Krankenversicherung': '8',
  'Selbstzahler': '9'
}

const freePlacesMap: Record<string, string | null> = {
  'Egal': null,
  'Nur freie Plätze': '1'
}

// Therapy type options
const therapyTypeOptions = [
  'Alle Therapiearten',
  'Verhaltenstherapie', 
  'Tiefenpsychologie',
  'Systemische Therapie',
  'Kinder- & Jugendtherapie'
]


// Gender options
const genderOptions = [
  'Egal',
  'Weiblich',
  'Männlich'
]

// Problem options (Worum geht es?)
const problemOptions = [
  'Alle Probleme',
  'Depression',
  'Angst - Phobie',
  'Trauma',
  'Beziehungsprobleme',
  'Burnout',
  'Essstörungen',
  'Sucht',
  'ADHS',
  'Zwangsstörungen'
]

// Age group options (Für wen?)
const ageGroupOptions = [
  'Alle Altersgruppen',
  'Kinder (0-12)',
  'Jugendliche (13-17)',
  'Erwachsene (18-64)',
  'Senioren (65+)'
]

// Billing options (Abrechnung)
const billingOptions = [
  'Alle Abrechnungsarten',
  'Gesetzliche Krankenversicherung',
  'Private Krankenversicherung',
  'Selbstzahler'
]

// Free places options (Freie Plätze)
const freePlacesOptions = [
  'Egal',
  'Nur freie Plätze'
]

// Extract PLZ from user's location
const userPlz = computed(() => {
  if (!onboardingStore.formData.location) return null
  return extractPlz(onboardingStore.formData.location)
})

// Fetch therapist data with reactive query (using debounced specialization)
const queryParams = computed(() => ({
  plz: userPlz.value,
  therapyType: therapyTypeMap[filters.value.therapyType] || undefined,
  gender: genderMap[filters.value.gender] || undefined,
  problem: problemMap[filters.value.problem] || undefined,
  ageGroup: ageGroupMap[filters.value.ageGroup] || undefined,
  billing: billingMap[filters.value.billing] || undefined,
  freePlaces: freePlacesMap[filters.value.freePlaces] || undefined,
  specialization: debouncedSpecialization.value || undefined
}))

const { data: therapistData, pending, error, refresh } = await useLazyFetch<TherapistSearchResult>('/api/therapists', {
  query: queryParams,
  default: () => null,
  server: false, // Only fetch on client side to avoid SSR issues
  transform: (_data: TherapistSearchResult) => {
    // Log filter changes for debugging
    console.log('Applied filters:', filters.value)
    console.log('Query params:', queryParams.value)
    console.log('Therapist count:', _data?.therapists?.length || 0)
    return _data
  }
})

// Clear all filters
const clearFilters = () => {
  filters.value = {
    therapyType: 'Alle Therapiearten',
    gender: 'Egal',
    problem: 'Alle Probleme',
    ageGroup: 'Alle Altersgruppen',
    billing: 'Alle Abrechnungsarten',
    freePlaces: 'Egal',
    specialization: ''
  }
  
  // Also clear from localStorage
  if (process.client) {
    try {
      localStorage.removeItem('therapist-filters')
    } catch (error) {
      console.warn('Failed to clear stored filters:', error)
    }
  }
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return filters.value.therapyType !== 'Alle Therapiearten' || 
         filters.value.gender !== 'Egal' ||
         filters.value.problem !== 'Alle Probleme' ||
         filters.value.ageGroup !== 'Alle Altersgruppen' ||
         filters.value.billing !== 'Alle Abrechnungsarten' ||
         filters.value.freePlaces !== 'Egal' ||
         filters.value.specialization !== ''
})

// Count active filters
const activeFiltersCount = computed(() => {
  return [
    filters.value.therapyType !== 'Alle Therapiearten',
    filters.value.gender !== 'Egal',
    filters.value.problem !== 'Alle Probleme',
    filters.value.ageGroup !== 'Alle Altersgruppen',
    filters.value.billing !== 'Alle Abrechnungsarten',
    filters.value.freePlaces !== 'Egal',
    filters.value.specialization !== ''
  ].filter(Boolean).length
})

// Open therapist profile in new tab
const openTherapistProfile = (profileUrl: string) => {
  window.open(profileUrl, '_blank', 'noopener,noreferrer')
}
</script>