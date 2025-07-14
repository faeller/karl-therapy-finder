import { verifyAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const kv = hubKV()
    
    // Get test phone number from KV storage
    const phoneNumber = await kv.getItem('admin:test_phone_number')
    
    return {
      success: true,
      phoneNumber: phoneNumber || null
    }
    
  } catch (error) {
    console.error('Test phone number retrieval error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve test phone number'
    })
  }
})