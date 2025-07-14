import { verifyAdminSession } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    const recordingId = getRouterParam(event, 'id')
    
    if (!recordingId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Recording ID is required'
      })
    }
    
    // Get voice recording from KV
    const kv = hubKV()
    const voiceRecordingKey = `voice_recording:${recordingId}`
    const recordingData = await kv.getItem(voiceRecordingKey)
    
    if (!recordingData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Voice recording not found or expired'
      })
    }
    
    const parsedData = typeof recordingData === 'string' ? JSON.parse(recordingData) : recordingData
    
    // Check if recording is expired
    if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
      // Clean up expired recording
      await kv.removeItem(voiceRecordingKey)
      throw createError({
        statusCode: 410,
        statusMessage: 'Voice recording has expired'
      })
    }
    
    // Convert data back to buffer
    const audioBuffer = Buffer.from(parsedData.data)
    
    // Set appropriate headers
    setHeader(event, 'Content-Type', parsedData.type || 'audio/wav')
    setHeader(event, 'Content-Length', audioBuffer.length.toString())
    setHeader(event, 'Content-Disposition', `attachment; filename="${parsedData.filename || 'recording.wav'}"`)
    
    return audioBuffer
    
  } catch (error) {
    console.error('Voice recording retrieval error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve voice recording'
    })
  }
})