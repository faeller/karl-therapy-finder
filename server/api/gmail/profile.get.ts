export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid authorization header'
    })
  }

  const accessToken = authorization.replace('Bearer ', '')

  try {
    // Get user profile from Gmail API
    const profile = await $fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    return {
      emailAddress: profile.emailAddress,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal
    }
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get user profile'
    })
  }
})