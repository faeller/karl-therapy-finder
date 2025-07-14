import { createElevenLabsClient, ElevenLabsError } from '../../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const body = await readBody(event)
  const { agent_id, agent_phone_number_id, to_number, conversation_initiation_client_data } = body

  if (!agent_id || typeof agent_id !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Agent ID is required'
    })
  }

  if (!agent_phone_number_id || typeof agent_phone_number_id !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Agent phone number ID is required'
    })
  }

  if (!to_number || typeof to_number !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'To phone number is required'
    })
  }

  try {
    const client = await createElevenLabsClient(event)
    
    // Make outbound call via ElevenLabs Twilio integration
    const response = await client.makeOutboundCall({
      agent_id,
      agent_phone_number_id,
      to_number,
      conversation_initiation_client_data
    })
    
    // Generate unique call ID and store call data in KV
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const kv = hubKV()
    
    const callData = {
      id: callId,
      agent_id,
      agent_phone_number_id,
      to_number,
      conversation_id: response.conversation_id,
      call_sid: response.callSid,
      status: response.success ? 'initiated' : 'failed',
      created_at: Date.now(),
      error_message: response.success ? undefined : response.message
    }
    
    await kv.setItem(`elevenlabs_outbound_call:${callId}`, JSON.stringify(callData))
    
    // Also store in a list for easy retrieval
    let callsList: string[] = []
    try {
      const existingCalls = await kv.getItem('elevenlabs_outbound_calls_list')
      if (existingCalls && typeof existingCalls === 'string') {
        callsList = JSON.parse(existingCalls)
      }
    } catch (error) {
      console.error('Failed to parse existing calls list:', error)
      callsList = []
    }
    
    // Ensure callsList is an array
    if (!Array.isArray(callsList)) {
      callsList = []
    }
    
    callsList.unshift(callId)
    
    // Keep only the last 100 calls
    if (callsList.length > 100) {
      callsList.splice(100)
    }
    
    await kv.setItem('elevenlabs_outbound_calls_list', JSON.stringify(callsList))

    return {
      success: response.success,
      message: response.message,
      call_id: callId,
      conversation_id: response.conversation_id,
      call_sid: response.callSid
    }
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initiate outbound call'
    })
  }
})