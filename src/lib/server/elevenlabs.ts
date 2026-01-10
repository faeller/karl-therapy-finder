// elevenlabs conversational ai integration
import { env } from '$env/dynamic/private';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// call outcome types
export type CallOutcome =
	| 'success'
	| 'callback'
	| 'no_answer'
	| 'no_availability'
	| 'rejected_ai'
	| 'rejected_privacy'
	| 'rejected_other'
	| 'unclear';

export interface AnalyzedCallResult {
	outcome: CallOutcome;
	confidence: number;
	appointment?: { date: string; time: string };
	callbackInfo?: string;
	rejectionReason?: string;
	waitlistPosition?: number;
	notes?: string;
}

export interface ElevenLabsWebhookPayload {
	conversation_id: string;
	status: 'completed' | 'failed' | 'no_answer' | 'busy' | 'voicemail';
	duration_seconds?: number;
	transcript?: string;
	analysis?: {
		outcome?: string;
		appointment_offered?: boolean;
		callback_requested?: boolean;
		rejection_reason?: string;
	};
	metadata?: Record<string, unknown>;
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

// schedule an outbound call via elevenlabs batch calling api
export async function triggerOutboundCall(params: TriggerCallParams): Promise<TriggerCallResult> {
	const apiKey = env.ELEVENLABS_API_KEY;
	const phoneNumberId = env.ELEVENLABS_PHONE_NUMBER_ID;

	if (!apiKey) {
		throw new Error('ELEVENLABS_API_KEY not configured');
	}
	if (!phoneNumberId) {
		throw new Error('ELEVENLABS_PHONE_NUMBER_ID not configured');
	}

	const scheduledTimeUnix = params.scheduledAt
		? Math.floor(params.scheduledAt.getTime() / 1000)
		: null;

	try {
		const response = await fetch(`${ELEVENLABS_API_BASE}/convai/batch-calling/submit`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'xi-api-key': apiKey
			},
			body: JSON.stringify({
				call_name: params.callName || `karl_${Date.now()}`,
				agent_id: params.agentId,
				agent_phone_number_id: phoneNumberId,
				scheduled_time_unix: scheduledTimeUnix,
				recipients: [
					{
						phone_number: params.phoneNumber,
						conversation_initiation_client_data: {
							dynamic_variables: params.dynamicVariables
						}
					}
				]
			})
		});

		if (!response.ok) {
			const text = await response.text();
			console.error('[elevenlabs] batch call submit failed:', response.status, text);
			throw new Error(`ElevenLabs API error: ${response.status}`);
		}

		const data = await response.json() as {
			id: string;
			status: string;
			scheduled_time_unix?: number;
		};

		return {
			batchId: data.id,
			status: data.status,
			scheduledTimeUnix: data.scheduled_time_unix
		};
	} catch (e) {
		console.error('[elevenlabs] batch call submit failed:', e);
		throw e;
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
	signature: string | null,
	timestamp: string | null
): Promise<boolean> {
	const webhookSecret = env.ELEVENLABS_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.warn('[elevenlabs] ELEVENLABS_WEBHOOK_SECRET not configured, skipping verification');
		return true; // allow in dev without secret
	}

	if (!signature || !timestamp) {
		return false;
	}

	// elevenlabs uses hmac-sha256
	// signature format: v1=<hash>
	const signatureParts = signature.split('=');
	if (signatureParts.length !== 2 || signatureParts[0] !== 'v1') {
		return false;
	}

	const expectedSignature = signatureParts[1];
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
	urgency: 'low' | 'medium' | 'high' = 'medium'
): Record<string, string> {
	const now = new Date();
	const hours = now.getHours();
	let greeting = 'Guten Tag';
	if (hours < 11) greeting = 'Guten Morgen';
	else if (hours >= 18) greeting = 'Guten Abend';

	return {
		patient_name: patientName,
		patient_insurance: patientInsurance,
		therapy_type: therapyType || 'Psychotherapie',
		callback_phone: callbackPhone,
		urgency: urgency === 'high' ? 'dringend' : urgency === 'low' ? 'nicht dringend' : 'mittel',
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
