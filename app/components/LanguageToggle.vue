<template>
  <div class="flex gap-3 mb-8 justify-center">
    <button 
      @click="setLanguage('de')"
      :class="[
        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
        currentLanguage === 'de' 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
      ]"
    >
      Deutsch
    </button>
    <button 
      @click="setLanguage('en')"
      :class="[
        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
        currentLanguage === 'en' 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
      ]"
    >
      English
    </button>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const currentLanguage = computed(() => {
  return route.query.lang === 'en' ? 'en' : 'de'
})

const setLanguage = (lang) => {
  if (lang === 'en') {
    router.push({ path: route.path, query: { ...route.query, lang: 'en' } })
  } else {
    // Remove the lang query parameter for German (default)
    const query = { ...route.query }
    delete query.lang
    router.push({ path: route.path, query })
  }
}
</script>