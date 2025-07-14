/**
 * Cleanup expired voice recordings
 * This function should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredVoiceRecordings() {
  try {
    const kv = hubKV()
    const keys = await kv.keys('voice_recording:*')
    
    let deletedCount = 0
    
    for (const key of keys) {
      const data = await kv.getItem(key)
      if (data) {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data
        
        // Check if recording is expired
        if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
          await kv.removeItem(key)
          deletedCount++
          console.log(`Deleted expired voice recording: ${key}`)
        }
      }
    }
    
    console.log(`Cleanup completed: ${deletedCount} expired voice recordings deleted`)
    return { deletedCount }
    
  } catch (error) {
    console.error('Voice recording cleanup error:', error)
    throw error
  }
}

/**
 * Delete voice recording after call completion
 */
export async function deleteVoiceRecordingAfterCall(callSetupId: string) {
  try {
    const kv = hubKV()
    const voiceRecordingKey = `voice_recording:${callSetupId}`
    
    const recordingData = await kv.getItem(voiceRecordingKey)
    if (recordingData) {
      await kv.removeItem(voiceRecordingKey)
      console.log(`Voice recording deleted after call completion: ${callSetupId}`)
    }
    
  } catch (error) {
    console.error('Error deleting voice recording after call:', error)
    // Don't throw error here as it's not critical for the main flow
  }
}