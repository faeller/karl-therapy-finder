import { verifyAdminSession } from '../../../../utils/adminAuth'
import { createElevenLabsClient } from '../../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const conversationId = getRouterParam(event, 'id')
    
    if (!conversationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Conversation ID is required'
      })
    }
    
    // Get transcript from ElevenLabs
    const client = await createElevenLabsClient(event)
    const conversation = await client.getConversation(conversationId)
    
    if (!conversation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Conversation not found'
      })
    }
    
    return {
      success: true,
      conversation_id: conversationId,
      transcript: conversation.transcript,
      metadata: {
        agent_id: conversation.agent_id,
        start_time: conversation.start_time_unix_secs,
        duration: conversation.call_duration_secs,
        status: conversation.status,
        call_successful: conversation.call_successful
      }
    }
    
  } catch (error) {
    console.error('Failed to fetch conversation transcript:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch conversation transcript'
    })
  }
})