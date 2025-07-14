import { verifyAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const kv = hubKV()
    
    // Get all job queue entries
    const jobs = []
    const keys = await kv.keys('job_queue:*')
    
    for (const key of keys) {
      const data = await kv.getItem(key)
      if (data) {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data
        jobs.push(parsedData)
      }
    }
    
    // Sort by creation date (newest first)
    jobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    
    return {
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        type: job.type,
        callSetupId: job.callSetupId,
        originalCallSetupId: job.originalCallSetupId,
        testPhoneNumber: job.testPhoneNumber,
        patient_data: job.patient_data,
        scheduledFor: job.scheduledFor,
        status: job.status,
        createdAt: job.createdAt,
        hasVoiceRecording: !!job.voiceRecordingKey
      }))
    }
    
  } catch (error) {
    console.error('Job queue retrieval error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve job queue'
    })
  }
})