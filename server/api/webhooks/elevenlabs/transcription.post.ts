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
    
    // Store webhook payload for admin review
    await kv.setItem(`elevenlabs_webhook_transcription:${timestamp}`, JSON.stringify({
      type: 'transcription',
      timestamp,
      data: body
    }))
    
    // Store conversation details if not already stored
    if (body.conversation_id) {
      const existingKey = `elevenlabs_conversations:${body.conversation_id}`
      const existing = await kv.getItem(existingKey)
      
      if (!existing) {
        await kv.setItem(existingKey, JSON.stringify({
          conversation_id: body.conversation_id,
          agent_id: body.agent_id,
          timestamp,
          transcript: body.transcript,
          metadata: body.metadata,
          analysis: body.analysis
        }))
      }
    }

    console.log('ElevenLabs transcription webhook received:', {
      conversation_id: body.conversation_id,
      agent_id: body.agent_id,
      timestamp
    })

    return { success: true, message: 'Webhook processed successfully' }
  } catch (error) {
    console.error('Error processing ElevenLabs transcription webhook:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed'
    })
  }
})