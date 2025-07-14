import { verifyAdminSession } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Call setup ID is required'
      })
    }
    
    const kv = hubKV()
    
    // Get the call setup first to check if it has a voice recording
    const callSetupKey = `call_setup:${id}`
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
    
    // Delete the voice recording if it exists
    if (parsedCallSetup.voiceRecordingKey) {
      await kv.removeItem(parsedCallSetup.voiceRecordingKey)
    }
    
    // Delete the call setup
    await kv.removeItem(callSetupKey)
    
    // Also remove any related job queue entries
    const jobKeys = await kv.keys(`job_queue:*`)
    for (const jobKey of jobKeys) {
      const jobData = await kv.getItem(jobKey)
      if (jobData) {
        const parsedJob = typeof jobData === 'string' ? JSON.parse(jobData) : jobData
        if (parsedJob.callSetupId === id || parsedJob.originalCallSetupId === id) {
          await kv.removeItem(jobKey)
        }
      }
    }
    
    // Log the deletion
    console.log('Call setup deleted:', {
      id,
      patientName: parsedCallSetup.patient_name,
      hadVoiceRecording: !!parsedCallSetup.voiceRecordingKey,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: true,
      message: 'Call setup deleted successfully'
    }
    
  } catch (error) {
    console.error('Call setup deletion error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete call setup'
    })
  }
})