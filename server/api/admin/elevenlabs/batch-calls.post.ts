import { createElevenLabsClient, ElevenLabsError } from '../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const body = await readBody(event)
  console.log('=== BATCH CALL REQUEST DEBUG ===')
  console.log('Request body:', JSON.stringify(body, null, 2))
  
  const { call_name, agent_id, agent_phone_number_id, scheduled_time_unix, recipients, variables } = body

  if (!call_name || typeof call_name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Call name is required'
    })
  }

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

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recipients list is required'
    })
  }

  try {
    const client = await createElevenLabsClient(event)
    
    // Build request payload - scheduled_time_unix is required by the API
    let scheduledTime = Math.floor(Date.now() / 1000) // Default to current time
    
    if (scheduled_time_unix) {
      if (typeof scheduled_time_unix === 'string') {
        // Convert datetime string to Unix timestamp
        const date = new Date(scheduled_time_unix)
        scheduledTime = Math.floor(date.getTime() / 1000)
      } else if (typeof scheduled_time_unix === 'number') {
        scheduledTime = scheduled_time_unix
      }
    }
    
    // Add variables to each recipient
    const recipientsWithVariables = recipients.map(recipient => ({
      ...recipient,
      conversation_initiation_client_data: {
        dynamic_variables: variables || {}
      }
    }))
    
    const requestPayload = {
      call_name,
      agent_id,
      agent_phone_number_id,
      scheduled_time_unix: scheduledTime,
      recipients: recipientsWithVariables
    }
    
    console.log('=== SENDING TO ELEVENLABS ===')
    console.log('Payload:', JSON.stringify(requestPayload, null, 2))
    console.log('Recipients count:', recipients?.length)
    console.log('First recipient:', recipients?.[0])
    console.log('Scheduled time conversion:', scheduled_time_unix, '->', scheduledTime)
    
    const batchCall = await client.submitBatchCall(requestPayload)
    
    console.log('=== ELEVENLABS RESPONSE ===')
    console.log('Response:', JSON.stringify(batchCall, null, 2))
    
    return batchCall
  } catch (error) {
    console.log('=== ELEVENLABS ERROR ===')
    console.log('Error type:', error.constructor.name)
    console.log('Error message:', error.message)
    console.log('Error status:', error.status)
    console.log('Error response:', error.response)
    
    if (error instanceof ElevenLabsError) {
      // Check for specific batch calling agreement error
      if (error.response?.detail?.status === 'batch_calling_agreement_required') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Please accept the batch calling Terms & Conditions in your ElevenLabs dashboard to use this feature.'
        })
      }
      
      throw createError({
        statusCode: error.status || 500,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit batch call'
    })
  }
})