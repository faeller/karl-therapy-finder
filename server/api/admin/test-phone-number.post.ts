import { verifyAdminSession } from '../../utils/adminAuth'
import { z } from 'zod'

const testPhoneNumberSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required')
})

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const body = await readBody(event)
    const validatedData = testPhoneNumberSchema.parse(body)
    
    const kv = hubKV()
    
    // Save test phone number to KV storage
    await kv.setItem('admin:test_phone_number', validatedData.phoneNumber.trim())
    
    // Log the action
    console.log('Test phone number updated:', {
      phoneNumber: validatedData.phoneNumber,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: true,
      message: 'Test phone number saved successfully'
    }
    
  } catch (error) {
    console.error('Test phone number save error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid phone number data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save test phone number'
    })
  }
})