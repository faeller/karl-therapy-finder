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

  const body = await readBody(event)
  
  // Handle prompt update by constructing the correct nested structure
  const updates: any = {}
  
  if (body.name !== undefined) {
    updates.name = body.name
  }
  
  if (body.prompt !== undefined) {
    updates.conversation_config = {
      agent: {
        prompt: {
          prompt: body.prompt
        }
      }
    }
  }
  
  if (body.language !== undefined) {
    if (!updates.conversation_config) {
      updates.conversation_config = { agent: {} }
    }
    if (!updates.conversation_config.agent) {
      updates.conversation_config.agent = {}
    }
    updates.conversation_config.agent.language = body.language
  }
  
  if (body.voice_id !== undefined) {
    if (!updates.conversation_config) {
      updates.conversation_config = { tts: {} }
    }
    if (!updates.conversation_config.tts) {
      updates.conversation_config.tts = {}
    }
    updates.conversation_config.tts.voice_id = body.voice_id
  }
  
  if (body.conversation_config !== undefined) {
    updates.conversation_config = { ...updates.conversation_config, ...body.conversation_config }
  }

  try {
    const client = await createElevenLabsClient(event)
    const agent = await client.updateAgent(agentId, updates)
    
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
      statusMessage: 'Failed to update agent'
    })
  }
})