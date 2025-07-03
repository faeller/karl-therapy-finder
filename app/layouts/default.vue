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
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-400/80 to-blue-600/80 text-lg font-bold text-white shadow-lg backdrop-blur-sm transition-all group-hover:scale-105">
              K
            </div>
            <div class="hidden sm:block">
              <div class="text-lg font-bold text-white">KARL</div>
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

// Mobile menu items
const mobileMenuItems = [{
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
