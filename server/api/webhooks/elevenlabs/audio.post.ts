import { validateWebhookSignature } from '../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawBody = await readRawBody(event) || ''

  // Validate webhook signature
  const isValid = await validateWebhookSignature(event, rawBody)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid webhook signature'
    })
  }

  try {
    const kv = hubKV()
    const timestamp = Date.now()
    
    // Store webhook payload for admin review (without audio data due to size)
    await kv.setItem(`elevenlabs_webhook_audio:${timestamp}`, JSON.stringify({
      type: 'audio',
      timestamp,
      conversation_id: body.conversation_id,
      agent_id: body.agent_id,
      has_audio: !!body.audio_base64,
      audio_size: body.audio_base64?.length || 0
    }))
    
    // Optionally store audio data separately with TTL
    if (body.audio_base64 && body.conversation_id) {
      await kv.setItem(
        `elevenlabs_audio:${body.conversation_id}`, 
        body.audio_base64,
        {
          ttl: 86400 // 24 hours
        }
      )
    }

    console.log('ElevenLabs audio webhook received:', {
      conversation_id: body.conversation_id,
      agent_id: body.agent_id,
      audio_size: body.audio_base64?.length || 0,
      timestamp
    })

    return { success: true, message: 'Audio webhook processed successfully' }
  } catch (error) {
    console.error('Error processing ElevenLabs audio webhook:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed'
    })
  }
})