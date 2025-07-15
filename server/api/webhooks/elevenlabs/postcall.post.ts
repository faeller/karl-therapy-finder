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
    
    // Store postcall webhook payload
    await kv.setItem(`elevenlabs_webhook_postcall:${timestamp}`, JSON.stringify({
      type: 'postcall',
      timestamp,
      data: body
    }))
    
    let updatedRecords = []
    
    // Update call setup status if we can find it by conversation_id
    if (body.conversation_id) {
      // First check for direct conversation link
      const conversationLink = await kv.getItem(`conversation_link:${body.conversation_id}`)
      
      if (conversationLink) {
        // Use the stored link to update the correct records
        if (conversationLink.call_setup_id) {
          const callSetupKey = `call_setup:${conversationLink.call_setup_id}`
          const setup = await kv.getItem(callSetupKey)
          if (setup) {
            const updatedSetup = {
              ...setup,
              call_status: body.status || 'completed',
              call_successful: body.call_successful || 'unknown',
              call_duration_secs: body.call_duration_secs,
              call_ended_at: timestamp,
              transcript_available: !!body.transcript,
              audio_available: !!body.has_audio
            }
            
            await kv.setItem(callSetupKey, updatedSetup)
            updatedRecords.push({ type: 'call_setup', id: conversationLink.call_setup_id })
          }
        }
        
        if (conversationLink.test_call_id) {
          const testCallKey = `test_call:${conversationLink.test_call_id}`
          const testCall = await kv.getItem(testCallKey)
          if (testCall) {
            const updatedTestCall = {
              ...testCall,
              call_status: body.status || 'completed',
              call_successful: body.call_successful || 'unknown',
              call_duration_secs: body.call_duration_secs,
              call_ended_at: timestamp,
              transcript_available: !!body.transcript,
              audio_available: !!body.has_audio
            }
            
            await kv.setItem(testCallKey, updatedTestCall)
            updatedRecords.push({ type: 'test_call', id: conversationLink.test_call_id })
          }
        }
      } else {
        // Fallback: search for records with this conversation_id
        const callSetupIndex = await kv.getItem('call_setup_index')
        if (callSetupIndex && Array.isArray(callSetupIndex)) {
          for (const setupId of callSetupIndex) {
            const setup = await kv.getItem(`call_setup:${setupId}`)
            if (setup?.conversation_id === body.conversation_id) {
              const updatedSetup = {
                ...setup,
                call_status: body.status || 'completed',
                call_successful: body.call_successful || 'unknown',
                call_duration_secs: body.call_duration_secs,
                call_ended_at: timestamp,
                transcript_available: !!body.transcript,
                audio_available: !!body.has_audio
              }
              
              await kv.setItem(`call_setup:${setupId}`, updatedSetup)
              updatedRecords.push({ type: 'call_setup', id: setupId })
              break
            }
          }
        }
      }
      
      // Also store the conversation result for direct lookup
      await kv.setItem(`conversation_result:${body.conversation_id}`, {
        conversation_id: body.conversation_id,
        agent_id: body.agent_id,
        status: body.status,
        call_successful: body.call_successful,
        call_duration_secs: body.call_duration_secs,
        message_count: body.message_count,
        start_time_unix_secs: body.start_time_unix_secs,
        transcript_available: !!body.transcript,
        audio_available: !!body.has_audio,
        processed_at: timestamp
      })
    }

    console.log('ElevenLabs postcall webhook received:', {
      conversation_id: body.conversation_id,
      agent_id: body.agent_id,
      status: body.status,
      call_successful: body.call_successful,
      call_duration_secs: body.call_duration_secs,
      updated_records: updatedRecords,
      timestamp
    })

    return { 
      success: true, 
      message: 'Postcall webhook processed successfully',
      updated_records: updatedRecords
    }
  } catch (error) {
    console.error('Error processing ElevenLabs postcall webhook:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed'
    })
  }
})