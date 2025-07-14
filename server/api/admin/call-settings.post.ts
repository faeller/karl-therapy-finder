import { verifyAdminSession } from '../../utils/adminAuth'
import { z } from 'zod'

const callSettingsSchema = z.object({
  targetPhoneNumber: z.string().min(1, 'Target phone number is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  phoneNumberId: z.string().min(1, 'Phone number ID is required')
})

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const body = await readBody(event)
    const validatedData = callSettingsSchema.parse(body)
    
    const kv = hubKV()
    
    // Save call settings to KV storage
    await Promise.all([
      kv.setItem('call_target_phone_number', validatedData.targetPhoneNumber.trim()),
      kv.setItem('elevenlabs_default_agent_id', validatedData.agentId.trim()),
      kv.setItem('elevenlabs_phone_number_id', validatedData.phoneNumberId.trim())
    ])
    
    // Log the action
    console.log('Call settings updated:', {
      targetPhoneNumber: validatedData.targetPhoneNumber,
      agentId: validatedData.agentId,
      phoneNumberId: validatedData.phoneNumberId,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: true,
      message: 'Call settings saved successfully'
    }
    
  } catch (error) {
    console.error('Call settings save error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid call settings data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save call settings'
    })
  }
})