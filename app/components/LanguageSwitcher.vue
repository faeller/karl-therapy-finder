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
  return locales.value.map(loc => ({
    label: `${languageConfig[loc.code]?.flag || '🌐'} ${languageConfig[loc.code]?.name || loc.name}`,
    click: () => switchLanguage(loc.code),
    disabled: loc.code === locale.value
  }))
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
    if (savedLanguage && savedLanguage !== locale.value && locales.value.some(l => l.code === savedLanguage)) {
      setLocale(savedLanguage)
    }
  }
})
</script>