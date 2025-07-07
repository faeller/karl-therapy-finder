export const useNavigation = () => {
  // Global state for current active navigation item
  const currentNavItem = useState<'landing' | 'profile' | 'home' | 'therapists' | 'kontaktprotokoll'>('nav.currentItem', () => 'landing')
  
  // Helper to set navigation based on route path
  const setNavFromPath = (path: string) => {
    if (path === '/') {
      currentNavItem.value = 'landing'
    } else if (path === '/onboarding') {
      currentNavItem.value = 'profile'
    } else if (path === '/app') {
      currentNavItem.value = 'home'
    } else if (path === '/therapists/contact-protocol') {
      currentNavItem.value = 'kontaktprotokoll'
    } else if (path.startsWith('/therapists')) {
      currentNavItem.value = 'therapists'
    } else {
      // Default fallback
      currentNavItem.value = 'landing'
    }
  }
  
  // Helper to set navigation directly (for tab switching)
  const setNavItem = (item: typeof currentNavItem.value) => {
    currentNavItem.value = item
  }
  
  return {
    currentNavItem: readonly(currentNavItem),
    setNavFromPath,
    setNavItem
  }
}