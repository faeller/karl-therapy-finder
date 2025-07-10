export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid authorization header'
    })
  }

  const accessToken = authorization.replace('Bearer ', '')
  const body = await readBody(event)
  const { to, subject, body: messageBody, from } = body

  if (!to || !subject || !messageBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: to, subject, body'
    })
  }

  try {
    // Ensure all text is properly UTF-8 encoded
    const safeSubject = Buffer.from(subject, 'utf8').toString('utf8')
    const safeBody = Buffer.from(messageBody, 'utf8').toString('utf8')
    
    // Create email message in RFC 2822 format with proper UTF-8 headers
    const emailLines = [
      `To: ${to}`,
      `From: ${from}`,
      `Subject: =?UTF-8?B?${Buffer.from(safeSubject).toString('base64')}?=`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      'MIME-Version: 1.0',
      '',
      safeBody
    ]
    
    const rawMessage = emailLines.join('\r\n')
    
    // Encode message in base64url format (Gmail API requirement)
    const encodedMessage = Buffer.from(rawMessage, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send email via Gmail API
    const response = await $fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        raw: encodedMessage
      }
    })

    return {
      messageId: response.id,
      threadId: response.threadId,
      labelIds: response.labelIds
    }
  } catch (error: any) {
    console.error('Email send error:', error)
    
    // Handle specific Gmail API errors
    if (error.status === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Gmail API authentication failed'
      })
    }
    
    if (error.status === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Gmail API access denied'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to send email'
    })
  }
})