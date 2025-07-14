export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const body = await readBody(event)
  const { apiKey, webhookSecret } = body

  if (!apiKey || typeof apiKey !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'API key is required'
    })
  }

  const kv = hubKV()
  
  // Store API key
  await kv.setItem('elevenlabs_api_key', apiKey)
  
  // Store webhook secret if provided
  if (webhookSecret && typeof webhookSecret === 'string') {
    await kv.setItem('elevenlabs_webhook_secret', webhookSecret)
  }

  return {
    success: true,
    message: 'ElevenLabs settings updated successfully'
  }
})