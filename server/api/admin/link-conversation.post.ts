import { verifyAdminSession } from '../../utils/adminAuth'
import { z } from 'zod'

const linkConversationSchema = z.object({
  callSetupId: z.string().optional(),
  testCallId: z.string().optional(),
  conversationId: z.string().min(1, 'Conversation ID is required'),
  batchCallId: z.string().optional()
}).refine(data => data.callSetupId || data.testCallId, {
  message: 'Either callSetupId or testCallId must be provided'
})

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const body = await readBody(event)
    const validatedData = linkConversationSchema.parse(body)
    
    const kv = hubKV()
    
    if (validatedData.callSetupId) {
      // Link conversation to call setup
      const callSetupKey = `call_setup:${validatedData.callSetupId}`
      const callSetup = await kv.getItem(callSetupKey)
      
      if (!callSetup) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Call setup not found'
        })
      }
      
      const updatedCallSetup = {
        ...callSetup,
        conversation_id: validatedData.conversationId,
        batch_call_id: validatedData.batchCallId,
        linked_at: Date.now()
      }
      
      await kv.setItem(callSetupKey, updatedCallSetup)
    }
    
    if (validatedData.testCallId) {
      // Link conversation to test call
      const testCallKey = `test_call:${validatedData.testCallId}`
      const testCall = await kv.getItem(testCallKey)
      
      if (!testCall) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Test call not found'
        })
      }
      
      const updatedTestCall = {
        ...testCall,
        conversation_id: validatedData.conversationId,
        batch_call_id: validatedData.batchCallId,
        linked_at: Date.now()
      }
      
      await kv.setItem(testCallKey, updatedTestCall)
    }
    
    // Store reverse lookup for postcall webhook
    await kv.setItem(`conversation_link:${validatedData.conversationId}`, {
      conversation_id: validatedData.conversationId,
      call_setup_id: validatedData.callSetupId,
      test_call_id: validatedData.testCallId,
      batch_call_id: validatedData.batchCallId,
      linked_at: Date.now()
    })
    
    console.log('Conversation linked successfully:', {
      conversationId: validatedData.conversationId,
      callSetupId: validatedData.callSetupId,
      testCallId: validatedData.testCallId,
      batchCallId: validatedData.batchCallId
    })
    
    return {
      success: true,
      message: 'Conversation linked successfully',
      conversationId: validatedData.conversationId
    }
    
  } catch (error) {
    console.error('Link conversation error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid link data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to link conversation'
    })
  }
})