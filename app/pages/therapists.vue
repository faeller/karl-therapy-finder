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

      <!-- Tab Navigation -->
      <div v-if="!isPiniaLoading && onboardingStore.formData.location" class="w-full">
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 mb-4">
          <div class="flex gap-2">
            <button 
              @click="activeTab = 'search'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'search' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              ]"
            >
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4" />
                Therapeuten suchen
              </div>
            </button>
            <button 
              @click="activeTab = 'kontaktprotokoll'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'kontaktprotokoll' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              ]"
            >
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                Kontaktprotokoll
                <UBadge v-if="bookmarkedTherapists.length > 0" color="white" variant="solid" size="xs">
                  {{ bookmarkedTherapists.length }}
                </UBadge>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Filters (only show on search tab) -->
      <div v-if="!isPiniaLoading && onboardingStore.formData.location && activeTab === 'search'" class="w-full">
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

      <!-- Search Tab Content -->
      <div v-if="activeTab === 'search'">
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
            class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20 hover:bg-white/15 transition-colors group"
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
              <div class="flex-1 min-w-0 cursor-pointer" @click="openTherapistProfile(therapist.profileUrl)">
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

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <button 
                  @click="toggleBookmark(therapist)"
                  :class="[
                    'p-2 rounded-lg transition-all',
                    isBookmarked(therapist.id) 
                      ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' 
                      : 'bg-white/10 text-blue-100/60 hover:bg-white/20 hover:text-blue-200'
                  ]"
                >
                  <UIcon :name="isBookmarked(therapist.id) ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
                </button>
                <button 
                  @click="openTherapistProfile(therapist.profileUrl)"
                  class="p-2 rounded-lg bg-white/10 text-blue-100/60 hover:bg-white/20 hover:text-blue-200 transition-all"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                </button>
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
      </div>

      <!-- Kontaktprotokoll Tab Content -->
      <div v-if="activeTab === 'kontaktprotokoll'" class="w-full space-y-4">
        <!-- Bookmarked Therapists -->
        <div v-if="bookmarkedTherapists.length > 0" class="space-y-3">
          <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-blue-300 text-base">Gespeicherte Therapeuten</h3>
              <UBadge color="blue" variant="soft">{{ bookmarkedTherapists.length }}</UBadge>
            </div>
            
            <div class="space-y-3">
              <div 
                v-for="therapist in bookmarkedTherapists" 
                :key="therapist.id"
                class="rounded-lg bg-white/5 p-3 border border-white/10"
              >
                <div class="flex items-start gap-3">
                  <!-- Profile Image -->
                  <div class="flex-shrink-0">
                    <div v-if="therapist.image" class="w-10 h-10 rounded-lg overflow-hidden">
                      <img :src="therapist.image" :alt="therapist.name" class="w-full h-full object-cover">
                    </div>
                    <div v-else class="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>

                  <!-- Therapist Info -->
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-white text-sm">{{ therapist.name }}</h4>
                    <p class="text-blue-100/80 text-xs mt-1">{{ therapist.qualification }}</p>
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

                  <!-- Action Buttons -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button 
                      @click="addContactAttempt(therapist)"
                      class="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all"
                    >
                      <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    </button>
                    <button 
                      @click="toggleBookmark(therapist)"
                      class="p-2 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all"
                    >
                      <UIcon name="i-heroicons-bookmark-solid" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <!-- Contact Attempts -->
                <div v-if="getContactAttempts(therapist.id).length > 0" class="mt-3 pt-3 border-t border-white/10">
                  <h5 class="text-xs font-medium text-blue-200 mb-2">Kontaktversuche</h5>
                  <div class="space-y-2">
                    <div 
                      v-for="attempt in getContactAttempts(therapist.id)" 
                      :key="attempt.id"
                      class="p-2 rounded bg-white/5 text-xs"
                    >
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-2">
                          <div :class="[
                            'w-2 h-2 rounded-full',
                            attempt.replyReceived ? 'bg-green-400' : 'bg-yellow-400'
                          ]"></div>
                          <span class="text-blue-100">{{ formatDate(attempt.contactDate) }}</span>
                          <span class="text-blue-100/60">{{ attempt.contactTime }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span :class="[
                            'text-xs px-2 py-1 rounded',
                            attempt.replyReceived ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                          ]">
                            {{ attempt.replyReceived ? 'Antwort erhalten' : 'Ausstehend' }}
                          </span>
                          <button 
                            @click="removeContactAttempt(attempt.id)"
                            class="p-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                          >
                            <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div v-if="attempt.waitingTime" class="text-blue-100/80 text-xs">
                        Wartezeit: {{ attempt.waitingTime }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- PDF Export -->
          <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-blue-300 text-base">Kontaktprotokoll exportieren</h3>
              <UBadge color="green" variant="soft">{{ totalContactAttempts }} Versuche</UBadge>
            </div>
            <p class="text-blue-100/80 text-sm mb-4">
              Erstelle ein PDF-Dokument mit allen dokumentierten Kontaktversuchen für deine Krankenkasse.
            </p>
            <button 
              @click="exportToPdf"
              :disabled="totalContactAttempts === 0"
              class="w-full rounded-lg bg-blue-500 px-4 py-2 text-white text-sm font-medium transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                PDF herunterladen
              </div>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/20">
          <div class="text-center space-y-3">
            <div class="text-blue-300 text-lg">📋</div>
            <h3 class="font-bold text-blue-300 text-base">Keine Therapeuten gespeichert</h3>
            <p class="text-blue-100/80 text-sm">
              Speichere Therapeuten im "Therapeuten suchen" Tab, um hier deine Kontaktversuche zu dokumentieren.
            </p>
            <button 
              @click="activeTab = 'search'"
              class="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-white text-sm font-medium transition-colors hover:bg-blue-600"
            >
              Therapeuten suchen
            </button>
          </div>
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

interface ContactAttempt {
  id: string
  therapistId: string
  contactDate: string
  contactTime: string
  replyReceived: boolean
  replyDate?: string
  waitingTime?: string
}

const onboardingStore = useOnboardingStore()

// Tab management
const activeTab = ref('search')

// Loading state for Pinia data
const isPiniaLoading = ref(true)

// Bookmark management
const bookmarkedTherapists = ref<TherapistData[]>([])
const contactAttempts = ref<ContactAttempt[]>([])

// Load bookmarked therapists from localStorage
const loadBookmarkedTherapists = () => {
  if (process.client) {
    try {
      const stored = localStorage.getItem('bookmarked-therapists')
      if (stored) {
        bookmarkedTherapists.value = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load bookmarked therapists:', error)
    }
  }
}

// Save bookmarked therapists to localStorage
const saveBookmarkedTherapists = () => {
  if (process.client) {
    try {
      localStorage.setItem('bookmarked-therapists', JSON.stringify(bookmarkedTherapists.value))
    } catch (error) {
      console.warn('Failed to save bookmarked therapists:', error)
    }
  }
}

// Load contact attempts from localStorage
const loadContactAttempts = () => {
  if (process.client) {
    try {
      const stored = localStorage.getItem('contact-attempts')
      if (stored) {
        contactAttempts.value = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load contact attempts:', error)
    }
  }
}

// Save contact attempts to localStorage
const saveContactAttempts = () => {
  if (process.client) {
    try {
      localStorage.setItem('contact-attempts', JSON.stringify(contactAttempts.value))
    } catch (error) {
      console.warn('Failed to save contact attempts:', error)
    }
  }
}

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
          billing: 'Gesetzliche Krankenversicherung',
          freePlaces: 'Nur freie Plätze',
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
    billing: 'Gesetzliche Krankenversicherung',
    freePlaces: 'Nur freie Plätze',
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
  // Load persisted data
  loadBookmarkedTherapists()
  loadContactAttempts()
  
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

// Bookmark functions
const isBookmarked = (therapistId: string) => {
  return bookmarkedTherapists.value.some(t => t.id === therapistId)
}

const toggleBookmark = (therapist: TherapistData) => {
  const index = bookmarkedTherapists.value.findIndex(t => t.id === therapist.id)
  if (index >= 0) {
    bookmarkedTherapists.value.splice(index, 1)
  } else {
    bookmarkedTherapists.value.push(therapist)
  }
  saveBookmarkedTherapists()
}

// Contact attempt functions
const getContactAttempts = (therapistId: string) => {
  return contactAttempts.value.filter(attempt => attempt.therapistId === therapistId)
}

const addContactAttempt = (therapist: TherapistData) => {
  const now = new Date()
  const replyReceived = confirm('Hast du bereits eine Antwort von diesem Therapeuten erhalten?')
  
  let waitingTime = ''
  if (replyReceived) {
    waitingTime = prompt('Wie lange ist die Wartezeit auf einen Behandlungsplatz? (z.B. "3 Monate", "Keine Plätze verfügbar")') || ''
  }
  
  const attempt: ContactAttempt = {
    id: Date.now().toString(),
    therapistId: therapist.id,
    contactDate: now.toISOString().split('T')[0],
    contactTime: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    replyReceived,
    waitingTime
  }
  contactAttempts.value.push(attempt)
  saveContactAttempts()
}

const removeContactAttempt = (attemptId: string) => {
  const index = contactAttempts.value.findIndex(attempt => attempt.id === attemptId)
  if (index >= 0) {
    contactAttempts.value.splice(index, 1)
    saveContactAttempts()
  }
}

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

const totalContactAttempts = computed(() => {
  return contactAttempts.value.length
})

const exportToPdf = async () => {
  if (process.client) {
    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf')
      
      const pdf = new jsPDF()
      
      // Title
      pdf.setFontSize(16)
      pdf.text('Kontaktprotokoll für Psychotherapieplätze', 20, 20)
      
      // Patient info
      pdf.setFontSize(12)
      pdf.text(`Name: ${onboardingStore.formData.nickname || 'Nicht angegeben'}`, 20, 40)
      pdf.text(`PLZ: ${userPlz.value || 'Nicht angegeben'}`, 20, 50)
      pdf.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 60)
      
      // Table headers
      pdf.setFontSize(10)
      const headers = [
        'Name des kassenzugelassenen Psychotherapeuten, Ort',
        'Datum und Uhrzeit der Kontaktaufnahme',
        'Auskunft über Wartezeit auf Behandlungsplatz'
      ]
      
      let yPosition = 80
      
      // Draw table header
      pdf.rect(20, yPosition, 170, 10)
      pdf.text(headers[0], 22, yPosition + 7)
      pdf.text(headers[1], 90, yPosition + 7)
      pdf.text(headers[2], 140, yPosition + 7)
      
      yPosition += 10
      
      // Table rows
      bookmarkedTherapists.value.forEach(therapist => {
        const attempts = getContactAttempts(therapist.id)
        
        if (attempts.length > 0) {
          attempts.forEach(attempt => {
            // Check if we need a new page
            if (yPosition > 270) {
              pdf.addPage()
              yPosition = 20
            }
            
            pdf.rect(20, yPosition, 170, 10)
            
            // Therapist name and location
            const therapistInfo = `${therapist.name}, ${therapist.address || 'Adresse nicht verfügbar'}`
            pdf.text(therapistInfo.substring(0, 35), 22, yPosition + 7)
            
            // Contact date and time
            const contactInfo = `${formatDate(attempt.contactDate)} ${attempt.contactTime}`
            pdf.text(contactInfo, 90, yPosition + 7)
            
            // Waiting time info
            const waitingInfo = attempt.replyReceived 
              ? (attempt.waitingTime || 'Wartezeit erhalten')
              : 'Aktuell keine Behandlungsplätze verfügbar*'
            pdf.text(waitingInfo.substring(0, 30), 140, yPosition + 7)
            
            yPosition += 10
          })
        }
      })
      
      // Footer note
      yPosition += 10
      pdf.setFontSize(8)
      pdf.text('* „Aktuell keine Behandlungsplätze verfügbar" = Es wird gar keine Warteliste aus', 20, yPosition)
      pdf.text('Mangel an Plätzen geführt oder die Wartezeit beträgt über sechs Monate.', 20, yPosition + 10)
      
      // Save the PDF
      const fileName = `Kontaktprotokoll_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Fehler beim Erstellen des PDFs. Bitte versuche es erneut.')
    }
  }
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
    billing: 'Gesetzliche Krankenversicherung',
    freePlaces: 'Nur freie Plätze',
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
         filters.value.billing !== 'Gesetzliche Krankenversicherung' ||
         filters.value.freePlaces !== 'Nur freie Plätze' ||
         filters.value.specialization !== ''
})

// Count active filters
const activeFiltersCount = computed(() => {
  return [
    filters.value.therapyType !== 'Alle Therapiearten',
    filters.value.gender !== 'Egal',
    filters.value.problem !== 'Alle Probleme',
    filters.value.ageGroup !== 'Alle Altersgruppen',
    filters.value.billing !== 'Gesetzliche Krankenversicherung',
    filters.value.freePlaces !== 'Nur freie Plätze',
    filters.value.specialization !== ''
  ].filter(Boolean).length
})

// Open therapist profile in new tab
const openTherapistProfile = (profileUrl: string) => {
  window.open(profileUrl, '_blank', 'noopener,noreferrer')
}
</script>