export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code, redirect_uri } = body

  if (!code || !redirect_uri) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing code or redirect_uri'
    })
  }
  
  // Validate redirect_uri to prevent open redirect attacks
  const config = useRuntimeConfig()
  const allowedRedirectUris = config.patreonAllowedRedirectUris
    ? config.patreonAllowedRedirectUris.split(',')
    : []
  
  if (!allowedRedirectUris.includes(redirect_uri)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid redirect_uri'
    })
  }

  try {
    const config = useRuntimeConfig()
    
    const requestData = {
      client_id: config.public.patreonClientId,
      client_secret: config.patreonClientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri
    }
    
    console.log('🔐 Making Patreon token exchange request:', {
      ...requestData,
      client_secret: '[REDACTED]',
      code: code.substring(0, 10) + '...'
    })

    // Exchange authorization code for tokens
    const tokenResponse = await $fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(requestData).toString()
    })

    console.log('✅ Patreon token exchange successful')

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
    console.error('❌ Patreon token exchange error:', error)
    
    if (error.data) {
      console.error('❌ Patreon error details:', error.data)
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.data?.error_description || error.message || 'Failed to exchange token'
    })
  }
})