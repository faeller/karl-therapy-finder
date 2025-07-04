<template>
  <div class="relative min-h-screen">
    <!-- Background with gradient -->
    <div class="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>
    
    <!-- Navigation Header -->
    <header class="relative z-50 sticky top-0 backdrop-blur-lg border-b border-white/10 bg-white/5 mb-6">
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
          <nav class="hidden md:flex items-center space-x-1">
            <UButton 
              to="/" 
              variant="ghost" 
              color="blue"
              size="sm"
              :class="$route.path === '/' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'"
            >
              <UIcon name="i-heroicons-home" class="w-4 h-4 mr-2" />
              Startseite
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
              Home
            </UButton>
            
            <UButton 
              to="/therapists" 
              variant="ghost" 
              color="blue"
              size="sm"
              :class="$route.path === '/therapists' ? 'bg-blue-500/20 text-blue-200' : 'text-blue-100/80 hover:text-blue-200 hover:bg-white/10'"
            >
              <UIcon name="i-heroicons-user-group" class="w-4 h-4 mr-2" />
              Therapeuten
            </UButton>
          </nav>

          <!-- Right Side Actions -->
          <div class="hidden md:flex items-center gap-2">            
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
          </div>

          <!-- Mobile Navigation -->
          <div class="md:hidden">
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
  </div>
</template>

<script setup>
const route = useRoute()
const { locale, locales, setLocale } = useI18n()

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
  const baseItems = [{
    label: 'Startseite',
    icon: 'i-heroicons-home',
    to: '/'
  }, {
    label: 'Profil',
    icon: 'i-heroicons-user-circle',
    to: '/onboarding'
  }, {
    label: 'Home',
    icon: 'i-heroicons-map',
    to: '/app'
  }, {
    label: 'Therapeuten',
    icon: 'i-heroicons-user-group',
    to: '/therapists'
  }]

  const githubItem = {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/faeller/karl-therapy-finder',
    target: '_blank'
  }

  return [...baseItems, githubItem]
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
