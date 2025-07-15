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
    
    // Get audio from ElevenLabs
    const client = await createElevenLabsClient(event)
    const audioBuffer = await client.getConversationAudio(conversationId)
    
    if (!audioBuffer) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Conversation audio not found'
      })
    }
    
    // Set appropriate headers for audio response
    setHeader(event, 'Content-Type', 'audio/mpeg')
    setHeader(event, 'Content-Disposition', `attachment; filename="conversation_${conversationId}.mp3"`)
    setHeader(event, 'Content-Length', audioBuffer.byteLength.toString())
    
    // Return the audio buffer
    return audioBuffer
    
  } catch (error) {
    console.error('Failed to fetch conversation audio:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch conversation audio'
    })
  }
})