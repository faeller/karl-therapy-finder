import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { load } from 'cheerio';

interface TherapistData {
	id: string;
	name: string;
	qualification: string;
	address: string;
	phone?: string;
	email?: string;
	distance: number;
	profileUrl: string;
	gender?: 'w' | 'm' | 'd';
}

interface SearchResult {
	plz: string;
	totalResults: number;
	radius: number;
	therapists: TherapistData[];
}

// fallback in-memory cache for local dev
const memCache = new Map<string, { data: SearchResult; expires: number }>();
const CACHE_TTL_SECONDS = 3 * 60 * 60; // 3 hours

// tk api parameter maps
const billingMap: Record<string, string> = {
	GKV: '127',
	PKV: '22',
	Selbstzahler: '22'
};

const genderMap: Record<string, string> = {
	w: '2',
	m: '1'
};

function cleanTherapistName(name: string): string {
	if (!name) return '';
	let cleaned = name.replace(/\s+/g, ' ').trim();
	// remove practice prefixes before Frau/Herr
	cleaned = cleaned.replace(/^.*?(?=Frau\s|Herr\s)/, '');
	return cleaned.trim();
}

function cleanPhoneNumber(phone: string): string {
	if (!phone) return '';
	let cleaned = phone.replace(/Telefon:\s*/g, '').replace(/Telefax:\s*/g, '').replace(/\s+/g, ' ').trim();

	// extract first phone number pattern
	const match = cleaned.match(/(\d{3,4})\s*\/?\s*([\d\s]+)/);
	if (match) {
		const areaCode = match[1];
		const number = match[2].replace(/\s/g, '');
		return `${areaCode} / ${number}`;
	}

	return cleaned;
}

function inferGender(name: string): 'w' | 'm' | undefined {
	if (name.includes('Frau ')) return 'w';
	if (name.includes('Herr ')) return 'm';
	return undefined;
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const plz = url.searchParams.get('plz');
	const billing = url.searchParams.get('billing') || 'GKV';
	const gender = url.searchParams.get('gender');
	const ageGroup = url.searchParams.get('ageGroup'); // 'adult' or 'kjp'

	if (!plz || !/^\d{5}$/.test(plz)) {
		throw error(400, 'Valid 5-digit PLZ required');
	}

	const cacheKey = `therapists:${plz}-${billing}-${gender || ''}-${ageGroup || ''}`;
	const kv = platform?.env?.THERAPIST_CACHE;

	// try KV cache first, fall back to memory cache
	if (kv) {
		const cached = await kv.get(cacheKey, 'json');
		if (cached) return json(cached);
	} else {
		const cached = memCache.get(cacheKey);
		if (cached && Date.now() < cached.expires) return json(cached.data);
	}

	try {
		// build tk url
		const specialization = ageGroup === 'kjp'
			? 'Kinder-%2FJugendpsychiatrie+und+-psychotherapie'
			: 'Psychologischer+Psychotherapeut%2FPsychotherapeutin';

		const specializationEncoded = ageGroup === 'kjp'
			? 'CatId1%3A%3AKinder-%2FJugendpsychiatrie+und+-psychotherapie%3A%3A17%3B'
			: 'CatId1%3A%3APsychologischer+Psychotherapeut%2FPsychotherapeutin%3A%3A1086%3B';

		const params = new URLSearchParams({
			a: 'DL',
			Db: '1',
			Ftg: plz,
			Ft: specialization,
			Ft_e: specializationEncoded,
			ic1: billingMap[billing] || '127'
		});

		if (gender && genderMap[gender]) {
			params.set('Sl', genderMap[gender]);
		}

		const tkUrl = `https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?${params.toString()}`;

		const response = await fetch(tkUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
				'Referer': 'https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?a=FSS'
			}
		});

		if (!response.ok) {
			throw error(502, 'TK API unavailable');
		}

		const html = await response.text();
		const $ = load(html);

		// extract metadata
		const metaText = $('div.col-lg-7 > p').first().text().trim();
		const metaMatch = metaText.match(/(\d+)\s+Ergebnisse\s+im\s+Umkreis\s+von\s+([\d,]+)\s+km/);
		const totalResults = metaMatch ? parseInt(metaMatch[1], 10) : 0;
		const searchRadius = metaMatch ? parseFloat(metaMatch[2].replace(',', '.')) : 0;

		const therapists: TherapistData[] = [];

		$('div.card.dl').each((_, element) => {
			const $card = $(element);
			if ($card.find('h3.card-title').length === 0) return;

			let therapistName = $card.find('strong > a').text().trim();
			const profileUrlRaw = $card.find('strong > a').attr('href') || '';
			const profileUrl = new URL(profileUrlRaw, 'https://www.tk-aerztefuehrer.de').toString();
			const idMatch = profileUrl.match(/e_id=(\d+)/);
			const id = idMatch ? idMatch[1] : `fallback-${therapists.length}`;
			const qualification = $card.find('span[style*="color:#666"]').text().trim().replace(/\s+/g, ' ');
			const distanceText = $card.find('div:contains("km")').last().text().trim();
			const distanceMatch = distanceText.match(/([\d,]+)\s+km/);
			const distance = distanceMatch ? parseFloat(distanceMatch[1].replace(',', '.')) : 0;
			let phone = $card.find('p:contains("Telefon:")').text().replace('Telefon:', '').trim() || undefined;
			const addressParts = $card.find('.col-sm-4.pt-2').contents()
				.filter((_, el) => el.type === 'text' && $(el).text().trim().length > 0)
				.map((_, el) => $(el).text().trim())
				.get()
				.slice(0, 2);
			const address = addressParts.join(', ');

			// clean data
			therapistName = cleanTherapistName(therapistName);
			phone = phone ? cleanPhoneNumber(phone) : undefined;
			const inferredGender = inferGender(therapistName);

			// skip if filtering by gender and doesn't match (or unknown)
			if (gender && inferredGender !== gender) {
				return;
			}

			therapists.push({
				id,
				name: therapistName,
				qualification,
				address,
				phone,
				distance,
				profileUrl,
				gender: inferredGender
			});
		});

		// sort by distance
		therapists.sort((a, b) => a.distance - b.distance);

		const result: SearchResult = {
			plz,
			totalResults,
			radius: searchRadius,
			therapists
		};

		// cache result
		if (kv) {
			await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL_SECONDS });
		} else {
			memCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL_SECONDS * 1000 });
		}

		return json(result);
	} catch (e) {
		console.error('Error fetching therapists:', e);
		throw error(500, 'Failed to fetch therapist data');
	}
};
