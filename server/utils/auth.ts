export async function requireAdmin(event: any) {
  const session = await getUserSession(event)
  
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Admin authentication required'
    })
  }
  
  return session.user
}