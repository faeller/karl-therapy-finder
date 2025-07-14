import { createElevenLabsClient, ElevenLabsError } from '../../../utils/elevenlabs'

export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  try {
    const client = await createElevenLabsClient(event)
    const query = getQuery(event)
    
    const params = {
      cursor: query.cursor as string | undefined,
      agent_id: query.agent_id as string | undefined,
      call_successful: query.call_successful as 'success' | 'failure' | 'unknown' | undefined,
      call_start_before_unix: query.call_start_before_unix ? Number(query.call_start_before_unix) : undefined,
      call_start_after_unix: query.call_start_after_unix ? Number(query.call_start_after_unix) : undefined,
      page_size: query.page_size ? Number(query.page_size) : undefined
    }

    const result = await client.listConversations(params)
    
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
      statusMessage: 'Failed to fetch conversations'
    })
  }
})