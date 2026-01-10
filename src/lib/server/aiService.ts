// ai service - uses openrouter for llm calls
// handles opening hours parsing, transcript analysis
import { env } from '$env/dynamic/private';
import type { CallOutcome, AnalyzedCallResult } from './elevenlabs';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3.5-haiku';

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

// rough cost estimates for common models via openrouter
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
	'anthropic/claude-3.5-haiku': { input: 0.0000008, output: 0.000004 },
	'anthropic/claude-3.5-sonnet': { input: 0.000003, output: 0.000015 },
	'openai/gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
	'google/gemini-flash-1.5': { input: 0.000000075, output: 0.0000003 }
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
	const costs = MODEL_COSTS[model] ?? MODEL_COSTS['anthropic/claude-3.5-haiku'];
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
			'HTTP-Referer': env.PUBLIC_BASE_URL || 'https://karl2.pages.dev',
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

const OPENING_HOURS_SYSTEM_PROMPT = `Du bist ein Assistent, der Öffnungszeiten aus HTML-Seiten von Arztpraxen extrahiert.

Extrahiere folgende Informationen als JSON:
- regular: Array von {day, start, end} für normale Öffnungszeiten
- sprechstunde: Array von {day, start, end} für telefonische Sprechstunden (falls vorhanden)
- notes: Besondere Hinweise (z.B. "nur nach Vereinbarung")
- phone: Telefonnummer

Tage als: mon, tue, wed, thu, fri, sat, sun
Zeiten im 24h Format: "09:00", "14:30"

Antworte NUR mit validem JSON, keine Erklärungen.`;

export async function parseOpeningHours(
	html: string,
	model: string = DEFAULT_MODEL
): Promise<{ hours: OpeningHours; cost: CostTracking }> {
	// truncate html to avoid token limits
	const truncatedHtml = html.slice(0, 8000);

	const { response, cost } = await callOpenRouter(
		OPENING_HOURS_SYSTEM_PROMPT,
		`Extrahiere die Öffnungszeiten aus diesem HTML:\n\n${truncatedHtml}`,
		model
	);

	try {
		// extract json from response (might have markdown code blocks)
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

// calculate next available call slot based on opening hours
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

			if (dayOffset === 0) {
				const now = fromDate.getHours() * 60 + fromDate.getMinutes();
				const slotStart = startH * 60 + startM;
				const slotEnd = endH * 60 + endM;

				if (now > slotEnd - 15) continue;
				if (now >= slotStart - 10) {
					const callDate = new Date(checkDate);
					callDate.setHours(fromDate.getHours(), fromDate.getMinutes() + 10, 0, 0);
					return { date: callDate, isSprechstunde: slot.isSprechstunde };
				}
			}

			// avoid lunch unless sprechstunde
			if (!slot.isSprechstunde) {
				const slotStart = startH * 60 + startM;
				const slotEnd = endH * 60 + endM;
				const lunchStart = 12 * 60 + 30;
				const lunchEnd = 13 * 60 + 30;

				if (slotStart < lunchEnd && slotEnd > lunchStart) {
					if (slotStart < lunchStart - 30) {
						const callDate = new Date(checkDate);
						callDate.setHours(Math.floor((lunchStart - 30) / 60), (lunchStart - 30) % 60, 0, 0);
						return { date: callDate, isSprechstunde: false };
					} else if (slotEnd > lunchEnd + 30) {
						const callDate = new Date(checkDate);
						callDate.setHours(Math.floor((lunchEnd + 30) / 60), (lunchEnd + 30) % 60, 0, 0);
						return { date: callDate, isSprechstunde: false };
					}
				}
			}

			const callDate = new Date(checkDate);
			callDate.setHours(startH, startM + 15, 0, 0);
			return { date: callDate, isSprechstunde: slot.isSprechstunde };
		}
	}

	return null;
}

// calculate retry slot (different day/time than previous)
export function calculateRetrySlot(
	hours: OpeningHours,
	previousAttemptDate: Date,
	attemptNumber: number
): TimeSlot | null {
	const minWaitHours = attemptNumber === 1 ? 4 : attemptNumber === 2 ? 24 : 48;
	const fromDate = new Date(previousAttemptDate.getTime() + minWaitHours * 60 * 60 * 1000);

	const previousDay = previousAttemptDate.getDay();
	const previousHour = previousAttemptDate.getHours();

	for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
		const checkDate = new Date(fromDate);
		checkDate.setDate(checkDate.getDate() + dayOffset);
		const dayOfWeek = checkDate.getDay();

		if (dayOfWeek === previousDay && dayOffset < 7) {
			continue;
		}

		const slot = calculateNextCallSlot(hours, checkDate);
		if (slot) {
			const slotHour = slot.date.getHours();
			const previousWasMorning = previousHour < 12;
			const thisIsMorning = slotHour < 12;

			if (previousWasMorning !== thisIsMorning || dayOffset >= 3) {
				return slot;
			}
		}
	}

	return calculateNextCallSlot(hours, fromDate);
}
