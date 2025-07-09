export const useDebugMode = () => {
  const debugMode = ref(false)

  // Load debug mode from localStorage
  const loadDebugMode = () => {
    if (process.client) {
      const saved = localStorage.getItem('debug-mode')
      debugMode.value = saved === 'true'
    }
  }

  // Toggle debug mode
  const toggleDebugMode = (value: boolean) => {
    debugMode.value = value
    if (process.client) {
      localStorage.setItem('debug-mode', value.toString())
    }
  }

  // Initialize on client
  onMounted(() => {
    loadDebugMode()
  })

  return {
    debugMode: readonly(debugMode),
    toggleDebugMode,
    loadDebugMode
  }
}