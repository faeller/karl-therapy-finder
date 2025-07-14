import { verifyAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const kv = hubKV()
    
    // Get all call setups using index (workaround for broken kv.keys())
    const callSetups = []
    const callSetupIndex = await kv.getItem('call_setup_index') || []
    const parsedIndex = typeof callSetupIndex === 'string' ? JSON.parse(callSetupIndex) : callSetupIndex
    
    console.log('Call setup index:', parsedIndex)
    
    for (const callSetupId of parsedIndex) {
      const key = `call_setup:${callSetupId}`
      const data = await kv.getItem(key)
      console.log(`Data for ${callSetupId}:`, data ? 'found' : 'not found')
      if (data) {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data
        callSetups.push(parsedData)
      }
    }
    
    console.log('Total call setups found:', callSetups.length)
    
    // Sort by creation date (newest first)
    callSetups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    
    return {
      success: true,
      callSetups: callSetups.map(setup => ({
        id: setup.id,
        patient_name: setup.patient_name,
        patient_dob: setup.patient_dob,
        patient_insurance: setup.patient_insurance,
        patient_phone: setup.patient_phone,
        patient_address: setup.patient_address,
        patient_postal_code: setup.patient_postal_code,
        patient_city: setup.patient_city,
        call_timing: setup.call_timing,
        scheduled_date: setup.scheduled_date,
        scheduled_time: setup.scheduled_time,
        status: setup.status,
        createdAt: setup.createdAt,
        createdBy: setup.createdBy,
        hasVoiceRecording: !!setup.voiceRecordingKey
      }))
    }
    
  } catch (error) {
    console.error('Call setups retrieval error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve call setups'
    })
  }
})