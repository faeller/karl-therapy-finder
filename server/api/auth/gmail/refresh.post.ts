export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { refresh_token } = body

  if (!refresh_token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing refresh_token'
    })
  }

  try {
    // Refresh the access token
    const tokenResponse = await $fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: useRuntimeConfig().public.gmailClientId,
        client_secret: useRuntimeConfig().gmailClientSecret,
        refresh_token,
        grant_type: 'refresh_token'
        // Desktop app clients need client_secret even with PKCE
      }).toString()
    })

    return {
      access_token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in
    }
  } catch (error: any) {
    console.error('Token refresh error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to refresh token'
    })
  }
})