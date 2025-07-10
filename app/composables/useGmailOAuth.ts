interface GmailCredentials {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

interface EmailMessage {
  to: string
  subject: string
  body: string
  from?: string
}

interface GmailSentEmail {
  messageId: string
  to: string
  subject: string
  sentAt: Date
  threadId: string
}

export const useGmailOAuth = () => {
  const credentials = ref<GmailCredentials | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const authError = ref<string | null>(null)
  const userEmail = ref<string | null>(null)

  // PKCE helpers
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return base64urlEncode(array)
  }

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return base64urlEncode(new Uint8Array(digest))
  }

  const base64urlEncode = (array: Uint8Array) => {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // OAuth configuration using PKCE with Desktop app client
  const config = useRuntimeConfig()
  const OAUTH_CONFIG = {
    client_id: config.public.gmailClientId,
    redirect_uri: process.client 
      ? `${window.location.protocol}//${window.location.host}/auth/gmail/callback`
      : 'https://karl-helps.org/auth/gmail/callback', // Production fallback
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  }

  // Load credentials from localStorage
  const loadCredentials = () => {
    if (!process.client) return

    try {
      const stored = localStorage.getItem('gmail_credentials')
      if (stored) {
        const creds = JSON.parse(stored)
        credentials.value = creds
        isAuthenticated.value = true
        
        // Check if token needs refresh
        if (creds.expiry_date && Date.now() > creds.expiry_date) {
          refreshToken()
        } else {
          getUserProfile()
        }
      }
    } catch (error) {
      console.error('Error loading Gmail credentials:', error)
      clearCredentials()
    }
  }

  // Save credentials to localStorage
  const saveCredentials = (creds: GmailCredentials) => {
    if (!process.client) return

    credentials.value = creds
    isAuthenticated.value = true
    localStorage.setItem('gmail_credentials', JSON.stringify(creds))
  }

  // Clear credentials
  const clearCredentials = () => {
    if (!process.client) return

    credentials.value = null
    isAuthenticated.value = false
    userEmail.value = null
    localStorage.removeItem('gmail_credentials')
  }

  // Start OAuth flow with PKCE
  const startOAuthFlow = async () => {
    if (!process.client) return

    try {
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      
      // Store code verifier for later use
      sessionStorage.setItem('gmail_code_verifier', codeVerifier)

      const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.client_id,
        redirect_uri: OAUTH_CONFIG.redirect_uri,
        scope: OAUTH_CONFIG.scope,
        response_type: OAUTH_CONFIG.response_type,
        access_type: OAUTH_CONFIG.access_type,
        prompt: OAUTH_CONFIG.prompt,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      window.open(authUrl, 'gmail_oauth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    } catch (error) {
      console.error('Error starting PKCE OAuth flow:', error)
      authError.value = 'Failed to start authentication'
    }
  }

  // Exchange code for token using PKCE
  const exchangeCodeForToken = async (code: string) => {
    isLoading.value = true
    authError.value = null

    try {
      // Get the stored code verifier
      const codeVerifier = sessionStorage.getItem('gmail_code_verifier')
      if (!codeVerifier) {
        throw new Error('Code verifier not found - authentication session expired')
      }

      const response = await $fetch('/api/auth/gmail/token-pkce', {
        method: 'POST',
        body: {
          code,
          redirect_uri: OAUTH_CONFIG.redirect_uri,
          code_verifier: codeVerifier
        }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Clean up the code verifier
      sessionStorage.removeItem('gmail_code_verifier')

      saveCredentials(response.credentials)
      await getUserProfile()
      
      return true
    } catch (error: any) {
      console.error('Token exchange error:', error)
      authError.value = error.message || 'Authentication failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Refresh access token
  const refreshToken = async () => {
    if (!credentials.value?.refresh_token) return false

    try {
      const response = await $fetch('/api/auth/gmail/refresh', {
        method: 'POST',
        body: {
          refresh_token: credentials.value.refresh_token
        }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Update credentials with new access token
      const updatedCreds = {
        ...credentials.value,
        access_token: response.access_token,
        expiry_date: Date.now() + (response.expires_in * 1000)
      }

      saveCredentials(updatedCreds)
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      clearCredentials()
      return false
    }
  }

  // Get user profile
  const getUserProfile = async () => {
    if (!credentials.value?.access_token) return

    try {
      const response = await $fetch('/api/gmail/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.value.access_token}`
        }
      })

      userEmail.value = response.emailAddress
    } catch (error) {
      console.error('Error getting user profile:', error)
    }
  }

  // Send email
  const sendEmail = async (emailData: EmailMessage): Promise<GmailSentEmail | null> => {
    if (!credentials.value?.access_token) {
      throw new Error('Not authenticated')
    }

    isLoading.value = true

    try {
      const response = await $fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.value.access_token}`
        },
        body: {
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          from: emailData.from || userEmail.value
        }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      return {
        messageId: response.messageId,
        to: emailData.to,
        subject: emailData.subject,
        sentAt: new Date(),
        threadId: response.threadId
      }
    } catch (error: any) {
      console.error('Email send error:', error)
      
      // If token expired, try to refresh
      if (error.message?.includes('401') || error.message?.includes('invalid_grant')) {
        const refreshed = await refreshToken()
        if (refreshed) {
          // Retry sending email
          return sendEmail(emailData)
        }
      }
      
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Get sent emails related to a specific recipient (for tracking replies)
  const getSentEmails = async (recipientEmail: string): Promise<GmailSentEmail[]> => {
    if (!credentials.value?.access_token) return []

    try {
      const response = await $fetch('/api/gmail/sent', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.value.access_token}`
        },
        query: {
          to: recipientEmail
        }
      })

      return response.emails || []
    } catch (error) {
      console.error('Error getting sent emails:', error)
      return []
    }
  }

  // Logout
  const logout = () => {
    clearCredentials()
    authError.value = null
  }

  // Initialize on mount
  onMounted(() => {
    loadCredentials()
    
    // Listen for OAuth callback from popup
    if (process.client) {
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'GMAIL_OAUTH_SUCCESS' && event.data.code) {
          exchangeCodeForToken(event.data.code)
        } else if (event.data.type === 'GMAIL_OAUTH_ERROR') {
          authError.value = event.data.error || 'Authentication failed'
        }
      })
    }
  })

  return {
    // State
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    authError: readonly(authError),
    userEmail: readonly(userEmail),
    
    // Methods
    startOAuthFlow,
    sendEmail,
    getSentEmails,
    logout,
    
    // Internal methods (for manual code entry if needed)
    exchangeCodeForToken
  }
}