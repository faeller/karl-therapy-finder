import { load } from 'cheerio'

interface TherapistData {
  id: string
  name: string
  qualification: string
  address: string
  phone: string
  distance: number
  profileUrl: string
  image?: string
}

interface TherapistSearchResult {
  plz: string
  totalResults: number
  radius: number
  therapists: TherapistData[]
}

export default defineEventHandler(async (event): Promise<TherapistSearchResult> => {
  const query = getQuery(event)
  const plz = query.plz as string
  const page = query.page ? parseInt(query.page as string) : 1
  const specialization = query.specialization as string
  const maxDistance = query.maxDistance ? parseFloat(query.maxDistance as string) : null
  const therapyType = query.therapyType as string

  if (!plz) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PLZ parameter is required'
    })
  }

  try {
    // Construct the URL for therapie.de
    const url = `https://www.therapie.de/therapeutensuche/ergebnisse/?ort=${plz}${page > 1 ? `&page=${page}` : ''}`
    
    // Fetch the HTML content
    const response = await $fetch<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    // Parse HTML with Cheerio
    const $ = load(response)

    // Extract metadata
    const plzText = $('h1').text().trim()
    const subheaderText = $('.subheader').text().trim()
    
    // Extract PLZ from title
    const plzMatch = plzText.match(/PLZ (\d+):/)
    const extractedPlz = plzMatch ? plzMatch[1] : plz

    // Extract total results and radius
    const resultsMatch = subheaderText.match(/(\d+)\s+Treffer\s+im\s+Umkreis\s+von\s+(\d+)/)
    const totalResults = resultsMatch ? parseInt(resultsMatch[1]) : 0
    const radius = resultsMatch ? parseInt(resultsMatch[2]) : 10

    // Extract therapist data
    const therapists: TherapistData[] = []
    
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

      therapists.push({
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

    return {
      plz: extractedPlz,
      totalResults,
      radius,
      therapists
    }

  } catch (error) {
    console.error('Error fetching therapist data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch therapist data'
    })
  }
})