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
    const config = useRuntimeConfig()
    
    const requestData = {
      grant_type: 'refresh_token',
      refresh_token,
      client_id: config.public.patreonClientId,
      client_secret: config.patreonClientSecret
    }

    console.log('🔄 Refreshing Patreon token')

    const tokenResponse = await $fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(requestData).toString()
    })

    console.log('✅ Patreon token refresh successful')

    return {
      access_token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in
    }
  } catch (error: any) {
    console.error('❌ Patreon token refresh error:', error)
    
    if (error.data) {
      console.error('❌ Patreon error details:', error.data)
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.data?.error_description || error.message || 'Failed to refresh token'
    })
  }
})