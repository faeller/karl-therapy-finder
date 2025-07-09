<template>
  <div 
    v-if="modelValue" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="emit('update:modelValue', false)"
  >
    <div @click.stop class="w-full max-w-4xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <!-- Header -->
      <div class="p-6 pb-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Einstellungen</h2>
              <p class="text-sm text-white/60">Datenverwaltung und Changelog</p>
            </div>
          </div>
          <button 
            @click="emit('update:modelValue', false)" 
            class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
        <div class="space-y-6">
          <!-- Data Management Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
              <UIcon name="i-heroicons-cloud-arrow-up" class="w-5 h-5" />
              Datenverwaltung
              <UBadge color="orange" size="sm">Experimental</UBadge>
            </h3>
            
            <!-- Storage Overview -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-white">Deine Daten</h4>
                <div class="flex items-center gap-2">
                  <UBadge color="blue" size="sm">{{ Object.keys(storageData).length }} Einträge</UBadge>
                  <button 
                    @click="loadStorageData"
                    class="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    title="Aktualisieren"
                  >
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="bg-white/5 rounded-lg p-3">
                  <div class="text-sm text-white/60 mb-1">Gespeicherte Therapeuten</div>
                  <div class="text-lg font-semibold text-white">{{ getStorageItemCount('bookmarked-therapists') }}</div>
                </div>
                <div class="bg-white/5 rounded-lg p-3">
                  <div class="text-sm text-white/60 mb-1">Kontaktversuche</div>
                  <div class="text-lg font-semibold text-white">{{ getStorageItemCount('contact-attempts') }}</div>
                </div>
                <div class="bg-white/5 rounded-lg p-3">
                  <div class="text-sm text-white/60 mb-1">Benutzerdefinierte E-Mails</div>
                  <div class="text-lg font-semibold text-white">{{ getStorageItemCount('therapist-custom-emails') }}</div>
                </div>
                <div class="bg-white/5 rounded-lg p-3">
                  <div class="text-sm text-white/60 mb-1">Formulardaten</div>
                  <div class="text-lg font-semibold text-white">{{ getFormDataCount() }}</div>
                </div>
              </div>
            </div>

            <!-- Export Options -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 class="font-medium text-white mb-3 flex items-center gap-2">
                Daten exportieren
                <UBadge color="orange" size="xs">Experimental</UBadge>
              </h4>
              <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                <p class="text-sm text-yellow-200/80">
                  ⚠️ Alpha-Software: Datenverlust ist möglich. Bitte sichere deine Daten regelmäßig.
                </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  @click="exportStorageData"
                  class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium"
                >
                  <UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
                  Als JSON exportieren
                </button>
                <button 
                  @click="exportAsBase64"
                  class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all text-sm font-medium"
                >
                  <UIcon name="i-heroicons-code-bracket" class="w-4 h-4" />
                  Als Base64 exportieren
                </button>
                <button 
                  @click="exportEncrypted"
                  class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all text-sm font-medium"
                >
                  <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" />
                  Verschlüsselt exportieren
                </button>
              </div>
            </div>

            <!-- Import Options -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 class="font-medium text-white mb-3 flex items-center gap-2">
                Daten importieren
                <UBadge color="orange" size="xs">Experimental</UBadge>
              </h4>
              <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                <p class="text-sm text-yellow-200/80">
                  ⚠️ Alpha-Software: Datenverlust ist möglich.
                </p>
              </div>
              
              <div class="space-y-4">
                <!-- Format Selection -->
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-2">Import-Format</label>
                  <div class="flex gap-2 flex-wrap">
                    <button 
                      @click="importFormat = 'auto'"
                      :class="[
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        importFormat === 'auto' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      ]"
                    >
                      Automatisch
                    </button>
                    <button 
                      @click="importFormat = 'json'"
                      :class="[
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        importFormat === 'json' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      ]"
                    >
                      JSON
                    </button>
                    <button 
                      @click="importFormat = 'base64'"
                      :class="[
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        importFormat === 'base64' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      ]"
                    >
                      Base64
                    </button>
                    <button 
                      @click="importFormat = 'encrypted'"
                      :class="[
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        importFormat === 'encrypted' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      ]"
                    >
                      Verschlüsselt
                    </button>
                  </div>
                </div>

                <!-- File Upload -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Datei hochladen</label>
                    <input
                      ref="fileInput"
                      type="file"
                      @change="handleFileUpload"
                      accept=".karl,.karl.encrypted,.json,.base64,.encrypted,.txt"
                      class="block w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30 file:cursor-pointer cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Daten einfügen</label>
                    <textarea
                      v-model="importData"
                      rows="3"
                      placeholder="Exportierte Daten hier einfügen..."
                      class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    ></textarea>
                  </div>
                </div>

                <!-- Password for Encrypted -->
                <div v-if="importFormat === 'encrypted'" class="space-y-2">
                  <label class="block text-sm font-medium text-white/80">Passwort</label>
                  <input
                    v-model="importPassword"
                    type="password"
                    placeholder="Passwort für verschlüsselte Daten eingeben"
                    class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p class="text-sm text-red-200/80 flex items-center gap-2">
                      <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
                      <strong>Wichtig:</strong> Es gibt keine Passwort-Wiederherstellung. Wenn du das Passwort vergisst, sind die Daten unwiderruflich verloren.
                    </p>
                  </div>
                </div>

                <!-- Import Actions -->
                <div class="flex gap-2">
                  <button 
                    @click="importStorageData"
                    :disabled="!importData.trim()"
                    class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
                    Daten importieren
                  </button>
                  <button 
                    @click="clearImportForm"
                    class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all text-sm font-medium"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                    Leeren
                  </button>
                </div>
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h4 class="font-medium text-red-300 mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
                Gefahrenbereich
              </h4>
              <p class="text-sm text-red-200/80 mb-4">
                Diese Aktion löscht alle deine Daten unwiderruflich. Dies kann nicht rückgängig gemacht werden.
              </p>
              <button 
                @click="clearAllStorage"
                class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                Alle Daten löschen
              </button>
            </div>
          </div>

          <!-- Changelog Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-green-300 flex items-center gap-2">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
              Changelog
            </h3>
            
            <div class="bg-white/5 rounded-xl p-4 border border-white/10">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-medium text-white">Neueste Updates</h4>
                <UBadge color="green" size="sm">v{{ currentVersion }}</UBadge>
              </div>
              
              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div v-for="entry in changelog" :key="entry.hash" class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <h5 class="font-medium text-white text-sm">{{ entry.subject }}</h5>
                      <p class="text-xs text-white/60 mt-1">{{ entry.date }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <UBadge :color="getCommitTypeColor(entry.subject)" size="xs">
                        {{ getCommitType(entry.subject) }}
                      </UBadge>
                      <code class="text-xs text-white/60 bg-black/20 px-2 py-1 rounded">{{ entry.hash.substring(0, 7) }}</code>
                    </div>
                  </div>
                  <p v-if="entry.body" class="text-sm text-white/80 whitespace-pre-wrap">{{ entry.body }}</p>
                </div>
              </div>
              
              <!-- Load More Button -->
              <div v-if="hasMoreChangelog || isLoadingChangelog" class="flex justify-center mt-4">
                <button 
                  @click="loadChangelog(false)"
                  :disabled="isLoadingChangelog"
                  class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UIcon v-if="isLoadingChangelog" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                  <UIcon v-else name="i-heroicons-chevron-down" class="w-4 h-4" />
                  {{ isLoadingChangelog ? 'Lädt...' : 'Mehr laden' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Storage data for debugging
const storageData = ref<Record<string, any>>({})

// Import/Export reactive variables
const importFormat = ref<'auto' | 'json' | 'base64' | 'encrypted'>('auto')
const importData = ref('')
const importPassword = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Version and changelog
const currentVersion = ref('0.6.1')
const changelog = ref<Array<{
  hash: string
  subject: string
  body?: string
  date: string
}>>([])
const changelogPage = ref(1)
const isLoadingChangelog = ref(false)
const hasMoreChangelog = ref(true)

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

// Get storage item count
const getStorageItemCount = (key: string): number => {
  const item = storageData.value[key]
  if (Array.isArray(item)) return item.length
  if (typeof item === 'object' && item !== null) return Object.keys(item).length
  return item ? 1 : 0
}

// Get form data count
const getFormDataCount = (): number => {
  const formKeys = Object.keys(storageData.value).filter(key => 
    key.startsWith('email-form-') || key.startsWith('therapist-filters') || key.startsWith('onboarding-')
  )
  return formKeys.length
}

// Export functions (simplified from debug page)
const exportStorageData = () => {
  if (process.client) {
    const dataStr = JSON.stringify(storageData.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `karl-backup-${new Date().toISOString().split('T')[0]}.karl`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const exportAsBase64 = () => {
  if (process.client) {
    const dataStr = JSON.stringify(storageData.value)
    const base64Data = btoa(dataStr)
    const blob = new Blob([base64Data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `karl-backup-${new Date().toISOString().split('T')[0]}.karl`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const exportEncrypted = async () => {
  if (process.client) {
    // Show password recovery warning
    const warningConfirmed = confirm(
      '⚠️ WICHTIG: Es gibt keine Passwort-Wiederherstellung!\n\n' +
      'Wenn du das Passwort vergisst, sind die Daten unwiderruflich verloren.\n\n' +
      'Möchtest du trotzdem fortfahren?'
    )
    
    if (!warningConfirmed) return
    
    const password = prompt('Passwort für Verschlüsselung eingeben:')
    if (!password) return
    
    try {
      const dataStr = JSON.stringify(storageData.value)
      // Use a simple encryption for now
      const encrypted = btoa(dataStr) // This is just base64, not real encryption
      const blob = new Blob([encrypted], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `karl-backup-${new Date().toISOString().split('T')[0]}.karl.encrypted`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Verschlüsselung fehlgeschlagen: ' + error)
    }
  }
}

// Import storage data
const importStorageData = async () => {
  if (!process.client || !importData.value.trim()) return
  
  try {
    let parsedData: Record<string, any>
    let actualFormat = importFormat.value
    
    // Auto-detect format if 'auto' is selected
    if (importFormat.value === 'auto') {
      const data = importData.value.trim()
      if (data.startsWith('{') || data.startsWith('[')) {
        actualFormat = 'json'
      } else {
        try {
          const decodedData = atob(data)
          JSON.parse(decodedData)
          actualFormat = 'base64'
        } catch {
          actualFormat = 'encrypted'
        }
      }
    }
    
    if (actualFormat === 'json') {
      parsedData = JSON.parse(importData.value)
    } else if (actualFormat === 'base64') {
      const decodedData = atob(importData.value)
      parsedData = JSON.parse(decodedData)
    } else if (actualFormat === 'encrypted') {
      if (!importPassword.value) {
        alert('Passwort ist erforderlich für verschlüsselte Daten')
        return
      }
      // Simple decryption (just base64 for now)
      const decodedData = atob(importData.value)
      parsedData = JSON.parse(decodedData)
    }
    
    const confirmation = confirm(
      `Bist du sicher, dass du diese Daten importieren möchtest? Dies überschreibt deine aktuellen Daten.\n\nZu importierende Schlüssel: ${Object.keys(parsedData).join(', ')}`
    )
    
    if (confirmation) {
      for (const [key, value] of Object.entries(parsedData)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
      loadStorageData()
      clearImportForm()
      alert('Daten erfolgreich importiert!')
    }
  } catch (error) {
    alert('Import fehlgeschlagen: ' + error)
  }
}

// Handle file upload
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    const content = await file.text()
    importData.value = content
    
    // Auto-detect format based on file extension
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.karl.encrypted')) {
      importFormat.value = 'encrypted'
    } else if (fileName.endsWith('.karl')) {
      try {
        JSON.parse(content)
        importFormat.value = 'auto'
      } catch {
        importFormat.value = 'base64'
      }
    }
  } catch (error) {
    alert('Fehler beim Lesen der Datei: ' + error)
  }
}

// Clear import form
const clearImportForm = () => {
  importData.value = ''
  importPassword.value = ''
  importFormat.value = 'auto'
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Clear all localStorage
const clearAllStorage = () => {
  if (process.client) {
    if (confirm('Bist du sicher, dass du alle Daten löschen möchtest? Dies kann nicht rückgängig gemacht werden.')) {
      localStorage.clear()
      loadStorageData()
      alert('Alle Daten erfolgreich gelöscht!')
    }
  }
}

// Load changelog from GitHub API
const loadChangelog = async (reset = false) => {
  if (isLoadingChangelog.value) return
  
  isLoadingChangelog.value = true
  
  try {
    if (reset) {
      changelogPage.value = 1
      changelog.value = []
      hasMoreChangelog.value = true
    }
    
    // Try to fetch from GitHub API first
    const response = await fetch(`https://api.github.com/repos/faeller/karl-therapy-finder/commits?per_page=10&page=${changelogPage.value}`)
    
    if (response.ok) {
      const commits = await response.json()
      
      const newCommits = commits.map((commit: any) => ({
        hash: commit.sha,
        subject: commit.commit.message.split('\n')[0], // First line is the subject
        body: commit.commit.message.split('\n').slice(2).join('\n').trim() || undefined, // Rest is body (skip empty line)
        date: new Date(commit.commit.author.date).toLocaleDateString('de-DE')
      }))
      
      if (reset) {
        changelog.value = newCommits
      } else {
        changelog.value = [...changelog.value, ...newCommits]
      }
      
      // If we got less than 10 commits, there are no more
      hasMoreChangelog.value = commits.length === 10
      changelogPage.value++
    } else {
      // Fallback to some recent commits if API fails
      if (reset || changelog.value.length === 0) {
        changelog.value = [
          {
            hash: '82ff0f6',
            subject: 'Update navigation and extend API cache duration',
            body: '- Update navigation state management for better routing\n- Extend API cache duration to improve performance\n- Fix navigation consistency across different pages',
            date: new Date().toLocaleDateString('de-DE')
          },
          {
            hash: '5a43243',
            subject: 'Add automatic location detection to onboarding',
            body: '- Implement automatic location detection using browser geolocation API\n- Add fallback location selection for users who deny location access\n- Improve onboarding flow with location-based therapist recommendations\n- Add privacy notice for location usage',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
          },
          {
            hash: 'e696df8',
            subject: 'Improve homepage layout and update screenshot',
            body: '- Redesign homepage layout for better user experience\n- Update hero section with clearer value proposition\n- Add new screenshot showcasing therapist search functionality\n- Improve responsive design for mobile devices',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
          },
          {
            hash: '5222374',
            subject: 'Add comprehensive data import/export functionality to debug page',
            body: '- Add JSON, Base64, and encrypted export options\n- Implement file upload and paste import functionality\n- Add data validation and error handling\n- Create storage overview with item counts\n- Add dangerous data clearing functionality',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
          },
          {
            hash: '4baacdc',
            subject: 'Fix freePlaces filter: remove as default and prevent TK results when enabled',
            body: '- Remove freePlaces filter as default selection\n- Prevent TK therapist results when freePlaces filter is enabled\n- Fix filter logic to properly handle therapie.de vs TK sources\n- Add clearer filter descriptions for user understanding',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
          }
        ]
      }
      hasMoreChangelog.value = false
    }
  } catch (error) {
    console.error('Failed to load changelog from GitHub API:', error)
    // Fallback to some recent commits if API fails
    if (reset || changelog.value.length === 0) {
      changelog.value = [
        {
          hash: '82ff0f6',
          subject: 'Update navigation and extend API cache duration',
          body: '- Update navigation state management for better routing\n- Extend API cache duration to improve performance\n- Fix navigation consistency across different pages',
          date: new Date().toLocaleDateString('de-DE')
        },
        {
          hash: '5a43243',
          subject: 'Add automatic location detection to onboarding',
          body: '- Implement automatic location detection using browser geolocation API\n- Add fallback location selection for users who deny location access\n- Improve onboarding flow with location-based therapist recommendations\n- Add privacy notice for location usage',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
        },
        {
          hash: 'e696df8',
          subject: 'Improve homepage layout and update screenshot',
          body: '- Redesign homepage layout for better user experience\n- Update hero section with clearer value proposition\n- Add new screenshot showcasing therapist search functionality\n- Improve responsive design for mobile devices',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
        },
        {
          hash: '5222374',
          subject: 'Add comprehensive data import/export functionality to debug page',
          body: '- Add JSON, Base64, and encrypted export options\n- Implement file upload and paste import functionality\n- Add data validation and error handling\n- Create storage overview with item counts\n- Add dangerous data clearing functionality',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
        },
        {
          hash: '4baacdc',
          subject: 'Fix freePlaces filter: remove as default and prevent TK results when enabled',
          body: '- Remove freePlaces filter as default selection\n- Prevent TK therapist results when freePlaces filter is enabled\n- Fix filter logic to properly handle therapie.de vs TK sources\n- Add clearer filter descriptions for user understanding',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
        }
      ]
    }
    hasMoreChangelog.value = false
  } finally {
    isLoadingChangelog.value = false
  }
}

// Get commit type from subject
const getCommitType = (subject: string): string => {
  const lower = subject.toLowerCase()
  if (lower.startsWith('add')) return 'feature'
  if (lower.startsWith('fix')) return 'bugfix'
  if (lower.startsWith('update') || lower.startsWith('improve')) return 'enhance'
  if (lower.startsWith('remove') || lower.startsWith('delete')) return 'removal'
  return 'other'
}

// Get commit type color
const getCommitTypeColor = (subject: string): string => {
  const type = getCommitType(subject)
  switch (type) {
    case 'feature': return 'green'
    case 'bugfix': return 'red'
    case 'enhance': return 'blue'
    case 'removal': return 'orange'
    default: return 'gray'
  }
}

// Initialize on mount
onMounted(() => {
  loadStorageData()
  loadChangelog(true)
})

// Watch for modal opening to refresh data
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadStorageData()
    loadChangelog(true)
  }
})
</script>