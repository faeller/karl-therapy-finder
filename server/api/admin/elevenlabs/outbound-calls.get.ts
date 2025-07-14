export default defineEventHandler(async (event) => {
  // Authentication handled by middleware
  
  try {
    const kv = hubKV()
    const callsList = await kv.getItem('elevenlabs_outbound_calls_list')
    
    if (!callsList) {
      return { calls: [] }
    }
    
    let callIds: string[] = []
    try {
      // Handle both string and actual array responses from KV
      if (typeof callsList === 'string') {
        const parsed = JSON.parse(callsList)
        callIds = Array.isArray(parsed) ? parsed : []
      } else if (Array.isArray(callsList)) {
        callIds = callsList
      } else {
        callIds = []
      }
    } catch (parseError) {
      console.error('Failed to parse calls list:', parseError, 'Raw value:', callsList)
      // Reset corrupted data
      await kv.setItem('elevenlabs_outbound_calls_list', JSON.stringify([]))
      return { calls: [] }
    }
    
    if (!Array.isArray(callIds)) {
      console.error('Calls list is not an array:', callIds)
      return { calls: [] }
    }
    
    const calls = []
    
    // Retrieve call details for each call ID
    for (const callId of callIds) {
      try {
        const callData = await kv.getItem(`elevenlabs_outbound_call:${callId}`)
        if (callData) {
          const parsedCall = JSON.parse(callData)
          calls.push(parsedCall)
        }
      } catch (callError) {
        console.error(`Failed to retrieve call ${callId}:`, callError)
        // Continue with other calls
      }
    }
    
    return { calls }
  } catch (error) {
    console.error('Outbound calls error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to retrieve outbound calls: ${error.message}`
    })
  }
})