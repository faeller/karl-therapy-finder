export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid authorization header'
    })
  }

  const accessToken = authorization.replace('Bearer ', '')
  const query = getQuery(event)
  const recipientEmail = query.to as string

  try {
    // Search for sent messages to specific recipient
    let searchQuery = 'in:sent'
    if (recipientEmail) {
      searchQuery += ` to:${recipientEmail}`
    }

    // Get list of messages
    const messagesList = await $fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!messagesList.messages || messagesList.messages.length === 0) {
      return { emails: [] }
    }

    // Get details for each message (limited to avoid rate limits)
    const emails = []
    const maxEmails = Math.min(messagesList.messages.length, 10) // Limit to 10 recent emails

    for (let i = 0; i < maxEmails; i++) {
      const messageId = messagesList.messages[i].id
      
      try {
        const message = await $fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        // Extract headers
        const headers = message.payload?.headers || []
        const toHeader = headers.find((h: any) => h.name.toLowerCase() === 'to')
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')

        emails.push({
          messageId: message.id,
          threadId: message.threadId,
          to: toHeader?.value || '',
          subject: subjectHeader?.value || '',
          sentAt: dateHeader?.value ? new Date(dateHeader.value) : new Date(parseInt(message.internalDate))
        })
      } catch (messageError) {
        console.error(`Error fetching message ${messageId}:`, messageError)
        // Continue with other messages
      }
    }

    return { emails }
  } catch (error: any) {
    console.error('Sent emails fetch error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get sent emails'
    })
  }
})