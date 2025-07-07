export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    
    console.log('Session check:', {
      sessionExists: !!session,
      userExists: !!session?.user,
      userData: session?.user
    })
    
    return {
      user: session?.user || null,
      loggedIn: !!session?.user
    }
  } catch (error) {
    console.error('Session check error:', error)
    
    return {
      user: null,
      loggedIn: false
    }
  }
})