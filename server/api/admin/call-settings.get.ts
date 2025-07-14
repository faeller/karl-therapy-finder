import { verifyAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const kv = hubKV()
    
    // Get call settings from KV storage
    const [targetPhoneNumber, agentId, phoneNumberId] = await Promise.all([
      kv.getItem('call_target_phone_number'),
      kv.getItem('elevenlabs_default_agent_id'),
      kv.getItem('elevenlabs_phone_number_id')
    ])
    
    return {
      success: true,
      targetPhoneNumber: targetPhoneNumber || null,
      agentId: agentId || null,
      phoneNumberId: phoneNumberId || null
    }
    
  } catch (error) {
    console.error('Call settings retrieval error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve call settings'
    })
  }
})