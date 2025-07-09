<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-4xl flex-col items-center gap-4 px-4 sm:px-6">
      <!-- KARL Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-blue-500/30 bg-linear-to-br from-blue-400/80 to-blue-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          K
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
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
              : onboardingStore.formData.location && userPlz
                ? 'Suche Therapeuten in deiner Nähe...'
                : 'Bitte gib deine Postleitzahl an, um zu starten.'
            }}
          </template>
          <template v-else>
            Lade deine gespeicherten Daten...
          </template>
        </p>
      </div>

      <!-- Tab Navigation -->
      <div v-if="!isPiniaLoading && onboardingStore.formData.location && userPlz" class="w-full">
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button 
              @click="activeTab = 'search'"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'search' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              ]"
            >
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 flex-shrink-0" />
                <span class="truncate">Therapeuten suchen</span>
              </div>
            </button>
            <button 
              @click="activeTab = 'kontaktprotokoll'"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'kontaktprotokoll' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              ]"
            >
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-document-text" class="w-4 h-4 flex-shrink-0" />
                <span class="truncate">Kontaktprotokoll</span>
                <UBadge v-if="bookmarkedTherapists.length > 0" color="white" variant="solid" size="xs" class="ml-1 flex-shrink-0">
                  {{ bookmarkedTherapists.length }}
                </UBadge>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Filters (only show on search tab) -->
      <div v-if="!isPiniaLoading && onboardingStore.formData.location && userPlz && activeTab === 'search'" class="w-full">
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

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            <!-- Therapy Type -->
            <select 
              v-model="filters.therapyType"
              class="text-xs sm:text-sm px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Therapiearten" class="text-gray-900">Alle Therapien</option>
              <option v-for="option in therapyTypeOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option.replace('Kinder- & Jugendtherapie', 'K&J-Therapie') }}
              </option>
            </select>

            <!-- Problem -->
            <select 
              v-model="filters.problem"
              class="text-xs sm:text-sm px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Probleme" class="text-gray-900">Alle Probleme</option>
              <option v-for="option in searchProblemOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option }}
              </option>
            </select>

            <!-- Age Group -->
            <select 
              v-model="filters.ageGroup"
              class="text-xs sm:text-sm px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Altersgruppen" class="text-gray-900">Alle Altersgruppen</option>
              <option v-for="option in ageGroupOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option }}
              </option>
            </select>

            <!-- Billing -->
            <select 
              v-model="filters.billing"
              class="text-xs sm:text-sm px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Alle Abrechnungsarten" class="text-gray-900">Alle Abrechnungen</option>
              <option v-for="option in billingOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option.replace('Gesetzliche Krankenversicherung', 'Gesetzlich').replace('Private Krankenversicherung', 'Privat') }}
              </option>
            </select>

            <!-- Gender -->
            <select 
              v-model="filters.gender"
              class="text-xs sm:text-sm px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Egal" class="text-gray-900">Geschlecht egal</option>
              <option v-for="option in genderOptions.slice(1)" :key="option" :value="option" class="text-gray-900">
                {{ option }}
              </option>
            </select>

            <!-- Free Places -->
            <select 
              v-model="filters.freePlaces"
              class="text-xs sm:text-sm px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
        
        <!-- Disclaimers -->
        <div class="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
          <div class="flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
            <div class="space-y-1">
              <p class="text-amber-200 text-xs font-medium">
                Wichtige Hinweise zu den Suchergebnissen:
              </p>
              <p class="text-amber-100/90 text-xs">
                • <strong>Keine Garantie für Richtigkeit der Daten</strong> - Bitte prüfe Kontaktdaten und Verfügbarkeit direkt beim Therapeuten<br>
                • <strong>Achtung vor Heilpraktikern:</strong> Diese können nicht mit der Krankenkasse abrechnen. Achte auf approbierte Psychotherapeuten
              </p>
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
            class="rounded-xl bg-white/10 backdrop-blur-sm p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-colors group"
          >
            <!-- Mobile Layout -->
            <div class="md:hidden">
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
                <div class="flex-1 min-w-0 cursor-pointer" @click="openTherapistProfile(therapist.profileUrl)">
                  <h4 class="font-semibold text-white text-sm group-hover:text-blue-200 transition-colors">
                    {{ therapist.name }}
                  </h4>
                  <p class="text-blue-100/80 text-xs mt-1 line-clamp-2">
                    {{ therapist.qualification }}
                  </p>
                  <div class="flex flex-col gap-1 mt-2 text-xs text-blue-100/60">
                    <div class="flex items-center gap-1">
                      <span>📍</span>
                      <span>{{ therapist.distance }}km</span>
                    </div>
                    <div v-if="therapist.phone" class="flex items-center gap-1">
                      <span>📞</span>
                      <span class="truncate">{{ therapist.phone }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Mobile Action Buttons -->
              <div class="flex items-center justify-end gap-2 mt-3">
                <button 
                  v-if="therapist.phone"
                  @click="callTherapist(therapist.phone)"
                  class="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all"
                  title="Anrufen"
                >
                  <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                </button>
                <!-- Debug email button visibility -->
                <div v-if="debugMode" class="text-xs text-yellow-300 bg-black/20 px-1 rounded">
                  Email: {{ therapist.email ? 'Yes' : 'No' }} | Source: {{ therapist.source }}
                </div>
                <button 
                  v-if="therapist.email"
                  @click="openEmailDialog(therapist)"
                  class="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                  title="E-Mail schreiben"
                >
                  <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                </button>
                <!-- Temporary test button for all therapists -->
                <button 
                  v-if="!therapist.email && debugMode"
                  @click="testEmailDialog(therapist)"
                  class="p-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all"
                  title="Test E-Mail (Debug)"
                >
                  <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                </button>
                <button 
                  @click="toggleBookmark(therapist)"
                  :class="[
                    'p-2 rounded-lg transition-all',
                    isBookmarked(therapist.id) 
                      ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' 
                      : 'bg-white/10 text-blue-100/60 hover:bg-white/20 hover:text-blue-200'
                  ]"
                  title="Therapeut merken"
                >
                  <UIcon :name="isBookmarked(therapist.id) ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
                </button>
                <button 
                  @click="addContactAttemptFromSearch(therapist)"
                  class="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                  title="Kontaktversuch hinzufügen"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                </button>
                <button 
                  @click="openTherapistProfile(therapist.profileUrl)"
                  class="p-2 rounded-lg bg-white/10 text-blue-100/60 hover:bg-white/20 hover:text-blue-200 transition-all"
                  title="Profil öffnen"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Desktop/Tablet Layout -->
            <div class="hidden md:block">
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
                    v-if="therapist.phone"
                    @click="callTherapist(therapist.phone)"
                    class="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all"
                    title="Anrufen"
                  >
                    <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                  </button>
                  <!-- Debug email button visibility -->
                  <div v-if="debugMode" class="text-xs text-yellow-300 bg-black/20 px-1 rounded">
                    Email: {{ therapist.email ? 'Yes' : 'No' }} | Source: {{ therapist.source }}
                  </div>
                  <button 
                    v-if="therapist.email"
                    @click="openEmailDialog(therapist)"
                    class="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                    title="E-Mail schreiben"
                  >
                    <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                  </button>
                  <!-- Temporary test button for all therapists -->
                  <button 
                    v-if="!therapist.email && debugMode"
                    @click="testEmailDialog(therapist)"
                    class="p-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all"
                    title="Test E-Mail (Debug)"
                  >
                    <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                  </button>
                  <button 
                    @click="toggleBookmark(therapist)"
                    :class="[
                      'p-2 rounded-lg transition-all',
                      isBookmarked(therapist.id) 
                        ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' 
                        : 'bg-white/10 text-blue-100/60 hover:bg-white/20 hover:text-blue-200'
                    ]"
                    title="Therapeut merken"
                  >
                    <UIcon :name="isBookmarked(therapist.id) ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
                  </button>
                  <button 
                    @click="addContactAttemptFromSearch(therapist)"
                    class="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                    title="Kontaktversuch hinzufügen"
                  >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                  </button>
                  <button 
                    @click="openTherapistProfile(therapist.profileUrl)"
                    class="p-2 rounded-lg bg-white/10 text-blue-100/60 hover:bg-white/20 hover:text-blue-200 transition-all"
                    title="Profil öffnen"
                  >
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                  </button>
                </div>
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
          <div class="flex flex-col sm:flex-row gap-3">
            <button 
              @click="previewPdf"
              :disabled="qualifyingContactAttempts.length === 0"
              class="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white text-sm font-medium transition-all hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                <span class="hidden sm:inline">PDF in neuem Tab öffnen</span>
                <span class="sm:hidden">Vorschau</span>
              </div>
            </button>
            <button 
              @click="exportToPdf"
              :disabled="qualifyingContactAttempts.length === 0"
              class="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white text-sm font-medium transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                <span class="hidden sm:inline">PDF herunterladen</span>
                <span class="sm:hidden">Download</span>
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
              <div class="space-y-3">
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
                </div>

                <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div :class="[
                    'text-xs px-3 py-1.5 rounded-lg border flex-1 sm:flex-none',
                    attempt.replyReceived 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  ]">
                    <div class="flex items-center gap-1">
                      <UIcon :name="attempt.replyReceived ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="w-3 h-3 flex-shrink-0" />
                      <span class="sm:hidden">{{ attempt.replyReceived ? 'Antwort' : 'Wartet' }}</span>
                      <span class="hidden sm:inline">{{ attempt.replyReceived ? 'Rückmeldung bekommen' : 'Ausstehend' }}</span>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button 
                      @click="toggleReplyStatus(attempt.id)"
                      class="flex-1 sm:flex-none p-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all flex items-center justify-center"
                      title="Bearbeiten"
                    >
                      <UIcon name="i-heroicons-pencil-square" class="w-3 h-3" />
                    </button>
                    <button 
                      @click="removeContactAttempt(attempt.id)"
                      class="flex-1 sm:flex-none p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all flex items-center justify-center"
                      title="Löschen"
                    >
                      <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                    </button>
                  </div>
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
            
            <!-- Active Therapists Title -->
            <div v-if="displayedTherapists.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-blue-200">Noch zu bearbeiten</h4>
              <p class="text-xs text-blue-100/60 mt-1">Therapeuten, die noch kontaktiert werden müssen oder auf Antwort warten</p>
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
                    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <!-- Therapist Details -->
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-white text-sm">{{ therapist.name }}</h4>
                        <p class="text-blue-100/80 text-xs mt-1">{{ therapist.qualification }}</p>
                        <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-blue-100/60">
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
                      <div class="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                        <button 
                          v-if="!getContactAttempts(therapist.id).length"
                          @click="addContactAttempt(therapist)"
                          class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm whitespace-nowrap"
                          title="Kontaktversuch hinzufügen"
                        >
                          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                          <span class="hidden md:inline">Kontaktversuch hinzufügen</span>
                          <span class="md:hidden">Kontaktversuch</span>
                        </button>
                        <div 
                          v-else
                          class="p-2 rounded-lg bg-gray-500/20 text-gray-400 text-xs px-3 text-center whitespace-nowrap"
                          title="Kontaktversuch bereits vorhanden"
                        >
                          <span class="hidden md:inline">Bereits kontaktiert</span>
                          <span class="md:hidden">Kontaktiert</span>
                        </div>
                        <div class="flex gap-2">
                          <button 
                            @click="confirmRemoveBookmark(therapist)"
                            class="flex-1 md:flex-none px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                            title="Therapeut merken/entfernen"
                          >
                            <UIcon name="i-heroicons-bookmark-solid" class="w-4 h-4" />
                            <span class="hidden md:inline">Entfernen</span>
                          </button>
                          <button 
                            v-if="therapist.phone"
                            @click="callTherapist(therapist.phone)"
                            class="flex-1 md:flex-none px-3 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                            title="Anrufen"
                          >
                            <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                            <span class="hidden md:inline">Anrufen</span>
                          </button>
                        </div>
                      </div>
                    </div>
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
                      <div class="space-y-2">
                        <div class="flex items-center gap-2">
                          <div :class="[
                            'w-2 h-2 rounded-full flex-shrink-0',
                            attempt.replyReceived ? 'bg-green-400' : 'bg-yellow-400'
                          ]"></div>
                          <span class="text-blue-100 text-xs">{{ formatDateWithTime(attempt.contactDate, attempt.contactTime) }}</span>
                        </div>
                        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div :class="[
                            'text-xs px-2 py-1 rounded border flex-1 sm:flex-none',
                            attempt.replyReceived 
                              ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          ]">
                            <div class="flex items-center gap-1">
                              <UIcon :name="attempt.replyReceived ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="w-3 h-3 flex-shrink-0" />
                              <span class="sm:hidden">{{ attempt.replyReceived ? 'Antwort' : 'Wartet' }}</span>
                              <span class="hidden sm:inline">{{ attempt.replyReceived ? 'Rückmeldung bekommen' : 'Ausstehend' }}</span>
                            </div>
                          </div>
                          <div class="flex gap-2">
                            <button 
                              @click="toggleReplyStatus(attempt.id)"
                              class="flex-1 sm:flex-none p-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all flex items-center justify-center"
                              title="Bearbeiten"
                            >
                              <UIcon name="i-heroicons-pencil-square" class="w-3 h-3" />
                            </button>
                            <button 
                              @click="removeContactAttempt(attempt.id)"
                              class="flex-1 sm:flex-none p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all flex items-center justify-center"
                              title="Löschen"
                            >
                              <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div v-if="attempt.waitingTime" class="text-blue-100/80 text-xs">
                          Abgespeichert: {{ attempt.waitingTime }}
                        </div>
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
                        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                          <!-- Details -->
                          <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-white/80 text-sm">{{ therapist.name }}</h4>
                            <p class="text-blue-100/60 text-xs mt-1">{{ therapist.qualification }}</p>
                            <div class="space-y-1 mt-2">
                              <div class="flex items-center gap-3 text-xs text-blue-100/50">
                                <div class="flex items-center gap-1">
                                  <span>📍</span>
                                  <span>{{ therapist.distance }}km</span>
                                </div>
                                <div v-if="therapist.phone" class="flex items-center gap-1">
                                  <span>📞</span>
                                  <span>{{ therapist.phone }}</span>
                                </div>
                              </div>
                              <div class="flex flex-wrap items-center gap-2 text-xs">
                                <div class="flex items-center gap-1 text-green-400 flex-shrink-0">
                                  <UIcon name="i-heroicons-check-circle" class="w-3 h-3" />
                                  <span>Abgeschlossen</span>
                                </div>
                                <div class="text-blue-100/50 flex-shrink-0">
                                  {{ getContactAttempts(therapist.id).length }} Kontaktversuch(e)
                                </div>
                                <div class="flex items-center gap-1 flex-shrink-0">
                                  <UBadge 
                                    :color="isTherapistIncludedInPdf(therapist.id) ? 'green' : 'gray'" 
                                    variant="soft" 
                                    size="xs"
                                    class="text-xs whitespace-nowrap"
                                  >
                                    {{ isTherapistIncludedInPdf(therapist.id) ? 'Im PDF' : 'Nicht im PDF' }}
                                  </UBadge>
                                </div>
                              </div>
                              <div v-if="getContactAttempts(therapist.id).length > 0" class="space-y-1 mt-2">
                                <div class="text-xs text-blue-100/60">
                                  Letzter Kontakt: {{ formatDate(getContactAttempts(therapist.id)[getContactAttempts(therapist.id).length - 1].contactDate) }}
                                </div>
                                <div v-if="getContactAttempts(therapist.id)[getContactAttempts(therapist.id).length - 1].waitingTime" class="text-xs text-blue-100/70">
                                  <span class="text-blue-200/80">Abgespeichert:</span> {{ getContactAttempts(therapist.id)[getContactAttempts(therapist.id).length - 1].waitingTime }}
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Action Buttons -->
                          <div class="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                            <button 
                              v-if="therapist.phone"
                              @click="callTherapist(therapist.phone)"
                              class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all text-sm"
                              title="Anrufen"
                            >
                              <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                              <span class="hidden md:inline">Anrufen</span>
                            </button>
                            <button 
                              v-if="getContactAttempts(therapist.id).length > 0"
                              @click="editCompletedTherapist(therapist)"
                              class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm"
                              title="Kontaktversuche bearbeiten"
                            >
                              <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                              <span class="hidden md:inline">Bearbeiten</span>
                            </button>
                            <button 
                              @click="confirmRemoveBookmark(therapist)"
                              class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all text-sm"
                              title="Therapeut entfernen"
                            >
                              <UIcon name="i-heroicons-bookmark-solid" class="w-4 h-4" />
                              <span class="hidden md:inline">Entfernen</span>
                            </button>
                          </div>
                        </div>
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
              
              <!-- Primary option: Warte noch auf Rückmeldung -->
              <div class="mb-3">
                <button
                  type="button"
                  @click="selectWaitingTime(primaryWaitingOption)"
                  :class="[
                    'w-full p-3 rounded-lg border transition-all text-sm text-left',
                    contactForm.waitingTime === primaryWaitingOption
                      ? 'bg-yellow-500/30 border-yellow-500 text-yellow-200'
                      : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                  ]"
                >
                  {{ primaryWaitingOption }}
                </button>
              </div>
              
              <!-- Other options in grid -->
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
                  @blur="selectCustomWaitingTime"
                  @keydown.enter="selectCustomWaitingTime"
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
              Schließen
            </button>
            <button 
              v-if="!contactForm.waitingTime"
              @click="submitContactAttempt"
              :disabled="!contactForm.therapistName || !contactForm.therapistAddress || !contactForm.waitingTime"
              class="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ editingAttemptId ? 'Aktualisieren' : 'Hinzufügen' }}
            </button>
            <div v-else class="flex-1 px-4 py-2 text-center text-green-300 bg-green-500/20 rounded-lg border border-green-500/30">
              <div class="flex items-center justify-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                Automatisch gespeichert
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile completion UI when PLZ is missing -->
    <div v-if="!isPiniaLoading && (!onboardingStore.formData.location || !userPlz)" class="text-center space-y-4 mt-8">
      <div class="w-full max-w-md mx-auto">
        <UIcon name="i-heroicons-map-pin" class="w-12 h-12 text-blue-300 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-white mb-2">Postleitzahl erforderlich</h3>
        <p class="text-blue-100/80 text-sm mb-4">
          Bitte gib deine Postleitzahl an, um Therapeuten in deiner Nähe zu finden.
        </p>
        <UButton 
          to="/onboarding" 
          color="primary" 
          size="lg"
          icon="i-heroicons-arrow-right"
          class="w-full"
        >
          Profil vervollständigen
        </UButton>
      </div>
    </div>
  </PageCard>

  <!-- Email Dialog Modal -->
  <div 
    v-if="showEmailDialog" 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="showEmailDialog = false"
  >
    <div @click.stop @keydown.enter="sendWithDefaultClient" class="w-full max-w-lg bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Modal Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-white">
            E-Mail an {{ selectedTherapist?.name }}
          </h3>
          <button @click="showEmailDialog = false" class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <!-- Name Input -->
          <div>
            <label class="block text-sm font-medium text-blue-200 mb-2">
              Ihr vollständiger Name *
            </label>
            <input 
              v-model="emailForm.fullName"
              type="text"
              class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-white/40"
              placeholder="Max Mustermann"
              required
            />
          </div>

          <!-- Age Input -->
          <div>
            <label class="block text-sm font-medium text-blue-200 mb-2">
              Alter (optional)
            </label>
            <input 
              v-model="emailForm.age"
              type="number"
              min="16"
              max="120"
              class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-white/40"
              placeholder="z.B. 25"
            />
          </div>

          <!-- Insurance Type -->
          <div>
            <label class="block text-sm font-medium text-blue-200 mb-2">
              Versicherung (optional)
            </label>
            <div class="flex gap-2 flex-wrap">
              <button
                @click="emailForm.insurance = 'gesetzlich'"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  emailForm.insurance === 'gesetzlich'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/10'
                ]"
                type="button"
              >
                Gesetzlich
              </button>
              <button
                @click="emailForm.insurance = 'privat'"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  emailForm.insurance === 'privat'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/10'
                ]"
                type="button"
              >
                Privat
              </button>
              <button
                @click="emailForm.insurance = 'bewilligte Kostenerstattung'"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  emailForm.insurance === 'bewilligte Kostenerstattung'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/10'
                ]"
                type="button"
              >
                Kostenerstattung
              </button>
              <button
                @click="emailForm.insurance = ''"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  emailForm.insurance === ''
                    ? 'bg-gray-500 text-white'
                    : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/10'
                ]"
                type="button"
              >
                Keine Angabe
              </button>
            </div>
          </div>

          <!-- Problem Selection -->
          <div>
            <label class="block text-sm font-medium text-blue-200 mb-2">
              Problembereiche (mehrere auswählbar)
            </label>
            <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-white/5 border border-white/20 rounded-lg">
              <label 
                v-for="problem in problemOptions" 
                :key="problem"
                class="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
              >
                <input 
                  type="checkbox" 
                  :value="problem"
                  v-model="emailForm.problems"
                  class="rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
                <span class="text-white/80">{{ problem }}</span>
              </label>
            </div>
          </div>

          <!-- Template Selection -->
          <div>
            <label class="block text-sm font-medium text-blue-200 mb-2">
              E-Mail-Vorlage *
            </label>
            <select
              v-model="selectedTemplate"
              class="w-full px-3 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="" class="bg-gray-800 text-white">Vorlage auswählen</option>
              <option 
                v-for="template in templates" 
                :key="template.id"
                :value="template.id"
                class="bg-gray-800 text-white"
              >
                {{ template.name }}
              </option>
            </select>
          </div>

          <!-- Email Preview -->
          <div v-if="selectedTemplate && currentTemplate">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-blue-200">
                E-Mail-Vorschau
              </label>
              <button
                @click="copyEmailPreview"
                class="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="E-Mail Inhalt kopieren"
              >
                <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4" />
              </button>
            </div>
            <div class="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
              <div class="text-sm text-blue-200 mb-2">
                <strong>An:</strong> {{ selectedTherapist?.email || 'test@example.com' }}
              </div>
              <div class="text-sm text-blue-200 mb-2">
                <strong>Betreff:</strong> {{ currentTemplate?.subject }}
              </div>
              <div class="text-sm text-white/90 whitespace-pre-wrap bg-white/10 p-3 rounded border border-white/20 max-h-40 overflow-y-auto">
                {{ previewEmailBody }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 mt-6 pt-4 border-t border-white/20">
          <!-- Primary Action: Most prominent button -->
          <button
            @click="sendWithDefaultClient"
            :disabled="!isFormValid"
            :class="[
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
              isFormValid 
                ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500' 
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            ]"
          >
            <UIcon name="i-heroicons-envelope" class="w-5 h-5" />
            E-Mail-Client mit fertiger Nachricht öffnen
          </button>
          
          <!-- Secondary Actions -->
          <div class="flex gap-3">
            <button
              @click="copyEmailAddress"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white/80 border border-white/20 hover:bg-white/10 hover:text-white transition-all"
            >
              <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4" />
              E-Mail Adresse kopieren
            </button>
            <button
              @click="openEmailClient"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white/80 border border-white/20 hover:bg-white/10 hover:text-white transition-all"
            >
              <UIcon name="i-heroicons-envelope-open" class="w-4 h-4" />
              E-Mail-Client öffnen
            </button>
          </div>
          
          <!-- Coming Soon Button -->
          <button
            @click="sendWithGmail"
            :disabled="!isFormValid"
            :class="[
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium border transition-all',
              isFormValid 
                ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 focus:ring-2 focus:ring-yellow-500' 
                : 'border-white/20 text-white/40 cursor-not-allowed'
            ]"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Automatisch senden (Gmail OAuth) - Coming Soon
          </button>
        </div>
      </div>
    </div>
  </div>
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
  email?: string
  hasHeilpr?: boolean
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

// Use navigation state management
const { setNavItem } = useNavigation()

// Tab management with URL routing
const activeTab = ref('search')

// Initialize tab from URL path or temporary query parameter
const initializeTabFromUrl = () => {
  const path = route.path
  const tempTab = route.query._tab
  
  // Check if we have a temporary tab parameter (from redirect)
  if (tempTab === 'contact-protocol') {
    activeTab.value = 'kontaktprotokoll'
    setNavItem('kontaktprotokoll')
    // Clean up the URL - remove query param and set proper path
    if (process.client) {
      window.history.replaceState({}, '', '/therapists/contact-protocol')
    }
  } else if (path === '/therapists/contact-protocol') {
    activeTab.value = 'kontaktprotokoll'
    setNavItem('kontaktprotokoll')
  } else {
    activeTab.value = 'search'
    setNavItem('therapists')
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

// Watch for tab changes and update URL + navigation state
watch(activeTab, (newTab) => {
  updateTabUrl(newTab)
  // Update navigation state to keep navbar in sync
  setNavItem(newTab === 'kontaktprotokoll' ? 'kontaktprotokoll' : 'therapists')
})

// Watch for route changes and update tab
watch(() => route.path, (newPath) => {
  // Initialize tab based on URL when component loads or route changes
  initializeTabFromUrl()
}, { immediate: true })

// Listen for browser back/forward navigation and navbar clicks
onMounted(() => {
  if (process.client) {
    const handlePopState = () => {
      // Update tab when user uses browser back/forward
      nextTick(() => {
        initializeTabFromUrl()
      })
    }

    const handleNavbarTherapistsClick = () => {
      activeTab.value = 'search'
    }

    const handleNavbarKontaktprotokollClick = () => {
      activeTab.value = 'kontaktprotokoll'
    }

    // Add event listeners
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('navbar-therapists-click', handleNavbarTherapistsClick)
    window.addEventListener('navbar-kontaktprotokoll-click', handleNavbarKontaktprotokollClick)

    // Cleanup on unmount
    onBeforeUnmount(() => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('navbar-therapists-click', handleNavbarTherapistsClick)
      window.removeEventListener('navbar-kontaktprotokoll-click', handleNavbarKontaktprotokollClick)
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

// Email functionality
const { debugMode } = useDebugMode()
const { templates, problemOptions, createMailtoLink } = useEmailTemplates()


const showEmailDialog = ref(false)
const selectedTherapist = ref<TherapistData | null>(null)
const selectedTemplate = ref('initial-inquiry')
const emailForm = ref({
  fullName: '',
  problems: [] as string[],
  age: '',
  insurance: ''
})

// Load saved form data from localStorage
const loadSavedFormData = () => {
  if (!process.client) return
  
  try {
    const savedName = localStorage.getItem('email-form-name')
    const savedProblems = localStorage.getItem('email-form-problems')
    const savedAge = localStorage.getItem('email-form-age')
    const savedInsurance = localStorage.getItem('email-form-insurance')
    
    if (savedName) {
      emailForm.value.fullName = savedName
      console.log('📝 Loaded saved name:', savedName)
    }
    
    if (savedProblems) {
      try {
        emailForm.value.problems = JSON.parse(savedProblems)
        console.log('🔍 Loaded saved problems:', emailForm.value.problems)
      } catch (e) {
        console.warn('Failed to parse saved problems:', e)
      }
    }
    
    if (savedAge) {
      emailForm.value.age = savedAge
      console.log('🎂 Loaded saved age:', savedAge)
    }
    
    if (savedInsurance) {
      emailForm.value.insurance = savedInsurance
      console.log('🏥 Loaded saved insurance:', savedInsurance)
    }
  } catch (error) {
    console.warn('Error accessing localStorage:', error)
  }
}

// Save form data to localStorage
const saveFormData = () => {
  if (!process.client) return
  
  try {
    if (emailForm.value.fullName.trim()) {
      localStorage.setItem('email-form-name', emailForm.value.fullName.trim())
    }
    
    if (emailForm.value.problems.length > 0) {
      localStorage.setItem('email-form-problems', JSON.stringify(emailForm.value.problems))
    } else {
      localStorage.removeItem('email-form-problems')
    }
    
    if (emailForm.value.age && String(emailForm.value.age).trim()) {
      localStorage.setItem('email-form-age', String(emailForm.value.age).trim())
    } else {
      localStorage.removeItem('email-form-age')
    }
    
    if (emailForm.value.insurance.trim()) {
      localStorage.setItem('email-form-insurance', emailForm.value.insurance.trim())
    } else {
      localStorage.removeItem('email-form-insurance')
    }
    
    console.log('💾 Saved form data')
  } catch (error) {
    console.warn('Error saving to localStorage:', error)
  }
}

// Email computed properties
const currentTemplate = computed(() => {
  const template = templates.find(t => t.id === selectedTemplate.value)
  console.log('📋 Current template:', template?.name, selectedTemplate.value)
  return template
})

const previewEmailBody = computed(() => {
  try {
    console.log('👁️ Computing preview body...')
    console.log('   - currentTemplate:', currentTemplate.value?.name)
    console.log('   - selectedTherapist:', selectedTherapist.value?.name)
    
    if (!currentTemplate.value || !selectedTherapist.value) return ''
    
    const ageText = emailForm.value.age ? `\nAlter: ${emailForm.value.age}` : ''

    let problemsText = ''
    if (emailForm.value.problems.length > 0) {
      if (emailForm.value.problems.length === 1) {
        problemsText = `Meine Themen sind ${emailForm.value.problems[0]}.`
      } else if (emailForm.value.problems.length === 2) {
        problemsText = `Zu meinen Themen gehören ${emailForm.value.problems[0]} und ${emailForm.value.problems[1]}.`
      } else {
        const lastProblem = emailForm.value.problems[emailForm.value.problems.length - 1]
        const otherProblems = emailForm.value.problems.slice(0, -1)
        problemsText = `Meine Themen sind ${otherProblems.join(', ')} und ${lastProblem}.`
      }
    }

    const insuranceText = emailForm.value.insurance 
      ? emailForm.value.insurance === 'bewilligte Kostenerstattung' 
        ? 'Ich habe eine bewilligte Kostenerstattung.'
        : `Ich bin ${emailForm.value.insurance} versichert.`
      : ''

    let body = currentTemplate.value.body
      .replace(/{fullName}/g, emailForm.value.fullName || '[Ihr Name]')
      .replace(/{age}/g, ageText)

    if (problemsText) {
      body = body.replace(/{problems}/g, problemsText)
    } else {
      body = body.replace(/{problems}\n/g, '')
    }

    if (insuranceText) {
      body = body.replace(/{insurance}/g, insuranceText)
    } else {
      body = body.replace(/{insurance}\n/g, '')
    }
      
    console.log('📝 Generated email body preview')
    return body
  } catch (error) {
    console.warn('Error generating email preview:', error)
    return 'Fehler beim Generieren der Vorschau'
  }
})

const isFormValid = computed(() => {
  const valid = emailForm.value.fullName.trim() !== '' && 
         selectedTherapist.value?.email &&
         currentTemplate.value
  console.log('✅ Form validation:', {
    hasName: emailForm.value.fullName.trim() !== '',
    hasEmail: !!selectedTherapist.value?.email,
    hasTemplate: !!currentTemplate.value,
    isValid: valid
  })
  return valid
})

// Email methods
const openEmailDialog = (therapist: TherapistData) => {
  console.log('🔘 Email button clicked for:', therapist.name)
  console.log('📧 Therapist email:', therapist.email)
  console.log('🏥 Therapist data:', therapist)
  
  selectedTherapist.value = therapist
  showEmailDialog.value = true
  
  console.log('✅ Modal should be opening now, showEmailDialog:', showEmailDialog.value)
  
  // Reset form but keep saved data
  emailForm.value = {
    fullName: '',
    problems: [],
    age: '',
    insurance: ''
  }
  loadSavedFormData() // Load saved form data
  selectedTemplate.value = 'initial-inquiry'
  
  console.log('📝 Form reset, selectedTemplate:', selectedTemplate.value)
}

const sendWithDefaultClient = () => {
  console.log('📤 Attempting to send email...')
  console.log('   - selectedTherapist:', selectedTherapist.value?.name)
  console.log('   - currentTemplate:', currentTemplate.value?.name)
  console.log('   - emailForm:', emailForm.value)
  
  if (!selectedTherapist.value || !currentTemplate.value) {
    console.error('❌ Missing required data for email send')
    return
  }
  
  const emailData = {
    fullName: emailForm.value.fullName,
    problems: emailForm.value.problems,
    age: emailForm.value.age,
    insurance: emailForm.value.insurance,
    template: currentTemplate.value
  }
  
  console.log('📧 Creating mailto link with data:', emailData)
  
  const mailtoLink = createMailtoLink(
    selectedTherapist.value.email!,
    selectedTherapist.value.name,
    emailData
  )
  
  console.log('🔗 Generated mailto link:', mailtoLink)
  
  window.open(mailtoLink, '_blank')
  showEmailDialog.value = false
  
  console.log('✅ Email client should have opened')
}

const copyEmailAddress = async () => {
  if (!process.client) return
  
  try {
    if (!selectedTherapist.value?.email) {
      console.warn('No email address to copy')
      return
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(selectedTherapist.value.email)
      console.log('📋 Email address copied to clipboard:', selectedTherapist.value.email)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = selectedTherapist.value.email
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      console.log('📋 Email address copied to clipboard (fallback):', selectedTherapist.value.email)
    }
  } catch (error) {
    console.error('Failed to copy email address:', error)
  }
}

const copyEmailPreview = async () => {
  if (!process.client) return
  
  try {
    const emailContent = previewEmailBody.value
    if (!emailContent) {
      console.warn('No email content to copy')
      return
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(emailContent)
      console.log('📋 Email content copied to clipboard')
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = emailContent
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      console.log('📋 Email content copied to clipboard (fallback)')
    }
  } catch (error) {
    console.error('Failed to copy email content:', error)
  }
}

const openEmailClient = () => {
  try {
    if (!selectedTherapist.value?.email) {
      console.warn('No email address to open client with')
      return
    }
    
    const mailtoLink = `mailto:${selectedTherapist.value.email}`
    window.open(mailtoLink, '_blank')
    showEmailDialog.value = false
    console.log('📧 Email client opened with address:', selectedTherapist.value.email)
  } catch (error) {
    console.error('Failed to open email client:', error)
  }
}

const sendWithGmail = () => {
  try {
    console.log('📧 Gmail OAuth clicked (placeholder)')
    alert('Gmail OAuth integration wird in Kürze verfügbar sein!')
  } catch (error) {
    console.error('Gmail OAuth error:', error)
  }
}

const testEmailDialog = (therapist: TherapistData) => {
  console.log('🧪 Test email dialog for:', therapist.name)
  // Set a fake email for testing
  const testTherapist = { ...therapist, email: 'test@example.com' }
  openEmailDialog(testTherapist)
}

// Watch for form changes
watch(emailForm, (newForm) => {
  console.log('📝 Email form changed:', newForm)
}, { deep: true })

// Watch for form changes and save to localStorage (with debounce)
watch(emailForm, () => {
  try {
    saveFormData()
  } catch (error) {
    console.warn('Error saving form data:', error)
  }
}, { deep: true })

watch(selectedTemplate, (newTemplate) => {
  console.log('📋 Selected template changed:', newTemplate)
})

watch(showEmailDialog, (isOpen) => {
  console.log('🪟 Email dialog state changed:', isOpen ? 'OPEN' : 'CLOSED')
})

// Predefined waiting time options (these automatically set replyReceived = true)
const primaryWaitingOption = 'Warte noch auf Rückmeldung'

const waitingTimeOptions = [
  'Gar nicht erreichbar',
  'Keinen Behandlungsplatz frei',
  'Wartezeit: 1 Monat',
  'Wartezeit: 2 Monate',
  'Wartezeit über 3 Monate',
  'Wartezeit: 4-6 Monate',
  'Wartezeit über 6 Monate',
  'Wartezeit über 12 Monate'
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
    billing: 'Gesetzliche Krankenversicherung',
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
  // Initialize tab from URL
  initializeTabFromUrl()
  
  // Load persisted data
  loadBookmarkedTherapists()
  loadContactAttempts()
  loadManualContactAttempts()
  
  // Mark localStorage loading as complete
  isLocalStorageLoading.value = false
  
  // Debug email system
  console.log('🔧 Email system initialized')
  console.log('   - debugMode:', debugMode.value)
  console.log('   - templates available:', templates.length)
  console.log('   - problemOptions available:', problemOptions.length)
  console.log('   - createMailtoLink function:', typeof createMailtoLink)
  
  // Load saved form data on startup
  try {
    loadSavedFormData()
  } catch (error) {
    console.warn('Error loading saved form data:', error)
  }
  
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
  // Set replyReceived based on the option
  contactForm.value.replyReceived = option !== 'Warte noch auf Rückmeldung'
  customWaitingTime.value = ''
  
  // Auto-save when selecting a predefined option
  if (contactForm.value.therapistName && contactForm.value.therapistAddress) {
    submitContactAttempt()
  }
}

const selectCustomWaitingTime = () => {
  if (customWaitingTime.value.trim()) {
    contactForm.value.waitingTime = customWaitingTime.value.trim()
    contactForm.value.replyReceived = true
    
    // Auto-save when entering custom waiting time (on blur/enter)
    if (contactForm.value.therapistName && contactForm.value.therapistAddress) {
      submitContactAttempt()
    }
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

// Quick add contact attempt from search results
const addContactAttemptFromSearch = (therapist: TherapistData) => {
  // Auto-bookmark the therapist if not already bookmarked
  if (!isBookmarked(therapist.id)) {
    toggleBookmark(therapist)
  }
  
  // Switch to contact protocol tab
  activeTab.value = 'kontaktprotokoll'
  
  // Wait for tab to switch, then open modal
  nextTick(() => {
    openContactModal(therapist)
  })
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
    
    // Check if it's a custom waiting time (not in predefined options or primary option)
    const allPredefinedOptions = [...waitingTimeOptions, primaryWaitingOption]
    if (attempt.waitingTime && !allPredefinedOptions.includes(attempt.waitingTime)) {
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
const showAllCompleted = ref(true) // Auto-expand on page load

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

// Edit completed therapist (opens contact modal with latest attempt)
const editCompletedTherapist = (therapist: TherapistData) => {
  const attempts = getContactAttempts(therapist.id)
  if (attempts.length > 0) {
    const latestAttempt = attempts[attempts.length - 1]
    editContactAttempt(latestAttempt.id)
  }
}

// Check if therapist is included in PDF export
const isTherapistIncludedInPdf = (therapistId: string) => {
  const attempts = getContactAttempts(therapistId)
  return attempts.some(attempt => qualifiesForPdf(attempt))
}

// Call therapist function
const callTherapist = (phoneNumber: string) => {
  if (process.client) {
    window.location.href = `tel:${phoneNumber}`
  }
}

// Confirm bookmark removal
const confirmRemoveBookmark = (therapist: TherapistData) => {
  if (process.client) {
    const confirmed = confirm(`Möchtest du ${therapist.name} wirklich aus deinen gespeicherten Therapeuten entfernen?`)
    if (confirmed) {
      toggleBookmark(therapist)
    }
  }
}

// Get completed and incomplete therapists separately
const incompleteTherapists = computed(() => {
  return sortedBookmarkedTherapists.value.filter(t => !isTherapistCompleted(t.id))
})

const completedTherapists = computed(() => {
  return sortedBookmarkedTherapists.value
    .filter(t => isTherapistCompleted(t.id))
    .sort((a, b) => {
      // Sort by PDF inclusion first (Im PDF first)
      const aIncluded = isTherapistIncludedInPdf(a.id)
      const bIncluded = isTherapistIncludedInPdf(b.id)
      
      if (aIncluded && !bIncluded) return -1
      if (!aIncluded && bIncluded) return 1
      
      return 0
    })
})

// Display therapists - incomplete ones in main section, completed ones only in completed section
const displayedTherapists = computed(() => {
  return incompleteTherapists.value
})

// Use shared PDF generator
const { previewPdf: previewPdfUtil, exportPdf: exportPdfUtil } = usePdfGenerator()

// Convert contact attempts to PDF format
const getPdfContactAttempts = () => {
  return qualifyingContactAttempts.value.map(attempt => {
    // Find the therapist info for bookmarked therapists
    const therapist = bookmarkedTherapists.value.find(t => t.id === attempt.therapistId) || {
      name: attempt.therapistName,
      address: attempt.therapistAddress
    }
    
    const therapistName = therapist.name || 'Unbekannt'
    const therapistLocation = therapist.address || attempt.therapistAddress || ''
    const contactDate = formatDate(attempt.contactDate)
    const contactTime = attempt.contactTime || ''
    
    let waitingInfo = ''
    if (attempt.replyReceived) {
      waitingInfo = attempt.waitingTime || 'Rückmeldung erhalten'
    } else {
      waitingInfo = 'Aktuell keine Behandlungsplätze verfügbar*'
    }
    
    return {
      name: therapistName,
      address: therapistLocation,
      date: contactDate,
      time: contactTime,
      waitingTime: waitingInfo
    }
  }).sort((a, b) => new Date(a.date.split('.').reverse().join('-')) - new Date(b.date.split('.').reverse().join('-')))
}

const exportToPdf = async () => {
  if (process.client) {
    try {
      await exportPdfUtil(getPdfContactAttempts(), userPlz.value)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Fehler beim Erstellen des PDFs. Bitte versuche es erneut.')
    }
  }
}

const previewPdf = async () => {
  if (process.client) {
    try {
      await previewPdfUtil(getPdfContactAttempts(), userPlz.value)
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

// Problem options for search filters (Worum geht es?)
const searchProblemOptions = [
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
    filters.value.billing !== 'Gesetzliche Krankenversicherung',
    filters.value.freePlaces !== 'Egal',
    filters.value.specialization !== ''
  ].filter(Boolean).length
})

// Open therapist profile in new tab
const openTherapistProfile = (profileUrl: string) => {
  window.open(profileUrl, '_blank', 'noopener,noreferrer')
}
</script>