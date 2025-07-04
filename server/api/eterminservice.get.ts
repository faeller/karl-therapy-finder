interface EterminserviceRequest {
  postleitzahl: string
  leistungsmerkmale: string[]
}

interface EterminserviceResponse {
  termineVorhanden?: boolean
  suchRadius?: string
  kv?: string
  referenceId?: string
  errors?: Array<{
    code: string
    text: string
  }>
}

interface EterminserviceResult {
  plz: string
  available: boolean
  radius?: string
  region?: string
  errors?: string[]
  message?: string
}

// Simple in-memory cache with expiration
const cache = new Map<string, { data: EterminserviceResult; expires: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes (shorter than therapist cache)

// Service codes mapping for different types of appointments
const SERVICE_CODES = {
  'psychotherapy': 'W991', // Psychotherapeutische Sprechstunde
  'psychotherapy-children': 'W991', // Same code but different interpretation
  'psychiatry': 'W992', // Example, may need adjustment
  'default': 'W991'
} as const

export default defineEventHandler(async (event): Promise<EterminserviceResult> => {
  const query = getQuery(event)
  const plz = query.plz as string
  const serviceType = query.service as string || 'psychotherapy'
  
  // Map service type to actual service code
  const service = SERVICE_CODES[serviceType as keyof typeof SERVICE_CODES] || SERVICE_CODES.default

  if (!plz) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PLZ parameter is required'
    })
  }

  // Validate PLZ format (5 digits)
  if (!/^\d{5}$/.test(plz)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PLZ must be a 5-digit postal code'
    })
  }

  // Create cache key
  const cacheKey = `${plz}-${service}`
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    console.log(`✅ eterminservice cache hit for: ${cacheKey}`)
    return cached.data
  }
  
  console.log(`🔄 eterminservice cache miss, fetching for: ${cacheKey}`)

  // Since eterminservice.de has anti-bot protection, we'll provide general availability info
  // based on known service areas without making actual API calls
  
  try {
    console.log(`ℹ️  Checking general availability for PLZ ${plz} (no external API call)`)
    
    // Define regions where eterminservice is generally available
    // These are major metropolitan areas and KV regions known to support online booking
    const availableRegions = [
      // Berlin
      { prefix: '10', region: 'Berlin', available: true },
      { prefix: '12', region: 'Berlin', available: true },
      { prefix: '13', region: 'Berlin', available: true },
      { prefix: '14', region: 'Berlin', available: true },
      
      // Hamburg 
      { prefix: '20', region: 'Hamburg', available: true },
      { prefix: '21', region: 'Hamburg', available: true },
      { prefix: '22', region: 'Hamburg', available: true },
      
      // Munich
      { prefix: '80', region: 'Bayern', available: true },
      { prefix: '81', region: 'Bayern', available: true },
      { prefix: '85', region: 'Bayern', available: true },
      
      // Cologne
      { prefix: '50', region: 'Nordrhein', available: true },
      { prefix: '51', region: 'Nordrhein', available: true },
      
      // Frankfurt
      { prefix: '60', region: 'Hessen', available: true },
      { prefix: '65', region: 'Hessen', available: true },
      
      // Stuttgart
      { prefix: '70', region: 'Baden-Württemberg', available: true },
      
      // Default: most other areas have limited or no online availability
    ]

    // Check if PLZ matches any known available region
    const plzPrefix = plz.substring(0, 2)
    const matchedRegion = availableRegions.find(region => plzPrefix === region.prefix)
    
    let result: EterminserviceResult

    if (matchedRegion) {
      result = {
        plz,
        available: true,
        region: matchedRegion.region,
        radius: '20km',
        message: 'Online-Terminbuchung möglicherweise verfügbar in deiner Region'
      }
    } else {
      result = {
        plz,
        available: false,
        region: 'Deutschland',
        message: 'Online-Service für deine PLZ vermutlich nicht verfügbar - bitte ruf 116 117 an'
      }
    }

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      expires: Date.now() + CACHE_DURATION
    })

    return result

  } catch (error) {
    console.error('Error processing eterminservice availability:', error)
    
    // Return a user-friendly fallback
    const fallbackResult: EterminserviceResult = {
      plz,
      available: false,
      message: 'Der Online-Service ist für deine PLZ leider nicht verfügbar - bitte ruf 116 117 an'
    }

    return fallbackResult
  }
})