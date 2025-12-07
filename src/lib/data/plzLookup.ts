// German postal code to city lookup
// Expandable as we add more coverage

export const plzLookup: Record<string, string> = {
	// Nürnberg
	'90402': 'Nürnberg',
	'90403': 'Nürnberg',
	'90419': 'Nürnberg',
	'90429': 'Nürnberg',
	'90491': 'Nürnberg',
	// Berlin
	'10115': 'Berlin',
	'10178': 'Berlin',
	'10247': 'Berlin',
	'10435': 'Berlin',
	'10999': 'Berlin',
	// München
	'80331': 'München',
	'80333': 'München',
	'80469': 'München',
	'80539': 'München',
	// Köln
	'50667': 'Köln',
	'50668': 'Köln',
	'50670': 'Köln',
	// Hamburg
	'20095': 'Hamburg',
	'20099': 'Hamburg',
	'20354': 'Hamburg',
	// Frankfurt
	'60311': 'Frankfurt',
	'60313': 'Frankfurt',
	'60329': 'Frankfurt'
};

/**
 * Look up city name from postal code
 */
export function getCityFromPlz(plz: string): string | null {
	return plzLookup[plz] ?? null;
}

/**
 * Find PLZ by partial city name match
 */
export function findPlzByCity(cityQuery: string): { plz: string; city: string } | null {
	const query = cityQuery.toLowerCase();
	const match = Object.entries(plzLookup).find(([_, city]) =>
		city.toLowerCase().includes(query)
	);
	return match ? { plz: match[0], city: match[1] } : null;
}

/**
 * Extract 5-digit PLZ from text
 */
export function extractPlz(text: string): string | null {
	const match = text.match(/\d{5}/);
	return match ? match[0] : null;
}
