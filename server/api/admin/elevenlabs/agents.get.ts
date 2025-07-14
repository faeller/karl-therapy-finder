import { createElevenLabsClient, ElevenLabsError } from '../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  try {
    const client = await createElevenLabsClient(event)
    const result = await client.listAgents()
    
    return result
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch agents'
    })
  }
})