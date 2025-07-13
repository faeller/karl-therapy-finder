export const useFunding = () => {
  // Fetch funding status (cached across components)
  const { data: fundingData, pending, error, refresh } = useFetch('/api/funding/status', {
    key: 'funding-status',
    server: true
  })

  // Computed status for easy access
  const isCovered = computed(() => fundingData.value?.funding?.isCovered ?? false)
  const deficit = computed(() => fundingData.value?.funding?.deficit ?? 0)
  const totalCosts = computed(() => fundingData.value?.funding?.required ?? 0)
  const received = computed(() => fundingData.value?.funding?.received ?? 0)
  
  // Status text for badge
  const statusText = computed(() => {
    if (pending.value) return 'Laden...'
    if (error.value) return 'Fehler'
    return isCovered.value ? 'Kosten gedeckt' : 'Kosten nicht gedeckt'
  })

  // Badge color based on status
  const badgeColor = computed(() => {
    if (pending.value || error.value) return 'gray'
    return isCovered.value ? 'green' : 'orange'
  })

  // Badge variant
  const badgeVariant = computed(() => {
    return isCovered.value ? 'solid' : 'soft'
  })

  return {
    // Data
    fundingData,
    pending,
    error,
    
    // Computed status
    isCovered,
    deficit,
    totalCosts,
    received,
    statusText,
    badgeColor,
    badgeVariant,
    
    // Actions
    refresh
  }
}