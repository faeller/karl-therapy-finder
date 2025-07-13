export const usePatreonStatus = () => {
  // Fetch Patreon connection status (public check, no admin required)
  const { data: statusData, pending, error, refresh } = useFetch('/api/funding/status', {
    key: 'patreon-connection-status',
    server: true,
    transform: (data: any) => ({
      isConnected: !!data?.fundingEnabled,
      hasPatreonData: !!data?.patreon
    })
  })

  // Computed status for easy access
  const isConnected = computed(() => statusData.value?.isConnected ?? false)
  const hasPatreonData = computed(() => statusData.value?.hasPatreonData ?? false)

  return {
    // Data
    statusData,
    pending,
    error,
    
    // Computed status
    isConnected,
    hasPatreonData,
    
    // Actions
    refresh
  }
}