interface PatreonCredentials {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

interface PatreonUser {
  id: string
  email: string
  full_name: string
  image_url?: string
  is_email_verified: boolean
}

interface PatreonTier {
  id: string
  title: string
  amount_cents: number
  currency: string
  description?: string
  created_at: string
}

interface PatreonMembership {
  campaign_id: string
  patron_status: string
  is_follower: boolean
  last_charge_date?: string
  last_charge_status?: string
  lifetime_support_cents: number
  currently_entitled_amount_cents: number
  pledge_relationship_start?: string
  tiers: PatreonTier[]
}

export const usePatreonOAuth = () => {
  const sessionId = ref<string | null>(null)
  const sessionExpiresAt = ref<number | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const isInitializing = ref(true)
  const authError = ref<string | null>(null)
  const user = ref<PatreonUser | null>(null)
  const memberships = ref<PatreonMembership[]>([])

  // Standard OAuth flow (Patreon doesn't explicitly support PKCE)
  const config = useRuntimeConfig()
  
  // Get allowed redirect URI that matches current domain
  const getRedirectUri = () => {
    const allowedUris = config.public.patreonAllowedRedirectUris?.split(',') || []
    
    if (process.client) {
      // Find URI that matches current domain
      const currentOrigin = `${window.location.protocol}//${window.location.host}`
      const matchingUri = allowedUris.find(uri => uri.startsWith(currentOrigin))
      if (matchingUri) {
        return matchingUri
      }
    }
    
    // Fallback to first allowed URI (usually production)
    return allowedUris[0] || ''
  }
  
  const OAUTH_CONFIG = {
    client_id: config.public.patreonClientId,
    redirect_uri: getRedirectUri(),
    scope: 'identity identity.memberships',
    response_type: 'code'
  }

  // Load session from HttpOnly cookie (via server)
  const loadSession = async () => {
    if (!process.client) {
      isInitializing.value = false
      return
    }

    try {
      // Check if we have a session by making a request that will read the cookie
      const response = await $fetch('/api/debug/patreon-identity/current', {
        method: 'GET'
      })
      
      if (response.user) {
        isAuthenticated.value = true
        user.value = response.user
        memberships.value = response.memberships || []
        sessionExpiresAt.value = response.sessionExpiresAt
      }
    } catch (error: any) {
      // If no session or expired, that's fine - user is not authenticated
      if (error.statusCode !== 401 && error.statusCode !== 404) {
        console.error('Error loading Patreon session:', error)
      }
      clearSession()
    }
    
    // Always set initializing to false, even if errors occurred
    isInitializing.value = false
  }

  // Save session state (cookie is set by server)
  const saveSession = (expiresAt: number) => {
    if (!process.client) return

    sessionExpiresAt.value = expiresAt
    isAuthenticated.value = true
    console.log('💾 Session saved, auth state updated:', { isAuthenticated: isAuthenticated.value })
    // No need to store sessionId - it's in HttpOnly cookie
  }

  // Clear session
  const clearSession = async () => {
    if (!process.client) return

    // Delete session from server (will clear cookie)
    try {
      await $fetch('/api/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error deleting server session:', error)
    }

    sessionId.value = null
    sessionExpiresAt.value = null
    isAuthenticated.value = false
    user.value = null
    memberships.value = []
    // No localStorage cleanup needed - using HttpOnly cookies
  }

  // Start OAuth flow
  const startOAuthFlow = async () => {
    if (!process.client) return

    try {
      // Generate state parameter for CSRF protection
      const state = crypto.randomUUID()
      localStorage.setItem('patreon_oauth_state', state)
      
      const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.client_id,
        redirect_uri: OAUTH_CONFIG.redirect_uri,
        scope: OAUTH_CONFIG.scope,
        response_type: OAUTH_CONFIG.response_type,
        state: state // Add CSRF protection
      })

      const authUrl = `https://www.patreon.com/oauth2/authorize?${params.toString()}`
      window.open(authUrl, 'patreon_oauth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    } catch (error) {
      console.error('Error starting Patreon OAuth flow:', error)
      authError.value = 'Failed to start authentication'
    }
  }

  // Exchange code for token and create debug session
  const exchangeCodeForToken = async (code: string, state: string) => {
    isLoading.value = true
    authError.value = null

    try {
      // Verify state parameter for CSRF protection
      const storedState = localStorage.getItem('patreon_oauth_state')
      if (!storedState || storedState !== state) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }
      
      // Clean up state
      localStorage.removeItem('patreon_oauth_state')
      
      // First, exchange code for tokens
      const tokenResponse = await $fetch('/api/auth/patreon/token', {
        method: 'POST',
        body: {
          code,
          redirect_uri: OAUTH_CONFIG.redirect_uri
        }
      })

      if (tokenResponse.error) {
        throw new Error(tokenResponse.error)
      }

      // Create a debug session with the tokens
      const sessionResponse = await $fetch('/api/debug/patreon-session', {
        method: 'POST',
        body: {
          tokens: tokenResponse.credentials
        }
      })

      // Save session state (cookie is set by server)
      saveSession(sessionResponse.expiresAt)
      
      // Get user profile to populate auth state
      await getUserProfile()
      
      console.log('✅ Authentication completed successfully')
      console.log('Auth state:', { 
        isAuthenticated: isAuthenticated.value, 
        user: user.value?.full_name 
      })
      
      return true
    } catch (error: any) {
      console.error('Patreon token exchange error:', error)
      authError.value = error.message || 'Authentication failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Get user profile and memberships using session
  const getUserProfile = async () => {
    try {
      // Check if session is still valid
      if (sessionExpiresAt.value && Date.now() >= sessionExpiresAt.value) {
        await clearSession()
        return
      }

      const response = await $fetch('/api/debug/patreon-identity/current', {
        method: 'GET'
      })

      user.value = response.user
      memberships.value = response.memberships || []
      
      // Update session expiry if provided
      if (response.sessionExpiresAt) {
        sessionExpiresAt.value = response.sessionExpiresAt
      }
      
      console.log('✅ User profile loaded:', {
        user: user.value?.full_name,
        isAuthenticated: isAuthenticated.value
      })
    } catch (error: any) {
      console.error('Error getting Patreon user profile:', error)
      
      // If session expired or not found, clear it
      if (error.statusCode === 404 || error.statusCode === 410 || error.statusCode === 401) {
        await clearSession()
      }
    }
  }

  // Get highest tier information (only from our campaign)
  const getHighestTier = computed(() => {
    if (!memberships.value.length) return null
    
    const validCampaignId = config.public.patreonCampaignId
    if (!validCampaignId) return null
    
    let highestTier: PatreonTier | null = null
    let highestAmount = 0
    
    for (const membership of memberships.value) {
      if (membership.patron_status === 'active_patron' && membership.campaign_id === validCampaignId) {
        for (const tier of membership.tiers) {
          if (tier.amount_cents > highestAmount) {
            highestAmount = tier.amount_cents
            highestTier = tier
          }
        }
      }
    }
    
    return highestTier
  })

  // Check if user is patron of our campaign
  const isPatron = computed(() => {
    const validCampaignId = config.public.patreonCampaignId
    if (!validCampaignId) return false
    
    return memberships.value.some(m => 
      m.patron_status === 'active_patron' && 
      m.campaign_id === validCampaignId
    )
  })

  // Get total lifetime support (only from our campaign)
  const lifetimeSupport = computed(() => {
    const validCampaignId = config.public.patreonCampaignId
    if (!validCampaignId) return 0
    
    return memberships.value.reduce((total, membership) => {
      if (membership.campaign_id === validCampaignId) {
        return total + membership.lifetime_support_cents
      }
      return total
    }, 0)
  })

  // Format currency
  const formatCurrency = (cents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(cents / 100)
  }

  // Logout
  const logout = async () => {
    await clearSession()
    authError.value = null
  }

  // Get session status and time remaining
  const getSessionStatus = () => {
    if (!sessionExpiresAt.value) return null
    
    const now = Date.now()
    const timeLeft = sessionExpiresAt.value - now
    
    if (timeLeft <= 0) {
      return { expired: true, timeLeft: 0 }
    }
    
    return {
      expired: false,
      timeLeft,
      timeLeftMinutes: Math.floor(timeLeft / (1000 * 60)),
      timeLeftSeconds: Math.floor((timeLeft % (1000 * 60)) / 1000)
    }
  }

  // Initialize on mount
  onMounted(() => {
    loadSession()
    
    // Listen for OAuth callback from popup
    if (process.client) {
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return
        
        console.log('📨 Received OAuth message:', event.data)
        
        if (event.data.type === 'PATREON_OAUTH_SUCCESS' && event.data.code && event.data.state) {
          console.log('🎉 OAuth success, exchanging token...')
          exchangeCodeForToken(event.data.code, event.data.state)
        } else if (event.data.type === 'PATREON_OAUTH_ERROR') {
          console.error('❌ OAuth error:', event.data.error)
          authError.value = event.data.error || 'Authentication failed'
        }
      })
    }
  })

  return {
    // State
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    isInitializing: readonly(isInitializing),
    authError: readonly(authError),
    user: readonly(user),
    memberships: readonly(memberships),
    sessionExpiresAt: readonly(sessionExpiresAt),
    
    // Computed
    getHighestTier,
    isPatron,
    lifetimeSupport,
    
    // Methods
    startOAuthFlow,
    logout,
    formatCurrency,
    getUserProfile,
    getSessionStatus,
    
    // Internal methods
    exchangeCodeForToken
  }
}