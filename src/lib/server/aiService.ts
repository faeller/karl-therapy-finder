// ai service - uses openrouter for llm calls
// handles opening hours parsing, transcript analysis
import { env } from '$env/dynamic/private';
import { load } from 'cheerio';
import type { CallOutcome } from '$lib/data/callConstants';
import type { AnalyzedCallResult } from './elevenlabs';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5';

interface OpenRouterResponse {
	id: string;
	choices: Array<{
		message: {
			role: string;
			content: string;
		};
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface CostTracking {
	inputTokens: number;
	outputTokens: number;
	model: string;
	costUsd: number;
}

// rough cost estimates for common models via openrouter (per token)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
	'anthropic/claude-haiku-4.5': { input: 0.0000008, output: 0.000004 },
	'anthropic/claude-3.5-haiku': { input: 0.0000008, output: 0.000004 },
	'anthropic/claude-3.5-sonnet': { input: 0.000003, output: 0.000015 },
	'openai/gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
	'google/gemini-flash-1.5': { input: 0.000000075, output: 0.0000003 }
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
	const costs = MODEL_COSTS[model] ?? MODEL_COSTS['anthropic/claude-haiku-4.5'];
	return inputTokens * costs.input + outputTokens * costs.output;
}

async function callOpenRouter(
	systemPrompt: string,
	userMessage: string,
	model: string = DEFAULT_MODEL
): Promise<{ response: string; cost: CostTracking }> {
	const apiKey = env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error('OPENROUTER_API_KEY not configured');
	}

	const response = await fetch(OPENROUTER_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`,
			'HTTP-Referer': env.PUBLIC_BASE_URL || 'https://karl-helps.org',
			'X-Title': 'KARL'
		},
		body: JSON.stringify({
			model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage }
			],
			max_tokens: 1024,
			temperature: 0.1
		})
	});

	if (!response.ok) {
		const text = await response.text();
		console.error('[openrouter] api error:', response.status, text);
		throw new Error(`OpenRouter API error: ${response.status}`);
	}

	const data = (await response.json()) as OpenRouterResponse;
	const text = data.choices[0]?.message?.content || '';

	return {
		response: text,
		cost: {
			inputTokens: data.usage?.prompt_tokens ?? 0,
			outputTokens: data.usage?.completion_tokens ?? 0,
			model,
			costUsd: estimateCost(model, data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0)
		}
	};
}

// ============================================================================
// OPENING HOURS PARSING
// ============================================================================

export interface OpeningHours {
	regular: Array<{ day: string; start: string; end: string }>;
	sprechstunde?: Array<{ day: string; start: string; end: string }>;
	notes?: string;
	phone?: string;
}

const DAY_MAP: Record<string, string> = {
	'Montag': 'mon',
	'Dienstag': 'tue',
	'Mittwoch': 'wed',
	'Donnerstag': 'thu',
	'Freitag': 'fri',
	'Samstag': 'sat',
	'Sonntag': 'sun'
};

// cheerio-based parser for tk ärztefuehrer html - free and fast
export function parseOpeningHoursFromHtml(html: string): OpeningHours {
	const $ = load(html);
	const result: OpeningHours = { regular: [] };

	// extract phone
	const phone = $('span[itemprop="telephone"]').first().text().trim();
	if (phone) {
		result.phone = phone;
	}

	// extract opening hours from surgery_{Day} divs
	for (const [germanDay, englishDay] of Object.entries(DAY_MAP)) {
		const dayRow = $(`#surgery_${germanDay}`);
		if (!dayRow.length) continue;

		const timeCell = dayRow.find('.col-sm-6');
		if (!timeCell.length) continue;

		const cellHtml = timeCell.html() || '';
		// match all time pairs: <time...>HH:MM</time> ... - ... HH:MM
		const timePattern = /<time[^>]*>(\d{1,2}:\d{2})<\/time>[\s\S]*?-[\s\n]*(\d{1,2}:\d{2})/g;
		let match;
		while ((match = timePattern.exec(cellHtml)) !== null) {
			const start = normalizeTime(match[1]);
			const end = normalizeTime(match[2]);
			if (start && end) {
				result.regular.push({ day: englishDay, start, end });
			}
		}
	}

	return result;
}

function normalizeTime(time: string): string | null {
	const match = time.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return null;
	const hours = match[1].padStart(2, '0');
	const minutes = match[2];
	return `${hours}:${minutes}`;
}

const OPENING_HOURS_SYSTEM_PROMPT = `Du bist ein Assistent, der Öffnungszeiten aus HTML-Seiten von Arztpraxen extrahiert.

Extrahiere folgende Informationen als JSON:
- regular: Array von {day, start, end} für normale Öffnungszeiten
- sprechstunde: Array von {day, start, end} für telefonische Sprechstunden (falls vorhanden)
- notes: Besondere Hinweise (z.B. "nur nach Vereinbarung")
- phone: Telefonnummer

Tage als: mon, tue, wed, thu, fri, sat, sun
Zeiten im 24h Format: "09:00", "14:30"

Antworte NUR mit validem JSON, keine Erklärungen.`;

// parse opening hours - tries regex first, falls back to ai if needed
export async function parseOpeningHours(
	html: string,
	model: string = DEFAULT_MODEL
): Promise<{ hours: OpeningHours; cost: CostTracking }> {
	// try regex parser first (free)
	const regexResult = parseOpeningHoursFromHtml(html);

	// if we got reasonable results, use them
	if (regexResult.regular.length > 0 || regexResult.notes) {
		return {
			hours: regexResult,
			cost: { inputTokens: 0, outputTokens: 0, model: 'regex', costUsd: 0 }
		};
	}

	// fallback to ai for edge cases
	const truncatedHtml = html.slice(0, 8000);

	const { response, cost } = await callOpenRouter(
		OPENING_HOURS_SYSTEM_PROMPT,
		`Extrahiere die Öffnungszeiten aus diesem HTML:\n\n${truncatedHtml}`,
		model
	);

	try {
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No JSON found in response');
		}
		const hours = JSON.parse(jsonMatch[0]) as OpeningHours;
		return { hours, cost };
	} catch (e) {
		console.error('[ai] failed to parse opening hours:', e, response);
		return {
			hours: { regular: [], notes: 'Öffnungszeiten konnten nicht ermittelt werden' },
			cost
		};
	}
}

// ============================================================================
// TRANSCRIPT ANALYSIS
// ============================================================================

const TRANSCRIPT_ANALYSIS_SYSTEM_PROMPT = `Du analysierst Transkripte von automatisierten Anrufen bei Psychotherapiepraxen.

Klassifiziere das Ergebnis des Anrufs:
- SUCCESS: Termin wurde vereinbart oder auf Warteliste gesetzt
- CALLBACK: Praxis ruft zurück oder Patient soll zurückrufen
- NO_ANSWER: Niemand hat abgenommen, Mailbox, besetzt
- NO_AVAILABILITY: Praxis voll, nimmt keine Patienten, lange Wartezeit
- REJECTED_AI: Praxis lehnt automatisierte Anrufe explizit ab
- REJECTED_PRIVACY: Datenschutzbedenken geäußert, DSGVO erwähnt
- REJECTED_OTHER: Andere Ablehnungsgründe
- UNCLEAR: Ergebnis nicht eindeutig

Antworte NUR mit validem JSON:
{
  "outcome": "SUCCESS|CALLBACK|NO_ANSWER|NO_AVAILABILITY|REJECTED_AI|REJECTED_PRIVACY|REJECTED_OTHER|UNCLEAR",
  "confidence": 0.0-1.0,
  "appointment": {"date": "YYYY-MM-DD", "time": "HH:MM"} oder null,
  "callback_info": "Details wann/wie zurückgerufen wird" oder null,
  "rejection_reason": "Grund für Ablehnung" oder null,
  "waitlist_position": Zahl oder null,
  "notes": "Kurze Zusammenfassung"
}`;

export async function analyzeTranscript(
	transcript: string,
	model: string = DEFAULT_MODEL
): Promise<{ result: AnalyzedCallResult; cost: CostTracking }> {
	const { response, cost } = await callOpenRouter(
		TRANSCRIPT_ANALYSIS_SYSTEM_PROMPT,
		`Analysiere dieses Gesprächstranskript:\n\n${transcript}`,
		model
	);

	try {
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No JSON found in response');
		}

		const parsed = JSON.parse(jsonMatch[0]) as {
			outcome: string;
			confidence: number;
			appointment?: { date: string; time: string };
			callback_info?: string;
			rejection_reason?: string;
			waitlist_position?: number;
			notes?: string;
		};

		const outcomeMap: Record<string, CallOutcome> = {
			SUCCESS: 'success',
			CALLBACK: 'callback',
			NO_ANSWER: 'no_answer',
			NO_AVAILABILITY: 'no_availability',
			REJECTED_AI: 'rejected_ai',
			REJECTED_PRIVACY: 'rejected_privacy',
			REJECTED_OTHER: 'rejected_other',
			UNCLEAR: 'unclear'
		};

		const result: AnalyzedCallResult = {
			outcome: outcomeMap[parsed.outcome] || 'unclear',
			confidence: parsed.confidence || 0.5,
			appointment: parsed.appointment,
			callbackInfo: parsed.callback_info,
			rejectionReason: parsed.rejection_reason,
			waitlistPosition: parsed.waitlist_position,
			notes: parsed.notes
		};

		return { result, cost };
	} catch (e) {
		console.error('[ai] failed to parse transcript analysis:', e, response);
		return {
			result: {
				outcome: 'unclear',
				confidence: 0,
				notes: 'Analyse fehlgeschlagen'
			},
			cost
		};
	}
}

// ============================================================================
// CALL SLOT CALCULATION
// ============================================================================

export interface TimeSlot {
	date: Date;
	isSprechstunde: boolean;
}

// random offset weighted towards earlier in the range (first 25-50% of slot)
// uses sqrt distribution to bias towards beginning while avoiding exact start
function randomOffsetWeighted(slotDurationMins: number): number {
	const minOffset = 8; // never call right at opening
	const maxOffset = Math.min(slotDurationMins * 0.4, 45); // first 40% of slot, max 45 min
	if (maxOffset <= minOffset) return minOffset;

	// sqrt distribution biases towards lower values
	const range = maxOffset - minOffset;
	const random = Math.sqrt(Math.random()); // 0-1, biased low
	return Math.floor(minOffset + random * range);
}

// simple random offset for "call soon" scenarios
function randomOffsetSimple(minMins: number, maxMins: number, maxAllowed: number): number {
	const range = Math.min(maxMins, maxAllowed) - minMins;
	if (range <= 0) return minMins;
	return minMins + Math.floor(Math.random() * range);
}

// calculate next available call slot based on opening hours
// schedules in the first quarter/half of the slot, but not right at opening
// TODO: edge case - if therapist has no opening hours set, returns null
//       currently handled in preflight by falling back to "now" which is bad (e.g. 2am)
export function calculateNextCallSlot(
	hours: OpeningHours,
	fromDate: Date = new Date()
): TimeSlot | null {
	const dayMap: Record<string, number> = {
		sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
	};

	const allSlots = [
		...(hours.sprechstunde || []).map((s) => ({ ...s, isSprechstunde: true })),
		...hours.regular.map((s) => ({ ...s, isSprechstunde: false }))
	];

	if (allSlots.length === 0) {
		return null;
	}

	// look up to 14 days ahead
	for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
		const checkDate = new Date(fromDate);
		checkDate.setDate(checkDate.getDate() + dayOffset);
		const dayOfWeek = checkDate.getDay();

		const dayName = Object.entries(dayMap).find(([, num]) => num === dayOfWeek)?.[0];
		if (!dayName) continue;

		const matchingSlots = allSlots
			.filter((s) => s.day === dayName)
			.sort((a, b) => {
				if (a.isSprechstunde && !b.isSprechstunde) return -1;
				if (!a.isSprechstunde && b.isSprechstunde) return 1;
				return a.start.localeCompare(b.start);
			});

		for (const slot of matchingSlots) {
			const [startH, startM] = slot.start.split(':').map(Number);
			const [endH, endM] = slot.end.split(':').map(Number);
			const slotStart = startH * 60 + startM;
			const slotEnd = endH * 60 + endM;
			const slotDuration = slotEnd - slotStart;

			// need at least 20 min window to make a call
			if (slotDuration < 20) continue;

			if (dayOffset === 0) {
				const now = fromDate.getHours() * 60 + fromDate.getMinutes();

				if (now > slotEnd - 15) continue;
				if (now >= slotStart - 10) {
					// we're within the slot now, call in 5-15 min
					const offset = randomOffsetSimple(5, 15, slotEnd - now - 10);
					const callDate = new Date(checkDate);
					callDate.setHours(fromDate.getHours(), fromDate.getMinutes() + offset, 0, 0);
					return { date: callDate, isSprechstunde: slot.isSprechstunde };
				}
			}

			// weighted offset in first 40% of slot
			const offset = randomOffsetWeighted(slotDuration);
			const callTime = slotStart + offset;
			const callDate = new Date(checkDate);
			callDate.setHours(Math.floor(callTime / 60), callTime % 60, 0, 0);
			return { date: callDate, isSprechstunde: slot.isSprechstunde };
		}
	}

	return null;
}

// failure types for retry scheduling
export type RetryFailureType = 'busy' | 'no_answer' | 'other';

// calculate retry slot - retry in 8-20 min (random), up to 3 times per slot
export function calculateRetrySlot(
	hours: OpeningHours,
	previousAttemptDate: Date,
	_attemptNumber: number,
	_failureType: RetryFailureType = 'other'
): TimeSlot | null {
	const now = new Date();
	// random delay 8-20 minutes
	const delayMinutes = 8 + Math.random() * 12;
	const fromDate = new Date(Math.max(now.getTime(), previousAttemptDate.getTime() + delayMinutes * 60 * 1000));
	return calculateNextCallSlot(hours, fromDate);
}
