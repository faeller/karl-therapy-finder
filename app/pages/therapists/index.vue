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
        <!-- PDF Export -->
        <div v-if="!isLocalStorageLoading" class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-blue-300 text-base">Kontaktprotokoll exportieren</h3>
            <UBadge color="green" variant="soft">{{ qualifyingContactAttempts.length }} qualifiziert</UBadge>
          </div>
          <p class="text-blue-100/80 text-sm mb-4">
            Erstelle ein PDF-Dokument mit allen qualifizierten Kontaktversuchen für deine Krankenkasse. (Nur Versuche ohne Rückmeldung oder Wartezeit >3 Monate)
          </p>
          <div class="flex gap-3">
            <button 
              @click="previewPdf"
              :disabled="qualifyingContactAttempts.length === 0"
              class="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white text-sm font-medium transition-all hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                PDF in neuem Tab öffnen
              </div>
            </button>
            <button 
              @click="exportToPdf"
              :disabled="qualifyingContactAttempts.length === 0"
              class="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white text-sm font-medium transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                PDF herunterladen
              </div>
            </button>
          </div>
        </div>

        <!-- Add Manual Contact -->
        <div v-if="!isLocalStorageLoading" class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-blue-300 text-base">Manueller Kontaktversuch</h3>
          </div>
          <p class="text-blue-100/80 text-sm mb-4">
            Füge einen Kontaktversuch zu einem Therapeuten hinzu, der nicht in unserer Suche gefunden wurde.
          </p>
          <button 
            @click="openContactModal()"
            class="w-full rounded-lg bg-green-500 px-4 py-2 text-white text-sm font-medium transition-all hover:bg-green-600"
          >
            <div class="flex items-center justify-center gap-2">
              <UIcon name="i-heroicons-plus" class="w-4 h-4" />
              Kontaktversuch hinzufügen
            </div>
          </button>
        </div>

        <!-- Manual Contact Attempts -->
        <div v-if="!isLocalStorageLoading && manualContactAttempts.length > 0" class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-blue-300 text-base">Manuelle Kontaktversuche</h3>
            <UBadge color="orange" variant="soft">{{ manualContactAttempts.length }}</UBadge>
          </div>
          
          <div class="space-y-3">
            <div 
              v-for="attempt in manualContactAttempts" 
              :key="attempt.id"
              class="rounded-lg bg-white/5 p-3 border border-white/10"
            >
              <div class="flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-white text-sm">{{ attempt.therapistName }}</h4>
                  <p class="text-blue-100/80 text-xs mt-1">{{ attempt.therapistAddress }}</p>
                  <div class="flex items-center gap-4 mt-2 text-xs text-blue-100/60">
                    <div class="flex items-center gap-1">
                      <span>📅</span>
                      <span>{{ formatDateWithTime(attempt.contactDate, attempt.contactTime) }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <div :class="[
                    'text-xs px-3 py-1.5 rounded-lg border',
                    attempt.replyReceived 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  ]">
                    <div class="flex items-center gap-1">
                      <UIcon :name="attempt.replyReceived ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="w-3 h-3" />
                      {{ attempt.replyReceived ? 'Rückmeldung bekommen' : 'Ausstehend' }}
                    </div>
                  </div>
                  <button 
                    @click="toggleReplyStatus(attempt.id)"
                    class="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                    title="Bearbeiten"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-3 h-3" />
                  </button>
                  <button 
                    @click="removeContactAttempt(attempt.id)"
                    class="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                    title="Löschen"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div v-if="attempt.waitingTime" class="mt-2 text-blue-100/80 text-xs">
                Wartezeit: {{ attempt.waitingTime }}
              </div>
            </div>
          </div>
        </div>

        <!-- Bookmarked Therapists -->
        <div v-if="bookmarkedTherapists.length > 0" class="space-y-3">
          <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-blue-300 text-base">Gespeicherte Therapeuten</h3>
              <UBadge color="blue" variant="soft">{{ bookmarkedTherapists.length }}</UBadge>
            </div>
            
            <div class="space-y-3">
              <!-- Active Therapists (Incomplete) -->
              <div 
                v-for="therapist in displayedTherapists" 
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
                      v-if="!getContactAttempts(therapist.id).length"
                      @click="addContactAttempt(therapist)"
                      class="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all"
                      title="Kontaktversuch hinzufügen"
                    >
                      <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    </button>
                    <div 
                      v-else
                      class="p-2 rounded-lg bg-gray-500/20 text-gray-400 text-xs px-3"
                      title="Kontaktversuch bereits vorhanden"
                    >
                      Bereits kontaktiert
                    </div>
                    <button 
                      @click="toggleBookmark(therapist)"
                      class="p-2 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all"
                      title="Therapeut merken/entfernen"
                    >
                      <UIcon name="i-heroicons-bookmark-solid" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <!-- Contact Attempts -->
                <div v-if="getContactAttempts(therapist.id).length > 0" class="mt-3 pt-3 border-t border-white/10">
                  <div class="mb-2">
                    <h5 class="text-xs font-medium text-blue-200">Kontaktversuche</h5>
                  </div>
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
                          <span class="text-blue-100">{{ formatDateWithTime(attempt.contactDate, attempt.contactTime) }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <div :class="[
                            'text-xs px-3 py-1.5 rounded-lg border',
                            attempt.replyReceived 
                              ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          ]">
                            <div class="flex items-center gap-1">
                              <UIcon :name="attempt.replyReceived ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="w-3 h-3" />
                              {{ attempt.replyReceived ? 'Rückmeldung bekommen' : 'Ausstehend' }}
                            </div>
                          </div>
                          <button 
                            @click="toggleReplyStatus(attempt.id)"
                            class="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                            title="Bearbeiten"
                          >
                            <UIcon name="i-heroicons-pencil-square" class="w-3 h-3" />
                          </button>
                          <button 
                            @click="removeContactAttempt(attempt.id)"
                            class="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                            title="Löschen"
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
              
              <!-- Completed Therapists Section -->
              <div v-if="completedTherapists.length > 0" class="mt-6">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-medium text-blue-200/80">Abgeschlossene Therapeuten</h4>
                  <div class="flex items-center gap-2">
                    <UBadge color="green" variant="soft" size="xs">{{ completedTherapists.length }}</UBadge>
                    <button 
                      @click="toggleAllCompleted"
                      class="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      {{ showAllCompleted ? 'Ausblenden' : 'Anzeigen' }}
                    </button>
                  </div>
                </div>
                
                <div v-if="showAllCompleted" class="space-y-2">
                  <div 
                    v-for="therapist in completedTherapists" 
                    :key="therapist.id"
                    class="rounded-lg bg-white/[0.02] p-3 border border-white/5 opacity-75 transition-all"
                  >
                    <div class="flex items-start gap-3">
                      <!-- Profile Image -->
                      <div class="flex-shrink-0">
                        <div v-if="therapist.image" class="w-8 h-8 rounded-lg overflow-hidden">
                          <img :src="therapist.image" :alt="therapist.name" class="w-full h-full object-cover">
                        </div>
                        <div v-else class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <svg class="w-4 h-4 text-blue-200/60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      </div>

                      <!-- Therapist Info -->
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-white/80 text-sm">{{ therapist.name }}</h4>
                        <p class="text-blue-100/60 text-xs mt-1">{{ therapist.qualification }}</p>
                        <div class="flex items-center gap-3 mt-1 text-xs text-blue-100/50">
                          <div class="flex items-center gap-1">
                            <span>📍</span>
                            <span>{{ therapist.distance }}km</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <UIcon name="i-heroicons-check-circle" class="w-3 h-3 text-green-400" />
                            <span>Abgeschlossen</span>
                          </div>
                        </div>
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex items-center gap-2 flex-shrink-0">
                        <button 
                          @click="toggleBookmark(therapist)"
                          class="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-300/60 hover:bg-yellow-500/20 hover:text-yellow-300 transition-all"
                          title="Therapeut entfernen"
                        >
                          <UIcon name="i-heroicons-bookmark-solid" class="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-else class="text-center py-2">
                  <span class="text-xs text-blue-100/50 italic">{{ completedTherapists.length }} abgeschlossene Therapeuten ausgeblendet</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Loading State for localStorage data -->
        <div v-else-if="isLocalStorageLoading" class="w-full rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="w-8 h-8 border-2 border-blue-400/30 rounded-full"></div>
              <div class="absolute inset-0 w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <div class="text-blue-200 font-medium text-sm">Lade gespeicherte Daten...</div>
              <div class="text-blue-100/60 text-xs">Einen Moment bitte</div>
            </div>
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

    <!-- Contact Attempt Modal -->
    <div v-if="showContactModal" @click="closeContactModal" @keydown.esc="closeContactModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div @click.stop @keydown.enter="submitContactAttempt" class="w-full max-w-lg bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <!-- Modal Header -->
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-white">
              {{ editingAttemptId ? 'Kontaktversuch bearbeiten' : (isManualEntry ? 'Manueller Kontaktversuch' : 'Kontaktversuch hinzufügen') }}
            </h3>
            <button @click="closeContactModal" class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <div class="space-y-4">
            <!-- Therapist Name -->
            <div>
              <label class="block text-sm font-medium text-blue-200 mb-2">
                Name des Therapeuten *
              </label>
              <input 
                v-model="contactForm.therapistName"
                :disabled="!isManualEntry"
                type="text"
                class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-white/50 text-white placeholder-white/40"
                placeholder="Dr. Max Mustermann"
                required
              />
            </div>

            <!-- Therapist Address -->
            <div>
              <label class="block text-sm font-medium text-blue-200 mb-2">
                Adresse / Ort *
              </label>
              <input 
                v-model="contactForm.therapistAddress"
                :disabled="!isManualEntry"
                type="text"
                class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-white/5 disabled:text-white/50 text-white placeholder-white/40"
                placeholder="Musterstraße 123, 12345 Musterstadt"
                required
              />
            </div>

            <!-- Contact Date -->
            <div>
              <label class="block text-sm font-medium text-blue-200 mb-2">
                Kontaktdatum * <span class="text-white/40 text-xs">(TT.MM.JJJJ)</span>
              </label>
              <input 
                v-model="contactForm.contactDate"
                type="date"
                lang="de-DE"
                locale="de-DE"
                :data-locale="'de-DE'"
                class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                required
              />
            </div>

            <!-- Contact Time -->
            <div>
              <label class="block text-sm font-medium text-blue-200 mb-2">
                Uhrzeit *
              </label>
              <input 
                v-model="contactForm.contactTime"
                type="time"
                lang="de"
                class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                required
              />
            </div>

            <!-- Waiting Time / Status -->
            <div>
              <label class="block text-sm font-medium text-blue-200 mb-3">
                Ergebnis des Kontaktversuchs *
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="option in waitingTimeOptions"
                  :key="option"
                  type="button"
                  @click="selectWaitingTime(option)"
                  :class="[
                    'p-3 rounded-lg border transition-all text-sm text-left',
                    contactForm.waitingTime === option
                      ? 'bg-blue-500/30 border-blue-500 text-blue-200'
                      : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                  ]"
                >
                  {{ option }}
                </button>
              </div>
              
              <!-- Custom input -->
              <div class="mt-3">
                <input 
                  v-model="customWaitingTime"
                  @input="selectCustomWaitingTime"
                  type="text"
                  class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-white/40"
                  placeholder="Oder eigene Eingabe..."
                />
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex gap-3 mt-6">
            <button 
              @click="closeContactModal"
              class="flex-1 px-4 py-2 text-white/80 bg-white/10 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
            >
              Abbrechen
            </button>
            <button 
              @click="submitContactAttempt"
              :disabled="!contactForm.therapistName || !contactForm.therapistAddress || !contactForm.waitingTime"
              class="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ editingAttemptId ? 'Aktualisieren' : 'Hinzufügen' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
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
  therapistName?: string
  therapistAddress?: string
}

const onboardingStore = useOnboardingStore()

// Tab management with URL routing
const activeTab = ref('search')

// Initialize tab from URL path or temporary query parameter
const initializeTabFromUrl = () => {
  const path = route.path
  const tempTab = route.query._tab
  
  // Check if we have a temporary tab parameter (from redirect)
  if (tempTab === 'contact-protocol') {
    activeTab.value = 'kontaktprotokoll'
    // Clean up the URL - remove query param and set proper path
    if (process.client) {
      window.history.replaceState({}, '', '/therapists/contact-protocol')
    }
  } else if (path === '/therapists/contact-protocol') {
    activeTab.value = 'kontaktprotokoll'
  } else {
    activeTab.value = 'search'
  }
}

// Update URL when tab changes using history.pushState for clean URLs
const updateTabUrl = (tab: string) => {
  const newPath = tab === 'kontaktprotokoll' ? '/therapists/contact-protocol' : '/therapists'
  
  if (process.client) {
    // Check current browser URL instead of route.path to handle history.pushState changes
    const currentPath = window.location.pathname
    if (currentPath !== newPath) {
      window.history.pushState({}, '', newPath)
    }
  }
}

// Watch for tab changes and update URL
watch(activeTab, (newTab) => {
  updateTabUrl(newTab)
})

// Watch for route changes and update tab
watch(() => route.path, (newPath) => {
  // Initialize tab based on URL when component loads or route changes
  initializeTabFromUrl()
}, { immediate: true })

// Listen for browser back/forward navigation
onMounted(() => {
  if (process.client) {
    window.addEventListener('popstate', () => {
      // Update tab when user uses browser back/forward
      nextTick(() => {
        initializeTabFromUrl()
      })
    })
  }
})

// Loading state for Pinia data
const isPiniaLoading = ref(true)
// Loading state for localStorage data
const isLocalStorageLoading = ref(true)

// Bookmark management
const bookmarkedTherapists = ref<TherapistData[]>([])
const contactAttempts = ref<ContactAttempt[]>([])
const manualContactAttempts = ref<ContactAttempt[]>([])

// Modal state
const showContactModal = ref(false)
const currentTherapist = ref<TherapistData | null>(null)
const isManualEntry = ref(false)
const editingAttemptId = ref<string | null>(null)

// Contact attempt form data
const contactForm = ref({
  therapistName: '',
  therapistAddress: '',
  contactDate: new Date().toISOString().split('T')[0],
  contactTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
  replyReceived: false,
  waitingTime: ''
})

const customWaitingTime = ref('')

// Predefined waiting time options (these automatically set replyReceived = true)
const waitingTimeOptions = [
  'Gar nicht erreichbar',
  'Keinen Behandlungsplatz frei',
  'Wartezeit über 3 Monate',
  'Wartezeit über 6 Monate', 
  'Wartezeit über 12 Monate',
  'Wartezeit: 1 Monat',
  'Wartezeit: 2 Monate',
  'Wartezeit: 4-6 Monate'
]

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

// Load manual contact attempts from localStorage
const loadManualContactAttempts = () => {
  if (process.client) {
    try {
      const stored = localStorage.getItem('manual-contact-attempts')
      if (stored) {
        manualContactAttempts.value = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load manual contact attempts:', error)
    }
  }
}

// Save manual contact attempts to localStorage
const saveManualContactAttempts = () => {
  if (process.client) {
    try {
      localStorage.setItem('manual-contact-attempts', JSON.stringify(manualContactAttempts.value))
    } catch (error) {
      console.warn('Failed to save manual contact attempts:', error)
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
  // Initialize tab from URL
  initializeTabFromUrl()
  
  // Load persisted data
  loadBookmarkedTherapists()
  loadContactAttempts()
  loadManualContactAttempts()
  
  // Mark localStorage loading as complete
  isLocalStorageLoading.value = false
  
  // Try to force German locale for date inputs
  if (process.client) {
    try {
      // Set document language
      document.documentElement.lang = 'de-DE'
      document.documentElement.setAttribute('locale', 'de-DE')
      
      // Try to set browser locale preference
      if (navigator.language !== 'de-DE') {
        console.log('Browser locale:', navigator.language, '- trying to apply German formatting')
      }
      
      // Enhanced CSS for date inputs
      const style = document.createElement('style')
      style.textContent = `
        input[type="date"] {
          color-scheme: dark;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        input[type="date"]::-webkit-datetime-edit {
          color: white;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        /* Try to influence locale presentation */
        input[type="date"][lang="de-DE"] {
          writing-mode: initial;
          direction: ltr;
        }
      `
      document.head.appendChild(style)
      
      // Try to apply locale to existing inputs
      nextTick(() => {
        const dateInputs = document.querySelectorAll('input[type="date"]')
        dateInputs.forEach(input => {
          input.setAttribute('lang', 'de-DE')
          input.setAttribute('locale', 'de-DE')
        })
      })
    } catch (error) {
      console.warn('Could not set date locale styling:', error)
    }
  }
  
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

// Waiting time selection functions
const selectWaitingTime = (option: string) => {
  contactForm.value.waitingTime = option
  contactForm.value.replyReceived = true
  customWaitingTime.value = ''
}

const selectCustomWaitingTime = () => {
  if (customWaitingTime.value.trim()) {
    contactForm.value.waitingTime = customWaitingTime.value.trim()
    contactForm.value.replyReceived = true
  } else {
    contactForm.value.waitingTime = ''
    contactForm.value.replyReceived = false
  }
}

// Contact attempt functions
const getContactAttempts = (therapistId: string) => {
  return contactAttempts.value.filter(attempt => attempt.therapistId === therapistId)
}

const openContactModal = (therapist?: TherapistData) => {
  // Reset editing state
  editingAttemptId.value = null
  
  if (therapist) {
    currentTherapist.value = therapist
    isManualEntry.value = false
    contactForm.value.therapistName = therapist.name
    contactForm.value.therapistAddress = therapist.address || ''
  } else {
    currentTherapist.value = null
    isManualEntry.value = true
    contactForm.value.therapistName = ''
    contactForm.value.therapistAddress = ''
  }
  
  // Reset form
  const now = new Date()
  contactForm.value.contactDate = now.toISOString().split('T')[0]
  contactForm.value.contactTime = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  contactForm.value.replyReceived = false
  contactForm.value.waitingTime = ''
  customWaitingTime.value = ''
  
  showContactModal.value = true
}

const closeContactModal = () => {
  showContactModal.value = false
  currentTherapist.value = null
  isManualEntry.value = false
  editingAttemptId.value = null
}

const submitContactAttempt = () => {
  // Validation: require waiting time
  if (!contactForm.value.waitingTime.trim()) {
    alert('Bitte wähle ein Ergebnis des Kontaktversuchs aus.')
    return
  }
  
  if (editingAttemptId.value) {
    // Update existing attempt
    const attempt = contactAttempts.value.find(a => a.id === editingAttemptId.value) || 
                   manualContactAttempts.value.find(a => a.id === editingAttemptId.value)
    
    if (attempt) {
      attempt.contactDate = contactForm.value.contactDate
      attempt.contactTime = contactForm.value.contactTime
      attempt.replyReceived = contactForm.value.replyReceived
      attempt.waitingTime = contactForm.value.waitingTime
      attempt.therapistName = contactForm.value.therapistName
      attempt.therapistAddress = contactForm.value.therapistAddress
      
      saveContactAttempts()
      saveManualContactAttempts()
    }
  } else {
    // Check for existing contact attempt for this therapist
    const therapistId = currentTherapist.value?.id
    if (therapistId) {
      const existingAttempt = contactAttempts.value.find(a => a.therapistId === therapistId)
      if (existingAttempt) {
        alert('Für diesen Therapeuten existiert bereits ein Kontaktversuch. Bitte bearbeite den bestehenden Eintrag.')
        return
      }
    }
    
    // Check for duplicate manual entries
    if (isManualEntry.value) {
      const duplicate = manualContactAttempts.value.find(a => 
        a.therapistName.toLowerCase() === contactForm.value.therapistName.toLowerCase() &&
        a.therapistAddress.toLowerCase() === contactForm.value.therapistAddress.toLowerCase()
      )
      if (duplicate) {
        alert('Für diesen Therapeuten existiert bereits ein manueller Kontaktversuch.')
        return
      }
    }
    
    // Create new attempt
    const attempt: ContactAttempt = {
      id: Date.now().toString(),
      therapistId: currentTherapist.value?.id || 'manual-' + Date.now(),
      contactDate: contactForm.value.contactDate,
      contactTime: contactForm.value.contactTime,
      replyReceived: contactForm.value.replyReceived,
      waitingTime: contactForm.value.waitingTime,
      therapistName: contactForm.value.therapistName,
      therapistAddress: contactForm.value.therapistAddress
    }
    
    if (isManualEntry.value) {
      manualContactAttempts.value.push(attempt)
      saveManualContactAttempts()
    } else {
      contactAttempts.value.push(attempt)
      saveContactAttempts()
    }
  }
  
  closeContactModal()
}

const addContactAttempt = (therapist: TherapistData) => {
  openContactModal(therapist)
}

const editContactAttempt = (attemptId: string) => {
  const attempt = contactAttempts.value.find(a => a.id === attemptId) || 
                 manualContactAttempts.value.find(a => a.id === attemptId)
  
  if (attempt) {
    // Determine if it's a manual entry
    isManualEntry.value = manualContactAttempts.value.some(a => a.id === attemptId)
    
    // Find the associated therapist if it's not a manual entry
    if (!isManualEntry.value) {
      currentTherapist.value = bookmarkedTherapists.value.find(t => t.id === attempt.therapistId) || null
    } else {
      currentTherapist.value = null
    }
    
    // Set up form with existing data
    contactForm.value = {
      therapistName: attempt.therapistName || currentTherapist.value?.name || '',
      therapistAddress: attempt.therapistAddress || currentTherapist.value?.address || '',
      contactDate: attempt.contactDate,
      contactTime: attempt.contactTime,
      replyReceived: attempt.replyReceived,
      waitingTime: attempt.waitingTime || ''
    }
    
    // Check if it's a custom waiting time (not in predefined options)
    if (attempt.waitingTime && !waitingTimeOptions.includes(attempt.waitingTime)) {
      customWaitingTime.value = attempt.waitingTime
      contactForm.value.waitingTime = ''
    } else {
      customWaitingTime.value = ''
    }
    
    // Store the attempt ID for updating
    editingAttemptId.value = attemptId
    
    showContactModal.value = true
  }
}

const toggleReplyStatus = (attemptId: string) => {
  editContactAttempt(attemptId)
}

const removeContactAttempt = (attemptId: string) => {
  const index = contactAttempts.value.findIndex(attempt => attempt.id === attemptId)
  if (index >= 0) {
    contactAttempts.value.splice(index, 1)
    saveContactAttempts()
    return
  }
  
  const manualIndex = manualContactAttempts.value.findIndex(attempt => attempt.id === attemptId)
  if (manualIndex >= 0) {
    manualContactAttempts.value.splice(manualIndex, 1)
    saveManualContactAttempts()
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

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit' 
  })
}

const formatDateWithTime = (dateString: string, timeString: string) => {
  const formattedDate = formatDate(dateString)
  return `${formattedDate} ${timeString}`
}

// Check if a contact attempt qualifies for PDF inclusion
const qualifiesForPdf = (attempt: ContactAttempt): boolean => {
  const waitingTime = attempt.waitingTime?.toLowerCase() || ''
  
  // Include attempts with no response or long wait times
  return waitingTime.includes('gar nicht erreichbar') ||
         waitingTime.includes('keinen behandlungsplatz frei') ||
         waitingTime.includes('über 3 monate') ||
         waitingTime.includes('über 6 monate') ||
         waitingTime.includes('über 12 monate') ||
         waitingTime.includes('4-6 monate')
}

const totalContactAttempts = computed(() => {
  return contactAttempts.value.length + manualContactAttempts.value.length
})

const qualifyingContactAttempts = computed(() => {
  const qualifying = []
  
  // Get one attempt per therapist (most recent qualifying one)
  const therapistAttempts = new Map()
  
  // Process bookmarked therapist attempts
  contactAttempts.value.forEach(attempt => {
    if (qualifiesForPdf(attempt)) {
      const existing = therapistAttempts.get(attempt.therapistId)
      if (!existing || new Date(attempt.contactDate) > new Date(existing.contactDate)) {
        therapistAttempts.set(attempt.therapistId, attempt)
      }
    }
  })
  
  // Process manual attempts
  manualContactAttempts.value.forEach(attempt => {
    if (qualifiesForPdf(attempt)) {
      const key = `${attempt.therapistName}-${attempt.therapistAddress}`
      const existing = therapistAttempts.get(key)
      if (!existing || new Date(attempt.contactDate) > new Date(existing.contactDate)) {
        therapistAttempts.set(key, attempt)
      }
    }
  })
  
  return Array.from(therapistAttempts.values())
})

// Sort bookmarked therapists by completion status
const sortedBookmarkedTherapists = computed(() => {
  return [...bookmarkedTherapists.value].sort((a, b) => {
    const attemptsA = getContactAttempts(a.id)
    const attemptsB = getContactAttempts(b.id)
    
    const isCompletedA = attemptsA.length > 0 && attemptsA.every(attempt => attempt.replyReceived)
    const isCompletedB = attemptsB.length > 0 && attemptsB.every(attempt => attempt.replyReceived)
    
    // Incomplete therapists first (no attempts or pending attempts)
    if (!isCompletedA && isCompletedB) return -1
    if (isCompletedA && !isCompletedB) return 1
    
    // Among incomplete, prioritize those with no attempts
    if (!isCompletedA && !isCompletedB) {
      if (attemptsA.length === 0 && attemptsB.length > 0) return -1
      if (attemptsA.length > 0 && attemptsB.length === 0) return 1
    }
    
    return 0
  })
})

// Helper to check if therapist is completed
const isTherapistCompleted = (therapistId: string) => {
  const attempts = getContactAttempts(therapistId)
  return attempts.length > 0 && attempts.every(attempt => attempt.replyReceived)
}

// Collapsible state for completed therapists
const collapsedCompletedTherapists = ref(new Set<string>())
const showAllCompleted = ref(false)

const toggleTherapistCollapse = (therapistId: string) => {
  if (collapsedCompletedTherapists.value.has(therapistId)) {
    collapsedCompletedTherapists.value.delete(therapistId)
  } else {
    collapsedCompletedTherapists.value.add(therapistId)
  }
}

const toggleAllCompleted = () => {
  showAllCompleted.value = !showAllCompleted.value
}

// Get completed and incomplete therapists separately
const incompleteTherapists = computed(() => {
  return sortedBookmarkedTherapists.value.filter(t => !isTherapistCompleted(t.id))
})

const completedTherapists = computed(() => {
  return sortedBookmarkedTherapists.value.filter(t => isTherapistCompleted(t.id))
})

// Display therapists - incomplete ones in main section, completed ones only in completed section
const displayedTherapists = computed(() => {
  return incompleteTherapists.value
})

const generatePdf = async () => {
  // Dynamically import jsPDF
  const { jsPDF } = await import('jspdf')
  
  const pdf = new jsPDF()
      
      // Title
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Kontaktprotokoll für Psychotherapieplätze', 105, 25, { align: 'center' })
      
      // Subtitle
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('(Nachweis der Kontaktaufnahme nach § 13 Abs. 3 der Psychotherapie-Richtlinie)', 105, 35, { align: 'center' })
      
      // Patient info
      pdf.setFontSize(11)
      pdf.text(`PLZ: ${userPlz.value || '_____'}`, 20, 55)
      pdf.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 150, 55)
      
      // Table setup
      const columnWidths = [70, 50, 50]
      const startX = 20
      const startY = 75
      let yPosition = startY
      
      // Table headers
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      
      // Header background
      pdf.setFillColor(240, 240, 240)
      pdf.rect(startX, yPosition, 170, 20, 'F')
      
      // Header borders
      pdf.setLineWidth(0.5)
      pdf.rect(startX, yPosition, columnWidths[0], 20)
      pdf.rect(startX + columnWidths[0], yPosition, columnWidths[1], 20)
      pdf.rect(startX + columnWidths[0] + columnWidths[1], yPosition, columnWidths[2], 20)
      
      // Header text
      pdf.text('Name des kassenzugelassenen', startX + 2, yPosition + 8)
      pdf.text('Psychotherapeuten, Ort', startX + 2, yPosition + 13)
      
      pdf.text('Datum und Uhrzeit der', startX + columnWidths[0] + 2, yPosition + 8)
      pdf.text('Kontaktaufnahme', startX + columnWidths[0] + 2, yPosition + 13)
      
      pdf.text('Auskunft über Wartezeit auf', startX + columnWidths[0] + columnWidths[1] + 2, yPosition + 8)
      pdf.text('Behandlungsplatz', startX + columnWidths[0] + columnWidths[1] + 2, yPosition + 13)
      
      yPosition += 20
      
      // Table rows
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      
      // Use only qualifying contact attempts (one per therapist)
      const allAttempts = qualifyingContactAttempts.value.map(attempt => {
        // Find the therapist info for bookmarked therapists
        const therapist = bookmarkedTherapists.value.find(t => t.id === attempt.therapistId) || {
          name: attempt.therapistName,
          address: attempt.therapistAddress
        }
        
        return {
          therapist,
          attempt
        }
      })
      
      // Sort by date
      allAttempts.sort((a, b) => new Date(a.attempt.contactDate) - new Date(b.attempt.contactDate))
      
      allAttempts.forEach(({ therapist, attempt }) => {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = 20
        }
        
        const rowHeight = 15
        
        // Row borders
        pdf.rect(startX, yPosition, columnWidths[0], rowHeight)
        pdf.rect(startX + columnWidths[0], yPosition, columnWidths[1], rowHeight)
        pdf.rect(startX + columnWidths[0] + columnWidths[1], yPosition, columnWidths[2], rowHeight)
        
        // Therapist info
        const therapistName = therapist.name || 'Unbekannt'
        const therapistLocation = therapist.address || attempt.therapistAddress || ''
        
        pdf.text(therapistName, startX + 2, yPosition + 6)
        if (therapistLocation) {
          pdf.text(therapistLocation, startX + 2, yPosition + 11)
        }
        
        // Contact date and time
        const contactDate = formatDate(attempt.contactDate)
        const contactTime = attempt.contactTime || ''
        pdf.text(contactDate, startX + columnWidths[0] + 2, yPosition + 6)
        pdf.text(contactTime, startX + columnWidths[0] + 2, yPosition + 11)
        
        // Waiting time info
        let waitingInfo = ''
        if (attempt.replyReceived) {
          waitingInfo = attempt.waitingTime || 'Rückmeldung erhalten'
        } else {
          waitingInfo = 'Aktuell keine Behandlungsplätze verfügbar*'
        }
        
        // Word wrap for waiting time
        const maxWidth = columnWidths[2] - 4
        const lines = pdf.splitTextToSize(waitingInfo, maxWidth)
        let lineY = yPosition + 6
        lines.forEach(line => {
          pdf.text(line, startX + columnWidths[0] + columnWidths[1] + 2, lineY)
          lineY += 4
        })
        
        yPosition += rowHeight
      })
      
      // Footer note
      yPosition += 10
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('* „Aktuell keine Behandlungsplätze verfügbar" = Es wird gar keine Warteliste aus', 20, yPosition)
      pdf.text('Mangel an Plätzen geführt oder die Wartezeit beträgt über sechs Monate.', 20, yPosition + 8)
      
  return pdf
}

const exportToPdf = async () => {
  if (process.client) {
    try {
      const pdf = await generatePdf()
      
      // Save the PDF
      const fileName = `Kontaktprotokoll_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Fehler beim Erstellen des PDFs. Bitte versuche es erneut.')
    }
  }
}

const previewPdf = async () => {
  if (process.client) {
    try {
      const pdf = await generatePdf()
      
      // Open PDF in new tab
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
      
    } catch (error) {
      console.error('PDF preview failed:', error)
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