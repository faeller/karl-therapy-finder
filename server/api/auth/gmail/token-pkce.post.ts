export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code, redirect_uri, code_verifier } = body

  if (!code || !redirect_uri || !code_verifier) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing code, redirect_uri, or code_verifier'
    })
  }

  try {
    const config = useRuntimeConfig()
    
    const requestData = {
      client_id: config.public.gmailClientId,
      client_secret: config.gmailClientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri,
      code_verifier // PKCE verification + client secret for desktop app security
    }
    
    console.log('🔐 Making PKCE token exchange request:', {
      ...requestData,
      code: code.substring(0, 10) + '...',
      code_verifier: code_verifier.substring(0, 10) + '...'
    })

    // Exchange authorization code for tokens using PKCE
    const tokenResponse = await $fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(requestData).toString()
    })

    console.log('✅ PKCE token exchange successful')

    // Calculate expiry date
    const expiryDate = Date.now() + (tokenResponse.expires_in * 1000)

    return {
      credentials: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type,
        expiry_date: expiryDate
      }
    }
  } catch (error: any) {
    console.error('❌ PKCE Token exchange error:', error)
    
    // Try to get more details from the error
    if (error.data) {
      console.error('❌ Google error details:', error.data)
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.data?.error_description || error.message || 'Failed to exchange token'
    })
  }
})