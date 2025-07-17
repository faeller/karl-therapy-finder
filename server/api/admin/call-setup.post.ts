import { z } from 'zod'
import { verifyAdminSession } from '../../utils/adminAuth'
import { generateCallId } from '../../utils/uuid'

const CallSetupSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required'),
  patient_dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  patient_insurance: z.string().min(1, 'Insurance is required'),
  patient_phone: z.string().min(1, 'Phone number is required'),
  patient_address: z.string().min(1, 'Address is required'),
  patient_postal_code: z.string().min(1, 'Postal code is required'),
  patient_city: z.string().min(1, 'City is required'),
  call_timing: z.enum(['now', 'scheduled']),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  // Appointment preferences
  appointment_days: z.string().optional(),
  appointment_time_from: z.string().optional(),
  appointment_time_to: z.string().optional(),
  appointment_notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await verifyAdminSession(event)
    
    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received'
      })
    }
    
    // Extract form fields
    const fields: Record<string, string> = {}
    let voiceRecording: File | null = null
    
    for (const item of formData) {
      if (item.name === 'voice_recording') {
        voiceRecording = new File([item.data], item.filename || 'consent.wav', {
          type: item.type || 'audio/wav'
        })
      } else if (item.name) {
        fields[item.name] = item.data.toString()
      }
    }
    
    // Validate required fields
    const validatedData = CallSetupSchema.parse(fields)
    
    // Validate voice recording
    if (!voiceRecording) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Voice recording is required'
      })
    }
    
    // Validate scheduled timing
    if (validatedData.call_timing === 'scheduled') {
      if (!validatedData.scheduled_date || !validatedData.scheduled_time) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Scheduled date and time are required'
        })
      }
    }
    
    // Generate unique ID for this call setup
    const callSetupId = `call_${generateCallId()}`
    
    // Store voice recording in KV with expiration (7 days)
    const voiceRecordingKey = `voice_recording:${callSetupId}`
    const voiceRecordingData = {
      data: Array.from(new Uint8Array(await voiceRecording.arrayBuffer())),
      filename: voiceRecording.name,
      type: voiceRecording.type,
      size: voiceRecording.size,
      uploadedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }
    
    const kv = hubKV()
    await kv.setItem(voiceRecordingKey, voiceRecordingData, {
      ttl: 7 * 24 * 60 * 60 // 7 days in seconds
    })
    
    // Store call setup data
    const callSetupData = {
      id: callSetupId,
      ...validatedData,
      voiceRecordingKey,
      status: 'pending',
      createdAt: Date.now(),
      createdBy: event.context.adminUser?.email || 'unknown'
    }
    
    const callSetupKey = `call_setup:${callSetupId}`
    await kv.setItem(callSetupKey, callSetupData)
    
    // Add to call setup index (workaround for broken kv.keys())
    const callSetupIndex = await kv.getItem('call_setup_index') || []
    const parsedIndex = typeof callSetupIndex === 'string' ? JSON.parse(callSetupIndex) : callSetupIndex
    parsedIndex.push(callSetupId)
    await kv.setItem('call_setup_index', parsedIndex)
    
    // Add to job queue if immediate call
    if (validatedData.call_timing === 'now') {
      const jobQueueKey = `job_queue:call:${callSetupId}`
      const jobData = {
        id: callSetupId,
        type: 'call_setup',
        data: callSetupData,
        priority: 'high',
        createdAt: Date.now(),
        scheduledFor: Date.now() + (5 * 60 * 1000), // 5 minutes from now
        status: 'pending'
      }
      
      await kv.setItem(jobQueueKey, jobData)
    } else {
      // Schedule for later
      const scheduledDateTime = new Date(`${validatedData.scheduled_date}T${validatedData.scheduled_time}:00`)
      const jobQueueKey = `job_queue:call:${callSetupId}`
      const jobData = {
        id: callSetupId,
        type: 'call_setup',
        data: callSetupData,
        priority: 'normal',
        createdAt: Date.now(),
        scheduledFor: scheduledDateTime.getTime(),
        status: 'scheduled'
      }
      
      await kv.setItem(jobQueueKey, jobData)
    }
    
    // Log the call setup
    console.log(`Call setup created: ${callSetupId} for patient: ${validatedData.patient_name}`)
    
    return {
      success: true,
      callSetupId,
      message: 'Call setup created successfully',
      scheduledFor: validatedData.call_timing === 'now' ? 
        'in 5 minutes' : 
        `${validatedData.scheduled_date} at ${validatedData.scheduled_time}`
    }
    
  } catch (error) {
    console.error('Call setup error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create call setup'
    })
  }
})