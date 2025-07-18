// Unified Therapists API Adapter
// Combines results from therapie.de and TK-Ärzte and provides health checks

import { securityMiddleware } from '../utils/rateLimiter'
import { therapistCache } from '../utils/kvCache'

interface TherapistData {
  id: string
  name: string
  qualification: string
  address: string
  phone: string
  distance: number
  profileUrl: string
  image?: string
  email?: string
  hasHeilpr?: boolean
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

// Cache configuration
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 hours

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
    // Use tkSpecialization if provided, otherwise default to 'psychotherapeut'
    if (query.tkSpecialization) {
      tkQuery.specialization = query.tkSpecialization
    }
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
  plz: string,
  query: Record<string, any>
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
        source: 'therapie.de' as const,
        // Preserve email and hasHeilpr fields from therapie.de
        email: therapist.email,
        hasHeilpr: therapist.hasHeilpr
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

  // Filter out inappropriate entries for adult therapy
  let filteredTherapists = combinedTherapists
  
  // If searching for adult therapy (not KJP), filter out "Kinder" entries that don't have "Psychologische(r) Psychotherapeut"
  if (query.ageGroup !== 'kjp' && query.tkSpecialization !== 'kjp') {
    console.log('🔍 Filtering for adult therapy, checking for inappropriate child therapists...')
    filteredTherapists = combinedTherapists.filter(therapist => {
      // If the qualification contains "Kinder", check if it also contains "Psychologische(r) Psychotherapeut"
      if (therapist.qualification && therapist.qualification.toLowerCase().includes('kinder')) {
        console.log(`📋 Found therapist with "Kinder" in qualification: ${therapist.name} - ${therapist.qualification}`)
        const hasValidQualification = therapist.qualification.toLowerCase().includes('psychologische') ||
                                     therapist.qualification.toLowerCase().includes('psychologischer')
        console.log(`   - Valid for adults: ${hasValidQualification}`)
        return hasValidQualification
      }
      return true // Keep all other entries
    })
    console.log(`🔍 Filtered ${combinedTherapists.length} down to ${filteredTherapists.length} therapists`)
  }

  // Sort by distance
  filteredTherapists.sort((a, b) => a.distance - b.distance)

  return {
    plz,
    totalResults: filteredTherapists.length, // Update total to reflect filtered count
    radius,
    therapists: filteredTherapists,
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
  const cached = await therapistCache.get<TherapistSearchResult>(cacheKey)
  if (cached) {
    console.log(`✅ Unified KV cache hit for PLZ: ${plz}`)
    return cached
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
  const result = combineResults(therapieDeResult, tkResult, plz, query)

  // Log summary
  console.log(`📊 Combined results for PLZ ${plz}:`)
  console.log(`   therapie.de: ${therapieDeResult.status} (${therapieDeResult.results} results)`)
  console.log(`   TK: ${tkResult.status} (${tkResult.results} results)`)
  console.log(`   Combined: ${result.therapists.length} unique therapists`)

  // Cache the result in KV
  await therapistCache.set(cacheKey, result, CACHE_DURATION)

  return result
})