<template>
  <UDropdownMenu :items="languageItems" :content="{ align: 'end' }">
    <UButton 
      variant="ghost" 
      color="blue" 
      size="sm" 
      class="text-blue-100/80 hover:text-blue-200 hover:bg-white/10"
    >
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ currentLocaleFlag }}</span>
        <span class="hidden sm:inline">{{ currentLocaleName }}</span>
        <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
      </div>
    </UButton>
  </UDropdownMenu>
</template>

<script setup>
const { locale, locales, setLocale } = useI18n()

// Language configuration
const languageConfig = {
  de: { name: 'Deutsch', flag: '🇩🇪' },
  en: { name: 'English', flag: '🇬🇧' }
}

// Current locale info
const currentLocaleFlag = computed(() => languageConfig[locale.value]?.flag || '🌐')
const currentLocaleName = computed(() => languageConfig[locale.value]?.name || locale.value)

// Create dropdown items
const languageItems = computed(() => {
  return locales.value.map(loc => {
    // Handle both string and object formats
    const localeCode = typeof loc === 'string' ? loc : loc.code
    const localeName = typeof loc === 'string' ? languageConfig[loc]?.name : loc.name
    
    return {
      label: `${languageConfig[localeCode]?.flag || '🌐'} ${languageConfig[localeCode]?.name || localeName || localeCode}`,
      click: () => switchLanguage(localeCode),
      disabled: localeCode === locale.value
    }
  })
})

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
    
    // Show error toast
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to switch language',
      color: 'red',
      timeout: 3000
    })
  }
}

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