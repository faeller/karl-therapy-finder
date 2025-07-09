import { load } from 'cheerio'
import { securityMiddleware } from '../utils/rateLimiter'

// --- NATIVE INTERFACES (Default output of this service) ---
interface TKTherapistData {
  id: string; practiceName: string; therapistName: string; qualification: string;
  address: string; phone?: string; distance: number; openingStatus: string; profileUrl: string;
}
interface TKTherapistSearchResult {
  searchLocation: string; totalResults: number; searchRadius: number;
  therapists: TKTherapistData[];
}


// --- TARGET INTERFACES (For compatibility mode, copied from therapie.de service) ---
interface TherapieDeCompatData {
  id: string; name: string; qualification: string; address: string; phone: string;
  distance: number; profileUrl: string; image?: string;
}
interface TherapieDeCompatSearchResult {
  plz: string; totalResults: number; radius: number;
  therapists: TherapieDeCompatData[];
}


// --- CACHING ---
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_DURATION = 120 * 60 * 1000 // 120 minutes


// --- MAPPER FUNCTION ---
/**
 * Transforms the native TK search result into the therapie.de compatible format.
 * @param tkResult The original search result from the TK scraper.
 * @returns An object matching the structure of the therapie.de API.
 */
function mapToTherapieDeFormat(tkResult: TKTherapistSearchResult): TherapieDeCompatSearchResult {
  const compatibleTherapists = tkResult.therapists.map(tkTherapist => ({
    id: tkTherapist.id,
    name: tkTherapist.therapistName, // Map therapistName -> name
    qualification: tkTherapist.qualification,
    address: tkTherapist.address,
    phone: tkTherapist.phone || '', // Ensure phone is always a string
    distance: tkTherapist.distance,
    profileUrl: tkTherapist.profileUrl,
    image: undefined // TK does not provide images
  }));

  return {
    plz: tkResult.searchLocation, // Map searchLocation -> plz
    totalResults: tkResult.totalResults,
    radius: tkResult.searchRadius, // Map searchRadius -> radius
    therapists: compatibleTherapists
  };
}


// --- HELPER MAPS for URL construction ---
const specializationMap: Record<string, { Ft: string; Ft_e: string }> = {};
const billingMap: Record<string, string> = {};

specializationMap['psychotherapeut'] = { 
  Ft: 'Psychologischer+Psychotherapeut%2FPsychotherapeutin', 
  Ft_e: 'CatId1%3A%3APsychologischer+Psychotherapeut%2FPsychotherapeutin%3A%3A1086%3B' 
};

// KJP specialization
specializationMap['kjp'] = { 
  Ft: 'Kinder-%2FJugendpsychiatrie+und+-psychotherapie', 
  Ft_e: 'CatId1%3A%3AKinder-%2FJugendpsychiatrie+und+-psychotherapie%3A%3A17%3B' 
};

// Add billing options including Privat/Selbstzahler
billingMap['gesetzlich'] = '127';  // TK and other statutory insurance
billingMap['privat'] = '22';       // Private insurance
billingMap['selbstzahler'] = '22'; // Self-payers (same as privat in TK system)
billingMap['tk'] = '127';          // Backwards compatibility

// Frontend billing code mapping (from therapie.de format)
billingMap['7'] = '127';  // Gesetzliche Krankenversicherung -> statutory insurance
billingMap['8'] = '22';   // Private Krankenversicherung -> private insurance
billingMap['9'] = '22';   // Selbstzahler -> self-payers (same as private in TK)

// Gender mapping for TK API
const genderMap: Record<string, string> = {};
genderMap['weiblich'] = '2';     // Female (German)
genderMap['männlich'] = '1';     // Male (German)  
genderMap['w'] = '2';            // Female (short form)
genderMap['m'] = '1';            // Male (short form)
genderMap['2'] = '2';            // Female (frontend sends this)
genderMap['1'] = '1';            // Male (frontend sends this)
// No mapping for 'egal' or null - omit Sl parameter for all genders


// --- HELPER FUNCTIONS FOR CLEANING DATA ---
function cleanTherapistName(name: string): string {
  if (!name) return '';
  
  // Remove practice names that are concatenated with therapist names
  let cleaned = name.replace(/\s+/g, ' ').trim();
  
  // Remove practice prefixes before Frau/Herr
  cleaned = cleaned.replace(/^.*?(?=Frau\s|Herr\s)/, '');
  
  // If no Frau/Herr found but contains common practice words, try to extract the name part
  if (!cleaned.includes('Frau ') && !cleaned.includes('Herr ')) {
    // Look for patterns like "Practice Name Title. Name" 
    const nameMatch = cleaned.match(/(?:Dr\.|Dipl\.-|Prof\.).*?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/);
    if (nameMatch) {
      cleaned = nameMatch[0];
    }
  }
  
  return cleaned.trim();
}

function cleanQualification(qualification: string): string {
  if (!qualification) return '';
  
  // Remove duplicates and fix truncated qualifications
  let cleaned = qualification.replace(/\s+/g, ' ').trim();
  
  // Fix common truncations
  if (cleaned.endsWith('Psychologische ')) {
    cleaned = 'Psychologische Psychotherapeutin';
  }
  
  // Remove duplicated parts
  cleaned = cleaned.replace(/(Psychologische?\s+Psychotherapeut(?:in)?)\1+/g, '$1');
  
  return cleaned;
}

function cleanOpeningStatus(status: string): string {
  if (!status) return '';
  
  // Remove duplicates
  const parts = status.split(/(?=Praxis\s)/);
  const unique = [...new Set(parts.filter(p => p.trim()))];
  return unique.join(' ').trim();
}

function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove "Telefon:" and "Telefax:" prefixes and clean whitespace
  let cleaned = phone.replace(/Telefon:\s*/g, '').replace(/Telefax:\s*/g, '').replace(/\s+/g, ' ').trim();
  
  // Remove duplicate phone numbers - take only the first occurrence
  if (cleaned.includes('030') && cleaned.split('030').length > 2) {
    // For Berlin numbers, extract first complete number
    const berlinMatch = cleaned.match(/030\s*\/?\s*[\d\s\/]+/);
    if (berlinMatch) {
      cleaned = berlinMatch[0];
    }
  }
  
  // Pattern 1: "0XXX / XXXXXXX" or "0XXX/XXXXXXX"
  let match = cleaned.match(/(\d{3,4})\s*\/\s*(\d[\d\s]+)/);
  if (match) {
    let areaCode = match[1];
    let number = match[2].replace(/\s/g, '');
    return `${areaCode} / ${number}`;
  }
  
  // Pattern 2: "03 0 / XXXXXXX" -> "030 / XXXXXXX"
  match = cleaned.match(/(\d{2})\s+(\d{1})\s*\/\s*(\d[\d\s]+)/);
  if (match) {
    let areaCode = match[1] + match[2];
    let number = match[3].replace(/\s/g, '');
    return `${areaCode} / ${number}`;
  }
  
  // Pattern 3: "09 11 / XXXXXXX" -> "0911 / XXXXXXX"
  match = cleaned.match(/(\d{2})\s+(\d{2})\s*\/\s*(\d[\d\s]+)/);
  if (match) {
    let areaCode = match[1] + match[2];
    let number = match[3].replace(/\s/g, '');
    return `${areaCode} / ${number}`;
  }
  
  // Pattern 4: Just digits with spaces, try to format
  match = cleaned.match(/(\d{3,4})\s+([\d\s]+)/);
  if (match) {
    let areaCode = match[1];
    let number = match[2].replace(/\s/g, '');
    if (number.length >= 6) {
      return `${areaCode} / ${number}`;
    }
  }
  
  // Fallback: return first complete number sequence
  const fallbackMatch = cleaned.match(/\d{6,}/);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
}

// --- HELPER FUNCTIONS FOR SPLITTING MULTIPLE THERAPISTS ---
function splitMultipleTherapists(therapistName: string): string[] {
  // Clean and normalize the input
  let cleanName = therapistName.replace(/\s+/g, ' ').trim();
  
  // First, extract all therapist names using a more comprehensive regex
  const therapistRegex = /(Frau|Herr)\s+([^F][^r][^a][^u][^H][^e][^r][^r]*?)(?=Frau\s|Herr\s|$)/g;
  const matches = [];
  let match;
  
  while ((match = therapistRegex.exec(cleanName)) !== null) {
    const fullName = match[0].trim();
    if (fullName && fullName.length > 5) { // Ensure it's a meaningful name
      matches.push(fullName);
    }
  }
  
  // If regex approach found names, use those
  if (matches.length > 0) {
    return matches;
  }
  
  // Fallback: try to find just the first therapist name if practice name is concatenated
  const firstTherapistMatch = cleanName.match(/(Frau|Herr)\s+[^F][^H]*?(?:\s+Dr\.|[A-Z][a-z]+).*?(?=Frau\s|Herr\s|$)/);
  if (firstTherapistMatch) {
    return [firstTherapistMatch[0].trim()];
  }
  
  // If all else fails, try to clean up obvious practice name prefixes
  const cleanedName = cleanName.replace(/^.*?(?=Frau\s|Herr\s)/, '');
  if (cleanedName && cleanedName !== cleanName) {
    return [cleanedName.trim()];
  }
  
  // Last resort: return the original name
  return [cleanName];
}

function splitMultipleQualifications(qualification: string): string[] {
  // Split qualifications - they usually repeat the same qualification
  const qualifications = qualification.split(/(?=Psychologische?\s|Psychotherapeut)/);
  return qualifications.filter(q => q.trim().length > 0);
}

function splitMultiplePhones(phone: string): string[] {
  if (!phone) return [];
  
  // Clean up the phone string
  let cleanPhone = phone.trim();
  
  // Remove duplicate phone numbers (same number repeated)
  // Pattern: "number + Telefon: + same number"
  const phoneRegex = /(\d[\d\s\/\-\+]+\d)(?:\s*Telefon:\s*\1)?/g;
  const matches = cleanPhone.match(phoneRegex);
  
  if (matches) {
    // Extract unique phone numbers
    const uniquePhones = new Set<string>();
    matches.forEach(match => {
      // Clean the match and extract the phone number
      const cleaned = match.replace(/Telefon:\s*/g, '').trim();
      if (cleaned && /\d/.test(cleaned)) {
        uniquePhones.add(cleaned);
      }
    });
    return Array.from(uniquePhones);
  }
  
  // Fallback: split by "Telefon:" and return unique numbers
  const parts = cleanPhone.split(/Telefon:\s*/);
  const phones: string[] = [];
  
  for (const part of parts) {
    const cleaned = part.trim();
    if (cleaned && cleaned !== 'Telefon:' && /\d/.test(cleaned)) {
      // Check if this phone number is already in the array
      if (!phones.some(existing => existing === cleaned)) {
        phones.push(cleaned);
      }
    }
  }
  
  return phones.length > 0 ? phones : [cleanPhone];
}


// --- API EVENT HANDLER ---
export default defineEventHandler(async (event): Promise<TKTherapistSearchResult | TherapieDeCompatSearchResult> => {
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
  const specialization = (query.specialization as string) || 'psychotherapeut'
  const billing = (query.billing as string) || 'gesetzlich'
  const gender = query.gender as string
  const maxDistance = query.maxDistance ? parseFloat(query.maxDistance as string) : null
  
  // The new compatibility parameter
  const compatible = query.compatible === 'true'

  if (!plz) {
    throw createError({ statusCode: 400, statusMessage: 'PLZ parameter is required' })
  }

  // Add the compatibility flag to the cache key to store different versions
  const cacheKey = `tk-${plz}-${specialization}-${billing}-${gender || ''}-${maxDistance || ''}-${compatible ? 'compat' : 'native'}`

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    console.log(`✅ TK Cache hit for: ${cacheKey.substring(0, 70)}...`)
    return cached.data
  }

  console.log(`🔄 TK Cache miss, fetching from tk-aerztefuehrer.de...`)

  try {
    const selectedSpecialization = specializationMap[specialization];
    const selectedBilling = billingMap[billing];
    const selectedGender = gender ? genderMap[gender] : undefined;
    
    if (!selectedSpecialization || !selectedBilling) {
       throw createError({ statusCode: 400, statusMessage: 'Invalid specialization or billing type.' })
    }

    // Construct URL based on billing type
    let url: string;
    const isPrivateBilling = billing === 'privat' || billing === 'selbstzahler' || billing === '8' || billing === '9';
    if (isPrivateBilling) {
      // Use the Privat URL format you provided
      const params = new URLSearchParams({
        a: 'DL',
        Ft: selectedSpecialization.Ft,
        Ft_e: selectedSpecialization.Ft_e,
        Ftg: plz,
        Ftg_e: `CatId10%3A%3A${plz}%3A%3A49.455554758963%3A%3A11.0795135645595%3B`, // This would need proper geocoding
        Sl: selectedGender || '',
        Lng: '',
        Otn1: '',
        ic1: selectedBilling,
        Stf: '',
        Stt: '',
        tkc_world: '',
        Sid: '',
        Db: '1'
      });
      url = `https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?${params.toString()}`;
    } else {
      // Use standard URL format for statutory insurance
      const params = new URLSearchParams({ 
        a: 'DL', 
        Db: '1', 
        Ftg: plz, 
        Ft: selectedSpecialization.Ft, 
        Ft_e: selectedSpecialization.Ft_e, 
        ic1: selectedBilling 
      });
      
      // Add gender parameter if specified
      if (selectedGender) {
        params.set('Sl', selectedGender);
      }
      
      url = `https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?${params.toString()}`;
    }
    
    console.log(`Fetching TK URL: ${url}`)
    const response = await $fetch<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Referer': 'https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?a=FSS'
      }
    })

    const $ = load(response)
    
    const metaText = $('div.col-lg-7 > p').first().text().trim()
    const metaMatch = metaText.match(/(\d+)\s+Ergebnisse\s+im\s+Umkreis\s+von\s+([\d,]+)\s+km/)
    const totalResults = metaMatch ? parseInt(metaMatch[1], 10) : 0
    const searchRadius = metaMatch ? parseFloat(metaMatch[2].replace(',', '.')) : 0

    let therapists: TKTherapistData[] = []
    $('div.card.dl').each((_, element) => {
      const $card = $(element);
      if ($card.find('h3.card-title').length === 0) return;
      
      const practiceName = $card.find('h3.card-title').text().trim();
      let therapistName = $card.find('strong > a').text().trim();
      const profileUrlRaw = $card.find('strong > a').attr('href') || '';
      const profileUrl = new URL(profileUrlRaw, 'https://www.tk-aerztefuehrer.de').toString();
      const idMatch = profileUrl.match(/e_id=(\d+)/);
      const baseId = idMatch ? idMatch[1] : `fallback-${therapists.length}`;
      let qualification = $card.find('span[style*="color:#666"]').text().trim();
      let openingStatus = $card.find('div[style*="font-weight:600"]').text().trim();
      const distanceText = $card.find('div:contains("km")').last().text().trim();
      const distanceMatch = distanceText.match(/([\d,]+)\s+km/);
      const distance = distanceMatch ? parseFloat(distanceMatch[1].replace(',', '.')) : 0;
      let phone = $card.find('p:contains("Telefon:")').text().replace('Telefon:', '').trim() || undefined;
      const addressParts = $card.find('.col-sm-4.pt-2').contents().filter((_, el) => el.type === 'text' && $(el).text().trim().length > 0).map((_, el) => $(el).text().trim()).get().slice(0, 2);
      const address = addressParts.join(', ');

      // Clean up common issues before processing
      therapistName = cleanTherapistName(therapistName);
      qualification = cleanQualification(qualification);
      openingStatus = cleanOpeningStatus(openingStatus);
      phone = cleanPhoneNumber(phone || '');

      // Check for multiple therapists in one entry (after cleaning)
      const frauCount = (therapistName.match(/Frau /g) || []).length;
      const herrCount = (therapistName.match(/Herr /g) || []).length;
      const totalGenderPrefixes = frauCount + herrCount;
      const hasMultipleNames = totalGenderPrefixes > 1;
      
      if (hasMultipleNames) {
        // Split multiple therapists into separate entries
        const names = splitMultipleTherapists(therapistName);
        const qualifications = splitMultipleQualifications(qualification);
        const phones = splitMultiplePhones(phone || '');
        
        names.forEach((name, index) => {
          therapists.push({
            id: `${baseId}-${index + 1}`,
            practiceName,
            therapistName: name,
            qualification: qualifications[index] || qualifications[0] || qualification,
            address,
            phone: phones[index] || phones[0] || phone,
            distance,
            openingStatus,
            profileUrl
          });
        });
      } else {
        // Single therapist entry - ensure phone is properly handled
        const finalPhone = phone || undefined;
        therapists.push({ 
          id: baseId, 
          practiceName, 
          therapistName, 
          qualification, 
          address, 
          phone: finalPhone, 
          distance, 
          openingStatus, 
          profileUrl 
        });
      }
    })

    if (maxDistance !== null) {
      therapists = therapists.filter(t => t.distance <= maxDistance)
    }
    
    // This is our native result - update totalResults to reflect actual therapist count after splitting
    const nativeResult: TKTherapistSearchResult = {
      searchLocation: plz, 
      totalResults: therapists.length, // Use actual count after splitting multiple therapists
      searchRadius, 
      therapists
    }

    // --- THE IMPORTANT PART: CHECK THE FLAG AND TRANSFORM IF NEEDED ---
    if (compatible) {
      const compatibleResult = mapToTherapieDeFormat(nativeResult);
      cache.set(cacheKey, { data: compatibleResult, expires: Date.now() + CACHE_DURATION })
      return compatibleResult;
    } else {
      cache.set(cacheKey, { data: nativeResult, expires: Date.now() + CACHE_DURATION })
      return nativeResult;
    }

  } catch (error) {
    console.error('Error fetching TK therapist data:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch TK therapist data' })
  }
})