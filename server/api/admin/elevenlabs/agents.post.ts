import { createElevenLabsClient, ElevenLabsError } from '../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  const body = await readBody(event)
  const { name, prompt, language, voice_id, conversation_config } = body

  if (!name || typeof name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Agent name is required'
    })
  }

  try {
    const client = await createElevenLabsClient(event)
    
    const agent = await client.createAgent({
      name,
      prompt,
      language,
      voice_id,
      conversation_config
    })
    
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
      statusMessage: 'Failed to create agent'
    })
  }
})