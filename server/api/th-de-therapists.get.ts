import { load } from 'cheerio'
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
  email?: string
  hasHeilpr?: boolean
}

interface TherapistSearchResult {
  plz: string
  totalResults: number
  radius: number
  therapists: TherapistData[]
}

// Simple in-memory cache with expiration
const cache = new Map<string, { data: TherapistSearchResult; expires: number }>()
const profileCache = new Map<string, { email?: string; hasHeilpr?: boolean; expires: number }>()
const CACHE_DURATION = 120 * 60 * 1000 // 120 minutes
const PROFILE_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Function to fetch single profile
async function fetchSingleProfile(profileUrl: string): Promise<{ success: boolean; data?: { email?: string; hasHeilpr?: boolean } }> {
  // Check profile cache first
  const cachedProfile = profileCache.get(profileUrl)
  if (cachedProfile && Date.now() < cachedProfile.expires) {
    return { success: true, data: cachedProfile }
  }

  try {
    const profileData = await extractProfileData(profileUrl)
    
    // Cache the profile data
    profileCache.set(profileUrl, {
      ...profileData,
      expires: Date.now() + PROFILE_CACHE_DURATION
    })
    
    return { success: true, data: profileData }
  } catch (error) {
    console.error('Error fetching single profile:', error)
    return { success: false }
  }
}

// Function to extract email and heilpr info from profile page
async function extractProfileData(profileUrl: string): Promise<{ email?: string; hasHeilpr?: boolean }> {
  try {
    const response = await $fetch<string>(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const $ = load(response)
    
    // Extract email from the contact button's data attribute
    const emailData = $('#contact-button').attr('data-contact-email')
    let email: string | undefined
    
    if (emailData) {
      // Decode the email (it's ROT25/shift-1 encoded with character substitutions)
      let decoded = emailData.replace(/[a-zA-Z]/g, (char) => {
        const start = char <= 'Z' ? 65 : 97
        return String.fromCharCode(((char.charCodeAt(0) - start + 25) % 26) + start)
      })
      
      // Apply character substitutions
      decoded = decoded.replace(/Z/g, '@')  // A -> @
      decoded = decoded.replace(/\./g, '-')  // . -> -
      decoded = decoded.replace(/\//g, '.')  // / -> .
      
      email = decoded
    }
    
    // Check for heilpr in the entire page content
    const fullPageText = $.html().toLowerCase()
    const hasHeilpr = fullPageText.includes('heilpr')
    
    return { email, hasHeilpr }
  } catch (error) {
    console.error(`Error extracting profile data from ${profileUrl}:`, error)
    return { hasHeilpr: false }
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
  const specialization = query.specialization as string
  const maxDistance = query.maxDistance ? parseFloat(query.maxDistance as string) : null
  const therapyType = query.therapyType as string
  const gender = query.gender as string
  const problem = query.problem as string
  const ageGroup = query.ageGroup as string
  const billing = query.billing as string
  const freePlaces = query.freePlaces as string
  const profileUrl = query.profileUrl as string

  // Handle single profile fetching
  if (profileUrl) {
    return await fetchSingleProfile(profileUrl)
  }

  if (!plz) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PLZ parameter is required'
    })
  }

  // Create cache key based on filters
  const cacheKey = `${plz}-${specialization || ''}-${maxDistance || ''}-${therapyType || ''}-${gender || ''}-${problem || ''}-${ageGroup || ''}-${billing || ''}-${freePlaces || ''}`
  
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    console.log(`✅ Cache hit for: ${cacheKey.substring(0, 50)}...`)
    return cached.data
  }
  
  console.log(`🔄 Cache miss, fetching from therapie.de for: ${cacheKey.substring(0, 50)}...`)

  try {
    // Fetch first 5 pages to get more comprehensive results
    const pages = [1, 2, 3, 4, 5]
    const allTherapists: TherapistData[] = []
    let totalResults = 0
    let radius = 10
    let extractedPlz = plz

    for (const page of pages) {
      // Construct the URL for therapie.de with all filter parameters
      const params = new URLSearchParams()
      params.set('ort', plz)
      
      if (page > 1) {
        params.set('page', page.toString())
      }
      
      if (gender) {
        params.set('geschlecht', gender)
      }
      
      if (billing) {
        params.set('abrechnungsverfahren', billing)
      }
      
      if (freePlaces) {
        params.set('terminzeitraum', freePlaces)
      }
      
      // Add therapy offering parameter for KJP
      if (ageGroup === 'kjp') {
        params.set('therapieangebot', '4') // Therapie für Kinder und Jugendliche
      }
      
      // Add more parameters as needed for other filters
      if (therapyType) {
        // Map therapy types to therapie.de parameters if needed
        // This might need specific parameter names from therapie.de
      }
      
      const url = `https://www.therapie.de/therapeutensuche/ergebnisse/?${params.toString()}`
      
      // Debug: Log the constructed URL
      console.log(`Fetching URL: ${url}`)
    
      // Fetch the HTML content
      const response = await $fetch<string>(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      // Parse HTML with Cheerio
      const $ = load(response)

      // Extract metadata (only on first page)
      if (page === 1) {
        const plzText = $('h1').text().trim()
        const subheaderText = $('.subheader').text().trim()
        
        // Extract PLZ from title
        const plzMatch = plzText.match(/PLZ (\d+):/)
        extractedPlz = plzMatch ? plzMatch[1] : plz

        // Extract total results and radius
        const resultsMatch = subheaderText.match(/(\d+)\s+Treffer\s+im\s+Umkreis\s+von\s+(\d+)/)
        totalResults = resultsMatch ? parseInt(resultsMatch[1]) : 0
        radius = resultsMatch ? parseInt(resultsMatch[2]) : 10
      }

      // Extract therapist data from this page
      const pageTherapists: TherapistData[] = []
    
      $('.search-results-list li').each((index, element) => {
        const $li = $(element)
        const $link = $li.find('a').first()
        
        if (!$link.length) return
        
        const profileUrl = $link.attr('href') || ''
        const id = profileUrl.replace(/^\/profil\//, '').replace(/\/$/, '')
        
        const name = $li.find('.search-results-name').text().trim()
        const addressText = $li.find('.search-results-address').html() || ''
        
        // Split address by <br> tags and clean up
        const addressParts = addressText
          .split('<br>')
          .map(part => part.replace(/<[^>]*>/g, '').trim())
          .filter(part => part.length > 0)
        
        const qualification = addressParts[0] || ''
        const addressLine = addressParts[1] || ''
        
        // Extract phone number from address line
        const phoneMatch = addressLine.match(/,\s*([0-9\/\-\+\s]+)$/)
        const phone = phoneMatch ? phoneMatch[1].trim() : ''
        const address = phoneMatch ? addressLine.replace(/,\s*[0-9\/\-\+\s]+$/, '') : addressLine
        
        const distanceText = $li.find('.search-results-distance').text().trim()
        const distance = parseFloat(distanceText.replace('km', '')) || 0
        
        // Get image URL
        const $img = $li.find('.search-results-thumbnail img')
        const imageSrc = $img.attr('src') || $img.attr('srcset')?.split(' ')[0]
        const image = imageSrc && !imageSrc.includes('default_small.png') ? 
          `https://www.therapie.de${imageSrc}` : undefined

        // Filter out Heilpraktiker entries
        const fullText = `${name} ${qualification} ${address}`.toLowerCase()
        if (fullText.includes('heilpr')) {
          return // Skip this entry
        }

        // Apply additional filters
        if (specialization && !fullText.includes(specialization.toLowerCase())) {
          return // Skip if doesn't match specialization
        }

        if (maxDistance && distance > maxDistance) {
          return // Skip if too far
        }

        if (therapyType) {
          const therapyTypeMap: Record<string, string[]> = {
            'verhaltenstherapie': ['verhaltenstherapie', 'kognitive'],
            'tiefenpsychologie': ['tiefenpsychologie', 'psychodynamisch', 'psychoanalyse'],
            'systemisch': ['systemisch', 'familientherapie'],
            'kinder': ['kinder', 'jugend'],
          }
          
          const searchTerms = therapyTypeMap[therapyType.toLowerCase()] || [therapyType.toLowerCase()]
          const hasMatch = searchTerms.some(term => fullText.includes(term))
          
          if (!hasMatch) {
            return // Skip if doesn't match therapy type
          }
        }

        pageTherapists.push({
          id,
          name,
          qualification,
          address,
          phone,
          distance,
          profileUrl: `https://www.therapie.de${profileUrl}`,
          image
        })
      })

      // Add this page's therapists to the total, avoiding duplicates
      pageTherapists.forEach(therapist => {
        if (!allTherapists.find(existing => existing.id === therapist.id)) {
          allTherapists.push(therapist)
        }
      })

      // If this page has no results, stop fetching more pages
      if (pageTherapists.length === 0) {
        break
      }
    }

    // Sort therapists by distance
    allTherapists.sort((a, b) => a.distance - b.distance)

    // Fetch profile data for first 3 therapists
    const therapistsWithProfile = await Promise.all(
      allTherapists.slice(0, 3).map(async (therapist) => {
        // Check profile cache first
        const cached = profileCache.get(therapist.id)
        if (cached && Date.now() < cached.expires) {
          return {
            ...therapist,
            email: cached.email,
            hasHeilpr: cached.hasHeilpr
          }
        }

        // Fetch profile data
        const profileData = await extractProfileData(therapist.profileUrl)
        
        // Cache the result
        profileCache.set(therapist.id, {
          ...profileData,
          expires: Date.now() + PROFILE_CACHE_DURATION
        })

        return {
          ...therapist,
          email: profileData.email,
          hasHeilpr: profileData.hasHeilpr
        }
      })
    )

    // Combine enhanced therapists with the rest
    const finalTherapists = [
      ...therapistsWithProfile,
      ...allTherapists.slice(3)
    ]

    const result: TherapistSearchResult = {
      plz: extractedPlz,
      totalResults,
      radius,
      therapists: finalTherapists
    }

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      expires: Date.now() + CACHE_DURATION
    })

    return result

  } catch (error) {
    console.error('Error fetching therapist data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch therapist data'
    })
  }
})