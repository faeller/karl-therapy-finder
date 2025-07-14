import { verifyAdminSession } from '../../utils/adminAuth'
import { createElevenLabsClient } from '../../utils/elevenlabs'
import { z } from 'zod'

const testCallSchema = z.object({
  callSetupId: z.string().min(1, 'Call setup ID is required'),
  testPhoneNumber: z.string().min(1, 'Test phone number is required')
})

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const body = await readBody(event)
    const validatedData = testCallSchema.parse(body)
    
    const kv = hubKV()
    
    // Get the original call setup
    const callSetupKey = `call_setup:${validatedData.callSetupId}`
    const callSetupData = await kv.getItem(callSetupKey)
    
    if (!callSetupData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Call setup not found'
      })
    }
    
    const parsedCallSetup = typeof callSetupData === 'string' 
      ? JSON.parse(callSetupData) 
      : callSetupData
    
    // Get ElevenLabs settings
    const [agentId, phoneNumberId] = await Promise.all([
      kv.getItem('elevenlabs_default_agent_id'),
      kv.getItem('elevenlabs_phone_number_id')
    ])
    
    if (!agentId || !phoneNumberId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ElevenLabs agent ID or phone number ID not configured'
      })
    }
    
    // Create ElevenLabs batch call
    const client = await createElevenLabsClient(event)
    const testCallId = `test_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Prepare batch call payload
    const batchCallPayload = {
      call_name: `Test Call - ${parsedCallSetup.patient_name}`,
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      scheduled_time_unix: Math.floor(Date.now() / 1000), // Immediate
      recipients: [{
        phone_number: validatedData.testPhoneNumber,
        conversation_initiation_client_data: {
          dynamic_variables: {
            patient_name: parsedCallSetup.patient_name,
            patient_dob: parsedCallSetup.patient_dob,
            patient_insurance: parsedCallSetup.patient_insurance,
            patient_phone: parsedCallSetup.patient_phone,
            patient_address: parsedCallSetup.patient_address,
            patient_postal_code: parsedCallSetup.patient_postal_code,
            patient_city: parsedCallSetup.patient_city,
            call_type: 'test_call',
            original_call_setup_id: validatedData.callSetupId
          }
        }
      }]
    }
    
    console.log('Creating ElevenLabs batch call for test:', {
      testCallId,
      patientName: parsedCallSetup.patient_name,
      testPhoneNumber: validatedData.testPhoneNumber,
      agentId,
      phoneNumberId
    })
    
    const batchCall = await client.submitBatchCall(batchCallPayload)
    
    // Store test call record for tracking
    const testCallRecord = {
      id: testCallId,
      type: 'test_call',
      batchCallId: batchCall.batch_id,
      originalCallSetupId: validatedData.callSetupId,
      testPhoneNumber: validatedData.testPhoneNumber,
      patient_data: {
        patient_name: parsedCallSetup.patient_name,
        patient_dob: parsedCallSetup.patient_dob,
        patient_insurance: parsedCallSetup.patient_insurance,
        patient_phone: parsedCallSetup.patient_phone,
        patient_address: parsedCallSetup.patient_address,
        patient_postal_code: parsedCallSetup.patient_postal_code,
        patient_city: parsedCallSetup.patient_city
      },
      createdAt: Date.now(),
      status: 'scheduled'
    }
    
    await kv.setItem(`test_call:${testCallId}`, testCallRecord)
    
    console.log('Test call batch created successfully:', {
      testCallId,
      batchCallId: batchCall.batch_id,
      scheduledFor: 'immediate'
    })
    
    return {
      success: true,
      testCallId,
      batchCallId: batchCall.batch_id,
      message: 'Test call batch created successfully',
      details: {
        patientName: parsedCallSetup.patient_name,
        testPhoneNumber: validatedData.testPhoneNumber,
        scheduledIn: 'immediately',
        batchCallId: batchCall.batch_id
      }
    }
    
  } catch (error) {
    console.error('Test call creation error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid test call data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create test call'
    })
  }
})