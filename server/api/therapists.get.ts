// Unified Therapists API Adapter
// Combines results from therapie.de and TK-Ärzte and provides health checks

import { securityMiddleware } from '../utils/rateLimiter'

interface TherapistData {
  id: string
  name: string
  qualification: string
  address: string
  phone: string
  distance: number
  profileUrl: string
  image?: string
  source?: 'therapie.de' | 'tk'
}

interface TherapistSearchResult {
  plz: string
  totalResults: number
  radius: number
  therapists: TherapistData[]
  sources: {
    'therapie.de': { status: 'success' | 'error' | 'timeout'; results: number; error?: string }
    'tk': { status: 'success' | 'error' | 'timeout'; results: number; error?: string }
  }
}

// Simple in-memory cache with expiration
const cache = new Map<string, { data: TherapistSearchResult; expires: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  )
  
  return Promise.race([promise, timeoutPromise])
}

async function callTherapieDeApi(query: Record<string, any>): Promise<{ status: 'success' | 'error' | 'timeout'; data?: any; error?: string; results: number }> {
  try {
    console.log('📞 Calling therapie.de API...')
    const response = await fetchWithTimeout(
      $fetch('/api/th-de-therapists', { query }),
      15000
    )
    
    const results = response?.therapists?.length || 0
    console.log(`✅ therapie.de API success: ${results} results`)
    return { status: 'success', data: response, results }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ therapie.de API failed:', errorMessage)
    
    if (errorMessage.includes('timeout')) {
      return { status: 'timeout', error: errorMessage, results: 0 }
    }
    return { status: 'error', error: errorMessage, results: 0 }
  }
}

async function callTkApi(query: Record<string, any>): Promise<{ status: 'success' | 'error' | 'timeout'; data?: any; error?: string; results: number }> {
  try {
    console.log('📞 Calling TK API...')
    const tkQuery = { ...query, compatible: 'true' }
    const response = await fetchWithTimeout(
      $fetch('/api/tk-therapists', { query: tkQuery }),
      15000
    )
    
    const results = response?.therapists?.length || 0
    console.log(`✅ TK API success: ${results} results`)
    return { status: 'success', data: response, results }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ TK API failed:', errorMessage)
    
    if (errorMessage.includes('timeout')) {
      return { status: 'timeout', error: errorMessage, results: 0 }
    }
    return { status: 'error', error: errorMessage, results: 0 }
  }
}

function combineResults(
  therapieDeResult: { status: string; data?: any; results: number; error?: string },
  tkResult: { status: string; data?: any; results: number; error?: string },
  plz: string
): TherapistSearchResult {
  const combinedTherapists: TherapistData[] = []
  let totalResults = 0
  let radius = 10

  // Add therapie.de results
  if (therapieDeResult.status === 'success' && therapieDeResult.data) {
    const therapieDeTherapists = therapieDeResult.data.therapists || []
    therapieDeTherapists.forEach((therapist: any) => {
      combinedTherapists.push({
        ...therapist,
        source: 'therapie.de' as const
      })
    })
    totalResults += therapieDeResult.data.totalResults || 0
    radius = therapieDeResult.data.radius || radius
  }

  // Add TK results
  if (tkResult.status === 'success' && tkResult.data) {
    const tkTherapists = tkResult.data.therapists || []
    tkTherapists.forEach((therapist: any) => {
      // Check for duplicates based on name and address similarity
      const isDuplicate = combinedTherapists.some(existing => {
        const nameMatch = existing.name.toLowerCase().includes(therapist.name.toLowerCase()) ||
                         therapist.name.toLowerCase().includes(existing.name.toLowerCase())
        const addressMatch = existing.address.toLowerCase() === therapist.address.toLowerCase()
        return nameMatch && addressMatch
      })

      if (!isDuplicate) {
        combinedTherapists.push({
          ...therapist,
          source: 'tk' as const
        })
      }
    })
    totalResults += tkResult.data.totalResults || 0
  }

  // Sort by distance
  combinedTherapists.sort((a, b) => a.distance - b.distance)

  return {
    plz,
    totalResults,
    radius,
    therapists: combinedTherapists,
    sources: {
      'therapie.de': {
        status: therapieDeResult.status as 'success' | 'error' | 'timeout',
        results: therapieDeResult.results,
        error: therapieDeResult.error
      },
      'tk': {
        status: tkResult.status as 'success' | 'error' | 'timeout',
        results: tkResult.results,
        error: tkResult.error
      }
    }
  }
}

export default defineEventHandler(async (event): Promise<TherapistSearchResult> => {
  // Apply security middleware
  const securityCheck = securityMiddleware(event)
  if (!securityCheck.allowed) {
    throw createError({
      statusCode: securityCheck.status || 403,
      statusMessage: securityCheck.error || 'Access denied',
      data: securityCheck.retryAfter ? { retryAfter: securityCheck.retryAfter } : undefined
    })
  }

  const query = getQuery(event)
  const plz = query.plz as string

  if (!plz) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PLZ parameter is required'
    })
  }

  // Create cache key based on all query parameters
  const cacheKey = JSON.stringify(query)
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    console.log(`✅ Unified cache hit for PLZ: ${plz}`)
    return cached.data
  }
  
  console.log(`🔄 Unified cache miss, fetching from both APIs for PLZ: ${plz}`)

  // Call both APIs in parallel
  // Skip TK API entirely when freePlaces is enabled (TK doesn't support this parameter)
  const shouldCallTkApi = !query.freePlaces || query.freePlaces === null || query.freePlaces === undefined
  
  const tkQuery = { ...query }
  delete tkQuery.freePlaces
  
  const [therapieDeResult, tkResult] = await Promise.all([
    callTherapieDeApi(query),
    shouldCallTkApi ? callTkApi(tkQuery) : Promise.resolve({ status: 'success', data: null, results: 0 })
  ])

  // Check if at least one API succeeded
  const hasResults = therapieDeResult.status === 'success' || tkResult.status === 'success'
  
  if (!hasResults) {
    console.error('❌ Both APIs failed')
    throw createError({
      statusCode: 503,
      statusMessage: 'All therapist APIs are currently unavailable'
    })
  }

  // Combine results from both sources
  const result = combineResults(therapieDeResult, tkResult, plz)

  // Log summary
  console.log(`📊 Combined results for PLZ ${plz}:`)
  console.log(`   therapie.de: ${therapieDeResult.status} (${therapieDeResult.results} results)`)
  console.log(`   TK: ${tkResult.status} (${tkResult.results} results)`)
  console.log(`   Combined: ${result.therapists.length} unique therapists`)

  // Cache the result
  cache.set(cacheKey, {
    data: result,
    expires: Date.now() + CACHE_DURATION
  })

  return result
})