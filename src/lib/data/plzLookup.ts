// plz utilities

/**
 * Extract 5-digit PLZ from text
 */
export function extractPlz(text: string): string | null {
	const match = text.match(/\d{5}/);
	return match ? match[0] : null;
}
