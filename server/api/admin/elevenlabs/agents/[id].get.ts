import { createElevenLabsClient, ElevenLabsError } from '../../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const agentId = getRouterParam(event, 'id')
  if (!agentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Agent ID is required'
    })
  }

  try {
    const client = await createElevenLabsClient(event)
    const agent = await client.getAgent(agentId)
    
    return agent
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch agent'
    })
  }
})