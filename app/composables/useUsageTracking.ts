interface UsageData {
  aiCalls: {
    used: number
    limit: number
    resetDate: string
  }
  emailSending: {
    used: number
    limit: number
    resetDate: string
    status: 'planned' | 'coming_soon' | 'active'
  }
  emailReceiving: {
    used: number
    limit: number
    resetDate: string
    status: 'planned' | 'coming_soon' | 'active'
  }
}

interface UsageHistoryEntry {
  id: string
  type: 'ai_call' | 'email_sent' | 'email_received'
  description: string
  date: Date
  status: 'success' | 'error' | 'pending'
  metadata?: Record<string, any>
}

export const useUsageTracking = () => {
  const patreonAuth = usePatreonOAuth()
  
  const usageData = ref<UsageData>({
    aiCalls: {
      used: 0,
      limit: 0,
      resetDate: getNextMonthFirstDay()
    },
    emailSending: {
      used: 0,
      limit: 0,
      resetDate: getNextMonthFirstDay(),
      status: 'planned'
    },
    emailReceiving: {
      used: 0,
      limit: 0,
      resetDate: getNextMonthFirstDay(),
      status: 'planned'
    }
  })

  const usageHistory = ref<UsageHistoryEntry[]>([])
  const isLoading = ref(false)
  const isHistoryLoading = ref(false)

  // Get next month's first day for reset date
  function getNextMonthFirstDay() {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return nextMonth.toISOString().split('T')[0]
  }

  // Calculate limits based on patron status
  const calculateLimits = () => {
    if (!patreonAuth.isPatron.value) {
      // Non-patrons get no AI calls or email features
      usageData.value.aiCalls.limit = 0
      usageData.value.emailSending.limit = 0
      usageData.value.emailReceiving.limit = 0
      return
    }

    // Get highest tier to determine limits
    const tier = patreonAuth.getHighestTier.value
    if (!tier) {
      usageData.value.aiCalls.limit = 0
      usageData.value.emailSending.limit = 0
      usageData.value.emailReceiving.limit = 0
      return
    }

    // Set limits based on tier amount (in cents)
    const amountInDollars = tier.amount_cents / 100
    
    if (amountInDollars >= 5) {
      // $5+ tier: 15 AI calls per month
      usageData.value.aiCalls.limit = 15
      usageData.value.emailSending.limit = 30
      usageData.value.emailReceiving.limit = 150
    } else if (amountInDollars >= 3) {
      // $3+ tier: 8 AI calls per month
      usageData.value.aiCalls.limit = 8
      usageData.value.emailSending.limit = 15
      usageData.value.emailReceiving.limit = 75
    } else {
      // $1+ tier: 3 AI calls per month
      usageData.value.aiCalls.limit = 3
      usageData.value.emailSending.limit = 5
      usageData.value.emailReceiving.limit = 25
    }
  }

  // Load usage data from API
  const loadUsageData = async () => {
    if (!patreonAuth.isAuthenticated.value) {
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const sessionId = localStorage.getItem('patreon_debug_session')
      if (!sessionId) {
        return
      }

      const response = await $fetch('/api/usage/current', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      })

      if (response.success) {
        usageData.value = {
          ...usageData.value,
          ...response.data
        }
      }
    } catch (error: any) {
      console.error('Failed to load usage data:', error)
      // If session is invalid, don't show error to user - just use defaults
      if (error?.statusCode === 401) {
        console.log('Session invalid, using default usage data')
      }
      // Don't throw the error, just log it and continue with default data
    } finally {
      // Always set loading to false, even if errors occurred
      isLoading.value = false
    }
  }

  // Load usage history from API
  const loadUsageHistory = async () => {
    if (!patreonAuth.isAuthenticated.value) {
      usageHistory.value = []
      isHistoryLoading.value = false
      return
    }

    isHistoryLoading.value = true
    
    try {
      const sessionId = localStorage.getItem('patreon_debug_session')
      if (!sessionId) {
        usageHistory.value = []
        return
      }

      const response = await $fetch('/api/usage/history', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      })

      if (response.success && Array.isArray(response.data)) {
        // Only process entries if they have valid data
        usageHistory.value = response.data
          .filter((entry: any) => entry && entry.date && entry.description)
          .map((entry: any) => ({
            ...entry,
            id: entry.id || crypto.randomUUID(),
            date: new Date(entry.date),
            type: entry.type || 'ai_call',
            description: entry.description,
            status: entry.status || 'success'
          }))
      } else {
        usageHistory.value = []
      }
    } catch (error: any) {
      console.error('Failed to load usage history:', error)
      usageHistory.value = []
    } finally {
      isHistoryLoading.value = false
    }
  }

  // Refresh all usage data
  const refreshUsageData = async () => {
    try {
      calculateLimits()
      await Promise.all([
        loadUsageData(),
        loadUsageHistory()
      ])
    } catch (error) {
      console.error('Error refreshing usage data:', error)
      // Don't throw the error, just log it
    }
  }

  // Track usage event
  const trackUsage = async (type: UsageHistoryEntry['type'], description: string, metadata?: Record<string, any>) => {
    if (!patreonAuth.isAuthenticated.value) return

    try {
      const sessionId = localStorage.getItem('patreon_debug_session')
      if (!sessionId) return

      const response = await $fetch('/api/usage/track', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        },
        body: {
          type,
          description,
          metadata
        }
      })

      if (response.success) {
        // Refresh data after tracking
        await refreshUsageData()
      }
    } catch (error) {
      console.error('Failed to track usage:', error)
    }
  }

  // Check if user can use a feature
  const canUseFeature = (feature: keyof UsageData) => {
    const featureData = usageData.value?.[feature]
    if (!featureData) return false
    return featureData.used < featureData.limit
  }

  // Get usage percentage
  const getUsagePercentage = (feature: keyof UsageData) => {
    const featureData = usageData.value?.[feature]
    if (!featureData || featureData.limit === 0) return 0
    return Math.min(100, (featureData.used / featureData.limit) * 100)
  }

  // Get feature status text
  const getFeatureStatusText = (feature: keyof UsageData) => {
    const featureData = usageData.value?.[feature]
    
    if (featureData && 'status' in featureData) {
      switch (featureData.status) {
        case 'planned': return 'Noch In Planung'
        case 'coming_soon': return 'Demnächst'
        case 'active': return 'Verfügbar'
      }
    }
    
    return patreonAuth.isPatron.value ? 'Verfügbar' : 'Patron-Status erforderlich'
  }

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unbekannt'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum'
    }
    
    return dateObj.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get usage icon
  const getUsageIcon = (type: UsageHistoryEntry['type']) => {
    switch (type) {
      case 'ai_call': return 'i-heroicons-phone'
      case 'email_sent': return 'i-heroicons-paper-airplane'
      case 'email_received': return 'i-heroicons-inbox'
      default: return 'i-heroicons-clock'
    }
  }

  // Get status text
  const getStatusText = (status: UsageHistoryEntry['status']) => {
    switch (status) {
      case 'success': return 'Erfolgreich'
      case 'error': return 'Fehler'
      case 'pending': return 'Ausstehend'
      default: return status
    }
  }

  // Initialize on mount
  onMounted(() => {
    // Ensure structure is initialized first
    if (!usageData.value) {
      usageData.value = {
        aiCalls: {
          used: 0,
          limit: 0,
          resetDate: getNextMonthFirstDay()
        },
        emailSending: {
          used: 0,
          limit: 0,
          resetDate: getNextMonthFirstDay(),
          status: 'planned'
        },
        emailReceiving: {
          used: 0,
          limit: 0,
          resetDate: getNextMonthFirstDay(),
          status: 'planned'
        }
      }
    }
    
    // Initialize history loading to false
    isHistoryLoading.value = false
    
    calculateLimits()
    refreshUsageData()
  })

  // Watch for patron status changes
  watch(() => patreonAuth.isPatron.value, (newValue, oldValue) => {
    // Only refresh if the patron status actually changed and we're not in initializing state
    if (newValue !== oldValue && !patreonAuth.isInitializing.value) {
      calculateLimits()
      refreshUsageData()
    }
  })

  return {
    // State
    usageData: readonly(usageData),
    usageHistory: readonly(usageHistory),
    isLoading: readonly(isLoading),
    isHistoryLoading: readonly(isHistoryLoading),
    
    // Methods
    refreshUsageData,
    trackUsage,
    canUseFeature,
    getUsagePercentage,
    getFeatureStatusText,
    formatDate,
    getUsageIcon,
    getStatusText
  }
}