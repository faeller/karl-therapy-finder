import { createElevenLabsClient, ElevenLabsError } from '../../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const batchId = getRouterParam(event, 'id')
  
  if (!batchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Batch call ID is required'
    })
  }

  try {
    const client = await createElevenLabsClient(event)
    const batchCall = await client.getBatchCall(batchId)
    
    return batchCall
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get batch call details'
    })
  }
})