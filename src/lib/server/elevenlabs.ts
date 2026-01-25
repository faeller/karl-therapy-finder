// elevenlabs conversational ai integration
import { env } from '$env/dynamic/private';
import { type CallOutcome } from '$lib/data/callConstants';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface AnalyzedCallResult {
	outcome: CallOutcome;
	confidence: number;
	appointment?: { date: string; time: string };
	callbackInfo?: string;
	rejectionReason?: string;
	waitlistPosition?: number;
	notes?: string;
}

// elevenlabs webhook payload - nested under data
export interface ElevenLabsWebhookPayload {
	type: string; // post_call_transcription, call_initiation_failure
	event_timestamp: number;
	data: {
		conversation_id: string;
		status: string; // done, failed
		failure_reason?: string; // for call_initiation_failure type
		transcript?: Array<{
			role: string;
			message: string | null;
			time_in_call_secs?: number;
		}>;
		metadata?: {
			call_duration_secs?: number;
			termination_reason?: string;
			charging?: {
				call_charge?: number;
				llm_charge?: number;
				llm_price?: number;
			};
			batch_call?: {
				batch_call_id?: string;
				batch_call_recipient_id?: string;
			};
			[key: string]: unknown;
		};
		analysis?: {
			call_successful?: string;
			transcript_summary?: string;
			data_collection_results?: Record<string, {
				value: string | null;
				rationale?: string;
			}>;
			[key: string]: unknown;
		};
		// conversation_initiation_client_data is a sibling of metadata, not inside it
		conversation_initiation_client_data?: {
			dynamic_variables?: {
				karl_call_id?: string;
				patient_name?: string;
				callback_phone?: string;
				patient_email?: string;
				[key: string]: string | undefined;
			};
		};
	};
}

export interface TriggerCallParams {
	agentId: string;
	phoneNumber: string;
	dynamicVariables: Record<string, string>;
	scheduledAt?: Date; // optional - if not provided, calls immediately
	callName?: string;
}

export interface TriggerCallResult {
	batchId: string;
	status: string;
	scheduledTimeUnix?: number;
}

// normalize phone number to E.164 format (strip spaces, dashes, etc)
function normalizePhoneNumber(phone: string): string {
	// remove everything except digits and leading +
	const cleaned = phone.replace(/[^\d+]/g, '');
	// ensure it starts with +
	if (!cleaned.startsWith('+')) {
		// assume german number if no country code
		return '+49' + cleaned.replace(/^0/, '');
	}
	return cleaned;
}

// schedule an outbound call via elevenlabs batch calling api
export async function triggerOutboundCall(params: TriggerCallParams): Promise<TriggerCallResult> {
	const normalizedPhone = normalizePhoneNumber(params.phoneNumber);
	console.log('[elevenlabs] triggerOutboundCall called:', {
		agentId: params.agentId,
		phoneNumber: params.phoneNumber,
		normalizedPhone,
		scheduledAt: params.scheduledAt?.toISOString(),
		callName: params.callName
	});

	const apiKey = env.ELEVENLABS_API_KEY;
	const phoneNumberId = env.ELEVENLABS_PHONE_NUMBER_ID;

	if (!apiKey) {
		console.error('[elevenlabs] ELEVENLABS_API_KEY not configured');
		throw new Error('ELEVENLABS_API_KEY not configured');
	}
	if (!phoneNumberId) {
		console.error('[elevenlabs] ELEVENLABS_PHONE_NUMBER_ID not configured');
		throw new Error('ELEVENLABS_PHONE_NUMBER_ID not configured');
	}

	console.log('[elevenlabs] env vars ok, phoneNumberId:', phoneNumberId);

	const scheduledTimeUnix = params.scheduledAt
		? Math.floor(params.scheduledAt.getTime() / 1000)
		: null;

	const requestBody = {
		call_name: params.callName || `karl_${Date.now()}`,
		agent_id: params.agentId,
		agent_phone_number_id: phoneNumberId,
		scheduled_time_unix: scheduledTimeUnix,
		recipients: [
			{
				phone_number: normalizedPhone,
				conversation_initiation_client_data: {
					dynamic_variables: params.dynamicVariables
				}
			}
		]
	};

	console.log('[elevenlabs] sending request:', JSON.stringify(requestBody, null, 2));

	try {
		const response = await fetch(`${ELEVENLABS_API_BASE}/convai/batch-calling/submit`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'xi-api-key': apiKey
			},
			body: JSON.stringify(requestBody)
		});

		const responseText = await response.text();
		console.log('[elevenlabs] response status:', response.status);
		console.log('[elevenlabs] response body:', responseText);

		if (!response.ok) {
			console.error('[elevenlabs] batch call submit failed:', response.status, responseText);
			throw new Error(`ElevenLabs API error: ${response.status} - ${responseText}`);
		}

		const data = JSON.parse(responseText) as {
			id: string;
			status: string;
			scheduled_time_unix?: number;
		};

		console.log('[elevenlabs] call scheduled successfully:', data);

		return {
			batchId: data.id,
			status: data.status,
			scheduledTimeUnix: data.scheduled_time_unix
		};
	} catch (e) {
		console.error('[elevenlabs] batch call submit error:', e);
		throw e;
	}
}

// cancel a scheduled batch call
export async function cancelBatchCall(batchId: string): Promise<boolean> {
	const apiKey = env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		console.error('[elevenlabs] ELEVENLABS_API_KEY not configured');
		return false;
	}

	try {
		const response = await fetch(`${ELEVENLABS_API_BASE}/convai/batch-calling/${batchId}/cancel`, {
			method: 'POST',
			headers: { 'xi-api-key': apiKey }
		});

		if (!response.ok) {
			const text = await response.text();
			console.error('[elevenlabs] batch cancel failed:', response.status, text);
			return false;
		}

		console.log('[elevenlabs] batch call cancelled:', batchId);
		return true;
	} catch (e) {
		console.error('[elevenlabs] batch cancel error:', e);
		return false;
	}
}

// get conversation details (for checking status, getting transcript)
export async function getConversation(conversationId: string) {
	const apiKey = env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error('ELEVENLABS_API_KEY not configured');
	}

	const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`, {
		headers: { 'xi-api-key': apiKey }
	});

	if (!response.ok) {
		throw new Error(`ElevenLabs API error: ${response.status}`);
	}

	return response.json();
}

// verify webhook signature from elevenlabs
export async function verifyWebhookSignature(
	payload: string,
	signatureHeader: string | null
): Promise<boolean> {
	const webhookSecret = env.ELEVENLABS_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.error('[elevenlabs] ELEVENLABS_WEBHOOK_SECRET not configured, rejecting webhook');
		return false;
	}

	if (!signatureHeader) {
		return false;
	}

	// elevenlabs signature format: t=<timestamp>,v0=<hash>
	const parts = signatureHeader.split(',');
	const timestampPart = parts.find(p => p.startsWith('t='));
	const signaturePart = parts.find(p => p.startsWith('v0='));

	if (!timestampPart || !signaturePart) {
		console.error('[elevenlabs] invalid signature format:', signatureHeader);
		return false;
	}

	const timestamp = timestampPart.slice(2);
	const expectedSignature = signaturePart.slice(3);
	const signedPayload = `${timestamp}.${payload}`;

	// compute expected signature
	const encoder = new TextEncoder();
	const keyData = encoder.encode(webhookSecret);
	const messageData = encoder.encode(signedPayload);

	const key = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const sig = await crypto.subtle.sign('HMAC', key, messageData);
	const signatureHex = Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// constant time comparison
	if (signatureHex.length !== expectedSignature.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < signatureHex.length; i++) {
		result |= signatureHex.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
	}
	return result === 0;
}

// parse webhook status to outcome
export function parseWebhookStatus(status: string): 'completed' | 'failed' {
	switch (status) {
		case 'completed':
			return 'completed';
		default:
			return 'failed';
	}
}

// should we retry this call?
export function shouldRetry(status: string): boolean {
	return status === 'no_answer' || status === 'busy' || status === 'voicemail';
}

// build dynamic variables for practice call
export function buildPracticeCallVariables(
	patientName: string,
	patientInsurance: string,
	therapyType: string,
	callbackPhone: string,
	urgency: 'low' | 'medium' | 'high' = 'medium',
	patientEmail?: string,
	pronouns: string = 'auto',
	joinWaitlist: boolean = true
): Record<string, string> {
	const now = new Date();
	const hours = now.getHours();
	let greeting = 'Guten Tag';
	if (hours < 11) greeting = 'Guten Morgen';
	else if (hours >= 18) greeting = 'Guten Abend';

	// map pronouns to german text for the agent
	const pronounsMap: Record<string, string> = {
		auto: 'karl entscheidet',
		she: 'sie/ihr',
		he: 'er/ihm',
		they: 'they/them',
		none: 'nur name'
	};

	return {
		patient_name: patientName,
		patient_insurance: patientInsurance,
		therapy_type: therapyType || 'Psychotherapie',
		callback_phone: callbackPhone,
		patient_email: patientEmail || '',
		urgency: urgency === 'high' ? 'dringend' : urgency === 'low' ? 'nicht dringend' : 'mittel',
		patient_pronouns: pronounsMap[pronouns] || 'automatisch',
		join_waitlist: joinWaitlist ? 'ja' : 'nein',
		greeting,
		current_date: now.toLocaleDateString('de-DE'),
		current_time: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
	};
}

// agent id getters
export function getPracticeCallerAgentId(): string {
	const agentId = env.ELEVENLABS_PRACTICE_AGENT_ID;
	if (!agentId) {
		throw new Error('ELEVENLABS_PRACTICE_AGENT_ID not configured');
	}
	return agentId;
}

export function get116117CallerAgentId(): string {
	const agentId = env.ELEVENLABS_116117_AGENT_ID;
	if (!agentId) {
		throw new Error('ELEVENLABS_116117_AGENT_ID not configured');
	}
	return agentId;
}

// cost estimation (elevenlabs ~$0.08-0.12 per minute)
export function estimateCallCost(durationSeconds: number): number {
	const minutes = durationSeconds / 60;
	return minutes * 0.10;
}

// conversation cost details from api
export interface ConversationCost {
	totalCredits: number;
	callCredits: number;
	llmCredits: number;
	llmPriceUsd: number;
	totalPriceUsd: number; // credits converted to USD
	durationSecs: number;
}

// credits to usd conversion - default: creator tier average of included ($22/200k=$0.11) + overage ($0.15) = $0.13/1000
function getCreditsToUsd(): number {
	const envRate = env.ELEVENLABS_CREDITS_PER_USD;
	if (envRate) return parseFloat(envRate) / 1000;
	return 0.13 / 1000; // default: $0.13/1000 credits
}

// fetch actual cost from elevenlabs api
export async function getConversationCost(conversationId: string): Promise<ConversationCost | null> {
	const apiKey = env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		console.warn('[elevenlabs] no api key, cannot fetch conversation cost');
		return null;
	}

	try {
		const res = await fetch(`${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`, {
			headers: { 'xi-api-key': apiKey }
		});

		if (!res.ok) {
			console.error('[elevenlabs] failed to fetch conversation:', res.status);
			return null;
		}

		const data = await res.json() as { metadata?: { cost?: number; call_duration_secs?: number; charging?: { call_charge?: number; llm_charge?: number; llm_price?: number } } };
		const metadata = data.metadata;
		const charging = metadata?.charging;
		const totalCredits = metadata?.cost || 0;

		return {
			totalCredits,
			callCredits: charging?.call_charge || 0,
			llmCredits: charging?.llm_charge || 0,
			llmPriceUsd: charging?.llm_price || 0,
			totalPriceUsd: totalCredits * getCreditsToUsd(),
			durationSecs: metadata?.call_duration_secs || 0
		};
	} catch (e) {
		console.error('[elevenlabs] error fetching conversation cost:', e);
		return null;
	}
}
