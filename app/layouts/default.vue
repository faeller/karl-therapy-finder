<template>
  <div class="relative min-h-screen">
    <!-- Background with gradient -->
    <div class="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>
    
    <!-- Navigation Header -->
    <header class="relative z-50 sticky top-0 backdrop-blur-lg border-b border-white/10 bg-white/5 mb-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo/Brand -->
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <div class="relative">
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-400/80 to-blue-600/80 text-lg font-bold text-white shadow-lg backdrop-blur-sm transition-all group-hover:scale-105">
                K
              </div>
              <!-- AI Badge -->
              <div class="absolute -bottom-1 -right-1 bg-black text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                AI
              </div>
            </div>
            <div class="hidden sm:block">
              <div class="flex items-center gap-2">
                <div class="text-lg font-bold text-white">KARL</div>
                <span class="bg-green-500/20 border border-green-500/30 text-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                  ALPHA
                </span>
              </div>
              <div class="text-xs text-blue-100/70 -mt-1">Therapy Finder</div>
            </div>
          </NuxtLink>

          <!-- Navigation Links -->
          <nav class="hidden lg:flex items-center space-x-1">
            <UButton 
              to="/" 
              variant="ghost" 
              color="blue"
              size="sm"
              :class="$route.path === '/' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'"
            >
              <UIcon name="i-heroicons-home" class="w-4 h-4 mr-2" />
              Start
            </UButton>
            
            <UButton 
              to="/onboarding" 
              variant="ghost" 
              color="blue"
              size="sm"
              :class="$route.path === '/onboarding' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'"
            >
              <UIcon name="i-heroicons-user-circle" class="w-4 h-4 mr-2" />
              Profil
            </UButton>
            
            <UButton 
              to="/app" 
              variant="ghost" 
              color="blue"
              size="sm"
              :class="$route.path === '/app' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'"
            >
              <UIcon name="i-heroicons-map" class="w-4 h-4 mr-2" />
              Guide
            </UButton>
            
            <UButton 
              @click="handleTherapistsNavClick"
              variant="ghost" 
              color="blue"
              size="sm"
              :class="currentNavItem === 'therapists' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'"
            >
              <UIcon name="i-heroicons-user-group" class="w-4 h-4 mr-2" />
              Therapeuten
            </UButton>
            
            <UButton 
              @click="handleKontaktprotokollNavClick"
              variant="ghost" 
              color="blue"
              size="sm"
              :class="currentNavItem === 'kontaktprotokoll' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'"
            >
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-2" />
              Kontaktprotokoll
            </UButton>
          </nav>

          <!-- Right Side Actions -->
          <div class="hidden lg:flex items-center gap-2">
            <!-- Funding Status Button (only show when Patreon is connected) -->
            <ClientOnly>
              <UButton 
                v-if="patreonConnected"
                to="/funding"
                variant="ghost" 
                :color="fundingIsCovered ? 'green' : 'orange'"
                size="sm"
                :class="[
                  $route.path === '/funding' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'
                ]"
                :title="`Klicken für Details - ${fundingStatusText}`"
              >
                <UIcon 
                  v-if="!fundingPending"
                  :name="fundingIsCovered ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-circle'"
                  class="w-5 h-5 mr-2" 
                />
                <UIcon 
                  v-else
                  name="i-heroicons-arrow-path"
                  class="w-5 h-5 mr-2 animate-spin" 
                />
                <span class="whitespace-nowrap">{{ fundingStatusText }}</span>
              </UButton>
            </ClientOnly>
            
            
            <!-- GitHub Link -->
            <UButton 
              to="https://github.com/faeller/karl-therapy-finder"
              target="_blank"
              variant="ghost" 
              color="blue"
              size="sm"
              class="text-blue-100/80 hover:text-blue-200 hover:bg-white/10"
            >
              <UIcon name="i-simple-icons-github" class="w-4 h-4" />
            </UButton>
            
            <!-- Patreon Link -->
            <UButton 
              to="https://www.patreon.com/karlhelps"
              target="_blank"
              variant="ghost" 
              color="blue"
              size="sm"
              class="text-blue-100/80 hover:text-blue-200 hover:bg-white/10"
            >
              <UIcon name="i-simple-icons-patreon" class="w-4 h-4" />
            </UButton>
            
            <!-- Settings -->
            <UButton 
              @click="showSettingsModal = true"
              variant="ghost" 
              color="blue"
              size="sm"
              class="text-blue-100/80 hover:text-blue-200 hover:bg-white/10"
            >
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Mobile Navigation -->
          <div class="lg:hidden flex items-center gap-2">
            <!-- Mobile Funding Button (only show when Patreon is connected) -->
            <ClientOnly>
              <UButton 
                v-if="patreonConnected"
                to="/funding"
                variant="ghost" 
                :color="fundingIsCovered ? 'green' : 'orange'"
                size="sm"
                :class="[
                  $route.path === '/funding' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'
                ]"
                :title="`Klicken für Details - ${fundingStatusText}`"
              >
                <UIcon 
                  v-if="!fundingPending"
                  :name="fundingIsCovered ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-circle'"
                  class="w-4 h-4" 
                />
                <UIcon 
                  v-else
                  name="i-heroicons-arrow-path"
                  class="w-4 h-4 animate-spin" 
                />
                <span class="text-xs font-medium hidden sm:inline ml-1">{{ fundingPending ? 'Laden...' : (fundingIsCovered ? 'Gedeckt' : 'Nicht gedeckt') }}</span>
              </UButton>
            </ClientOnly>
            
            
            <UDropdownMenu :items="mobileMenuItems" :content="{ align: 'end' }">
              <UButton variant="ghost" color="blue" size="sm">
                <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
              </UButton>
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <Container>
      <div class="fade-container">
        <slot />
      </div>
      <AppFooter />
    </Container>

    <!-- Settings Modal -->
    <SettingsModal v-model="showSettingsModal" />
  </div>
</template>

<script setup>
const route = useRoute()
const { locale, locales, setLocale } = useI18n()

// Use navigation state management
const { currentNavItem, setNavFromPath } = useNavigation()

// Settings modal state
const showSettingsModal = ref(false)

// Funding status for badge
const { 
  isCovered: fundingIsCovered, 
  statusText: fundingStatusText,
  badgeColor: fundingBadgeColor,
  badgeVariant: fundingBadgeVariant,
  pending: fundingPending
} = useFunding()

// Patreon connection status
const { isConnected: patreonConnected } = usePatreonStatus()

// Import SettingsModal component
import SettingsModal from '~/components/SettingsModal.vue'

// Handle navbar clicks for therapists page
const handleTherapistsNavClick = () => {
  // If we're on a therapists page, emit an event to switch tabs instead of navigating
  if (route.path.startsWith('/therapists')) {
    // Use a custom event to communicate with the therapists page
    if (process.client) {
      window.dispatchEvent(new CustomEvent('navbar-therapists-click'))
    }
  } else {
    // Normal navigation
    navigateTo('/therapists')
  }
}

const handleKontaktprotokollNavClick = () => {
  // If we're on a therapists page, emit an event to switch tabs instead of navigating
  if (route.path.startsWith('/therapists')) {
    // Use a custom event to communicate with the therapists page
    if (process.client) {
      window.dispatchEvent(new CustomEvent('navbar-kontaktprotokoll-click'))
    }
  } else {
    // Normal navigation
    navigateTo('/therapists/contact-protocol')
  }
}

// Initialize navigation state on first load
onMounted(() => {
  const currentPath = route.path
  // Set initial navigation state for all routes
  setNavFromPath(currentPath)
})

// Also set navigation state immediately for SSR consistency
setNavFromPath(route.path)

// Watch for route changes
// Only set navigation state for routes that don't manage their own navigation
watch(() => route.path, (newPath) => {
  // Don't override navigation state for therapists pages - they manage their own nav state
  if (!newPath.startsWith('/therapists')) {
    setNavFromPath(newPath)
  }
})

// Language configuration
const languageConfig = {
  de: { name: 'Deutsch', flag: '🇩🇪' },
  en: { name: 'English', flag: '🇬🇧' }
}

// Switch language function with persistence
const switchLanguage = async (newLocale) => {
  if (newLocale === locale.value) return
  
  try {
    // Set the locale
    await setLocale(newLocale)
    
    // Persist to localStorage
    if (process.client) {
      localStorage.setItem('karl-language', newLocale)
    }
    
    // Show success toast
    const toast = useToast()
    const langName = languageConfig[newLocale]?.name || newLocale
    toast.add({
      title: newLocale === 'de' ? 'Sprache geändert' : 'Language changed',
      description: newLocale === 'de' ? `Auf Deutsch umgestellt` : `Switched to ${langName}`,
      color: 'blue',
      timeout: 2000
    })
  } catch (error) {
    console.error('Failed to switch language:', error)
  }
}

// Mobile menu items (language switcher hidden)
const mobileMenuItems = computed(() => {
  const isOnTherapistsPage = route.path.startsWith('/therapists')
  
  const baseItems = [{
    label: 'Start',
    icon: 'i-heroicons-home',
    to: '/'
  }, {
    label: 'Profil',
    icon: 'i-heroicons-user-circle',
    to: '/onboarding'
  }, {
    label: 'Guide',
    icon: 'i-heroicons-map',
    to: '/app'
  }, {
    label: 'Therapeuten',
    icon: 'i-heroicons-user-group',
    ...(isOnTherapistsPage ? { onClick: handleTherapistsNavClick } : { to: '/therapists' })
  }, {
    label: 'Kontaktprotokoll',
    icon: 'i-heroicons-document-text',
    ...(isOnTherapistsPage ? { onClick: handleKontaktprotokollNavClick } : { to: '/therapists/contact-protocol' })
  }]

  const githubItem = {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/faeller/karl-therapy-finder',
    target: '_blank'
  }

  const settingsItem = {
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    onClick: () => showSettingsModal.value = true
  }

  const patreonItem = {
    label: 'Patreon',
    icon: 'i-simple-icons-patreon',
    to: 'https://www.patreon.com/karlhelps',
    target: '_blank'
  }

  const fundingItem = {
    label: 'Funding',
    icon: fundingIsCovered.value ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-circle',
    to: '/funding'
  }

  const items = [...baseItems, settingsItem, githubItem, patreonItem]
  
  // Only add funding item if Patreon is connected
  if (patreonConnected.value) {
    items.splice(-3, 0, fundingItem) // Insert before settings, github, patreon
  }

  return items
})


// Load persisted language on mount
onMounted(() => {
  if (process.client) {
    const savedLanguage = localStorage.getItem('karl-language')
    if (savedLanguage && savedLanguage !== locale.value) {
      // Check if saved language exists in available locales
      const hasLocale = locales.value.some(l => {
        const localeCode = typeof l === 'string' ? l : l.code
        return localeCode === savedLanguage
      })
      
      if (hasLocale) {
        setLocale(savedLanguage)
      }
    }
  }
})
</script>

<style lang="postcss">
.scrollable-card {
  scrollbar-width: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.button {
  box-shadow:
    inset 0.5px 0.5px 1px 0px rgba(255, 255, 255, 0.1),
    inset -0.5px -0.5px 1px 0px rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.2) 0px 3px 10px -5px;
  @apply flex items-center justify-center gap-2 rounded-full text-sm backdrop-blur-sm transition-all;
}
.button:active {
  @apply scale-95;
}

* {
  scrollbar-color: #555 rgba(0, 0, 0, 0);
}

/* Prevent unwanted text selection and cursor on container elements */
.bg-white\/5, .backdrop-blur-sm, [class*="bg-white/"], [class*="backdrop-blur"],
.rounded-lg, .rounded-xl, .rounded-full, .rounded-3xl,
.border, .border-white\/10, .border-blue-500\/20,
.flex.items-center, .flex.justify-between, .flex.gap-,
.space-y-, .space-x-, .grid, .w-full, .max-w-,
.p-4, .p-6, .px-, .py-, .pt-, .pb-, .pl-, .pr-,
.m-, .mt-, .mb-, .ml-, .mr-, .mx-, .my-,
.shadow, .shadow-xl, .shadow-2xl,
.transition-all, .duration-, .ease-,
.relative, .absolute, .fixed, .sticky {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: default;
}

/* Disable text selection on all text content as well */
p, span, h1, h2, h3, h4, h5, h6, li, a,
.text-, [class*="text-"],
.font-, [class*="font-"],
.selectable-text {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  cursor: default !important;
}

/* Ensure interactive elements have proper cursor */
button, .button, [role="button"], 
.cursor-pointer, [class*="hover:"],
input, textarea, select,
a, [role="link"] {
  cursor: pointer !important;
  user-select: none;
}

/* Special handling for progress bars and decorative elements */
.bg-gradient-to-r, .bg-gradient-to-l, .bg-gradient-to-t, .bg-gradient-to-b,
.animate-, [class*="animate-"],
.scale-, .rotate-, .translate-,
[class*="scale-"], [class*="rotate-"], [class*="translate-"] {
  user-select: none !important;
  cursor: default !important;
}
</style>
