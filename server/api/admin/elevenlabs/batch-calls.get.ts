import { createElevenLabsClient, ElevenLabsError } from '../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  try {
    const client = await createElevenLabsClient(event)
    const result = await client.listBatchCalls()
    
    return result
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      // If batch calling is not available (404), return empty result
      if (error.status === 404) {
        return { batch_calls: [] }
      }
      throw createError({
        statusCode: error.status || 500,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch batch calls'
    })
  }
})