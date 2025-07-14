import { createElevenLabsClient, ElevenLabsError } from '../../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const conversationId = getRouterParam(event, 'id')
  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation ID is required'
    })
  }

  try {
    const client = await createElevenLabsClient(event)
    const conversation = await client.getConversation(conversationId)
    
    return conversation
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch conversation details'
    })
  }
})