import { karlWaitlist } from '../database/schema'
import { useDB } from '../utils/db'
import crypto from 'crypto'

interface WaitlistRequest {
  profile: any // Complete onboarding profile data
  consent: boolean // User consent to store data
}

interface WaitlistResponse {
  success: boolean
  message: string
  waitlistId?: number
}

// Encryption settings
const ENCRYPTION_ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.KARL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')

// Encrypt profile data
function encryptProfile(profileData: any): string {
  const iv = crypto.randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32) // Ensure 32 bytes for AES-256
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  
  let encrypted = cipher.update(JSON.stringify(profileData), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted
  })
}

export default defineEventHandler(async (event): Promise<WaitlistResponse> => {
  const body = await readBody(event) as WaitlistRequest
  const { profile, consent } = body

  // Validate required data
  if (!profile || !consent) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile data and consent are required'
    })
  }

  // Validate that we have essential profile data (only PLZ required)
  if (!profile.location || !/^\d{5}$/.test(profile.location)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Gültige PLZ ist erforderlich'
    })
  }

  try {
    console.log(`📝 Adding user to Karl waitlist for PLZ ${profile.location}`)

    // Encrypt the complete profile
    const encryptedProfile = encryptProfile(profile)

    // Insert into database
    const db = useDB()
    const result = await db.insert(karlWaitlist).values({
      encryptedProfile,
      plz: profile.location, // Store PLZ unencrypted for analytics
      createdAt: new Date(),
      status: 'pending'
    }).returning({ id: karlWaitlist.id })

    const waitlistId = result[0]?.id

    console.log(`✅ User added to Karl waitlist with ID ${waitlistId}`)

    return {
      success: true,
      message: 'Du wurdest erfolgreich zur Karl-Warteliste hinzugefügt! Wir melden uns bei dir.',
      waitlistId
    }

  } catch (error) {
    console.error('Error adding user to Karl waitlist:', error)
    
    return {
      success: false,
      message: 'Es gab einen Fehler beim Hinzufügen zur Warteliste. Bitte versuche es später erneut.'
    }
  }
})