import { karlWaitlist } from '../../database/schema'
import { useDB } from '../../utils/db'
import { requireAdmin } from '../../utils/admin-auth'
import crypto from 'crypto'

// Decryption settings (must match encryption)
const ENCRYPTION_ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.KARL_ENCRYPTION_KEY

// Validate encryption key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'your-aes-256-encryption-key-64-chars-long') {
  throw new Error('Encryption key not configured or using default placeholder')
}

// Decrypt profile data
function decryptProfile(encryptedData: string): any {
  try {
    const data = JSON.parse(encryptedData)
    const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32)
    const iv = Buffer.from(data.iv, 'hex')
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Failed to decrypt profile:', error)
    return { error: 'Decryption failed' }
  }
}

export default defineEventHandler(async (event) => {
  // Require admin authentication
  requireAdmin(event)

  try {
    const db = useDB()
    
    // Fetch all waitlist entries
    const waitlistEntries = await db.select().from(karlWaitlist).orderBy(karlWaitlist.createdAt)

    // Decrypt profiles for admin view
    const decryptedEntries = waitlistEntries.map(entry => {
      const decryptedProfile = decryptProfile(entry.encryptedProfile)
      
      return {
        id: entry.id,
        plz: entry.plz,
        status: entry.status,
        createdAt: entry.createdAt,
        notes: entry.notes,
        profile: decryptedProfile
      }
    })

    return {
      success: true,
      total: decryptedEntries.length,
      entries: decryptedEntries
    }
    
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch waitlist data'
    })
  }
})