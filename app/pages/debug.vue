<template>
  <PageCard>
    <div class="relative z-10 flex w-full max-w-4xl flex-col items-center gap-6 px-4 sm:px-6">
      <!-- Debug Header -->
      <div class="w-full text-center space-y-3">
        <div class="flex h-16 w-16 items-center justify-center mx-auto rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-400/80 to-purple-600/80 text-2xl font-bold text-white shadow-2xl backdrop-blur-sm">
          🐛
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Debug & Testing
        </h1>
        <p class="text-sm text-purple-100/80">
          Development tools and testing utilities
        </p>
      </div>

      <!-- Debug Tools -->
      <div class="w-full space-y-6">
        
        <!-- PDF Testing Section -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-purple-300 text-base">PDF Testing</h3>
            <UBadge color="purple" variant="soft">Test Tools</UBadge>
          </div>
          <p class="text-purple-100/80 text-sm mb-4">
            Test PDF generation with various edge cases and long content
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              @click="generateLongNamesPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
              Generate Long Names PDF
            </button>
            
            <button 
              @click="generateEmptyPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-document" class="w-4 h-4" />
              Generate Empty PDF
            </button>
            
            <button 
              @click="generateMaxLengthPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
              Generate Maximum Length PDF
            </button>
            
            <button 
              @click="generateSpecialCharsPdf"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              <UIcon name="i-heroicons-language" class="w-4 h-4" />
              Generate Special Characters PDF
            </button>
          </div>
        </div>

        <!-- LocalStorage Debug -->
        <div class="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-green-300 text-base">LocalStorage Debug</h3>
            <div class="flex gap-2">
              <UBadge color="green" variant="soft">{{ Object.keys(storageData).length }} Keys</UBadge>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button 
              @click="loadStorageData"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all text-sm"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
              Refresh Data
            </button>
            
            <button 
              @click="clearAllStorage"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              Clear All
            </button>
            
            <button 
              @click="exportStorageData"
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
              Export Data
            </button>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div v-for="(value, key) in storageData" :key="key" class="p-3 rounded-lg bg-white/5 border border-white/10">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-white text-sm">{{ key }}</h4>
                <UBadge color="gray" size="xs">{{ getDataSize(value) }}</UBadge>
              </div>
              <pre class="text-xs text-green-300 bg-black/20 p-2 rounded overflow-x-auto">{{ formatStorageValue(value) }}</pre>
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <button 
          @click="$router.push('/therapists')" 
          class="group relative overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-white text-sm font-medium transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95"
        >
          <div class="relative z-10 flex items-center gap-2">
            <span class="group-hover:-translate-x-1 transition-transform duration-300">←</span>
            Back to Therapeuten
          </div>
          <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
// Meta configuration
definePageMeta({
  title: 'Debug & Testing'
})

// Storage data for debugging
const storageData = ref<Record<string, any>>({})

// Load localStorage data
const loadStorageData = () => {
  if (process.client) {
    const data: Record<string, any> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const value = localStorage.getItem(key)
          data[key] = value ? JSON.parse(value) : value
        } catch {
          data[key] = localStorage.getItem(key)
        }
      }
    }
    storageData.value = data
  }
}

// Clear all localStorage
const clearAllStorage = () => {
  if (process.client) {
    if (confirm('Are you sure you want to clear all localStorage data? This cannot be undone.')) {
      localStorage.clear()
      loadStorageData()
    }
  }
}

// Export storage data
const exportStorageData = () => {
  if (process.client) {
    const dataStr = JSON.stringify(storageData.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `karl-storage-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Format storage value for display
const formatStorageValue = (value: any): string => {
  if (typeof value === 'string') {
    return value.length > 200 ? value.substring(0, 200) + '...' : value
  }
  return JSON.stringify(value, null, 2).length > 400 
    ? JSON.stringify(value, null, 2).substring(0, 400) + '...'
    : JSON.stringify(value, null, 2)
}

// Get data size
const getDataSize = (value: any): string => {
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// Use shared PDF generator
const { previewPdf } = usePdfGenerator()

const generateLongNamesPdf = async () => {
  const testData = [
    {
      name: 'Dr. med. Maximilian Alexander von Hohenzollern-Sigmaringen',
      address: 'Psychiatrische Praxis für Psychoanalytische und Tiefenpsychologische Therapie, Maximilianstraße 123, 80539 München',
      date: '15.12.2024',
      time: '14:30',
      waitingTime: 'Ausführliche Erklärung der aktuellen Wartelistensituation: Aufgrund der hohen Nachfrage nach psychotherapeutischen Behandlungsplätzen und der begrenzten Kapazitäten sind derzeit keine freien Termine verfügbar'
    },
    {
      name: 'Prof. Dr. phil. Maria-Elisabeth Konstantinopolitanska-Schmidt',
      address: 'Zentrum für Verhaltenstherapie und Traumabehandlung',
      date: '16.12.2024',
      time: '09:15',
      waitingTime: 'Über 12 Monate Wartezeit'
    }
  ]
  await previewPdf(testData)
}

const generateEmptyPdf = async () => {
  await previewPdf([])
}

const generateMaxLengthPdf = async () => {
  const testData = Array.from({ length: 50 }, (_, i) => ({
    name: `Dr. Therapeut ${i + 1}`,
    address: `Praxis für Psychotherapie, Teststraße ${i + 1}, 12345 Berlin`,
    date: new Date(2024, 11, i % 30 + 1).toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    time: `${(9 + (i % 8)).toString().padStart(2, '0')}:${((i % 4) * 15).toString().padStart(2, '0')}`,
    waitingTime: i % 3 === 0 ? 'Über 6 Monate' : i % 3 === 1 ? 'Aktuell keine Behandlungsplätze verfügbar' : 'Über 3 Monate'
  }))
  await previewPdf(testData)
}

const generateSpecialCharsPdf = async () => {
  const testData = [
    {
      name: 'Dr. Müller-Weiß',
      address: 'Praxis für Ängste & Depressionen, Äußere Straße 1, 12345 Köln',
      date: '15.12.2024',
      time: '14:00',
      waitingTime: 'Längere Wartezeit wegen Überbelastung § 13 Abs. 3'
    },
    {
      name: 'José María González-Pérez',
      address: 'Terapía Española, Cañón del Río 23, 28001 Madrid',
      date: '16.12.2024',
      time: '15:30',
      waitingTime: 'Más de 6 meses de espera (>6 Monate)'
    },
    {
      name: 'Dr. François Lefèvre',
      address: 'Thérapie Française, Rue de l\'Église 45, 75001 Paris',
      date: '17.12.2024',
      time: '10:00',
      waitingTime: 'Délai d\'attente supérieur à 3 mois'
    }
  ]
  await previewPdf(testData)
}

// Initialize on mount
onMounted(() => {
  loadStorageData()
})
</script>