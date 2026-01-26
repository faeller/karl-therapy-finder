// call service - orchestrates the auto-call system
// handles scheduling, execution tracking, retries, and blocklist management
import { nanoid } from 'nanoid';
import { eq, and, or, desc, not } from 'drizzle-orm';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from './db';
import * as table from './db/schema';
import {
	triggerOutboundCall,
	cancelBatchCall,
	buildPracticeCallVariables,
	getPracticeCallerAgentId,
	estimateCallCost,
	getConversationCost,
	getConversation,
	type ElevenLabsWebhookPayload,
	type AnalyzedCallResult
} from './elevenlabs';
import { type CallOutcome } from '$lib/data/callConstants';
import { parseOpeningHours, analyzeTranscript, calculateNextCallSlot, calculateRetrySlot, type OpeningHours, type RetryFailureType } from './aiService';
import { canScheduleCall as checkCredits, deductSeconds, freezePendingCalls, reserveCallSlot, refundCredits, DEFAULT_PROJECTED_SECONDS } from './creditService';
import { env } from '$env/dynamic/private';
import { load } from 'cheerio';

const MAX_ATTEMPTS = 12;
const THERAPIST_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// ============================================================================
// PRE-FLIGHT CHECKS
// ============================================================================

export interface PreflightResult {
	canProceed: boolean;
	reason?: string;
	creditsRemaining?: number;
	projectedSeconds?: number;
}

export async function checkCanScheduleCall(
	db: ReturnType<typeof getDb>,
	userId: string,
	eId: string,
	phone: string,
	userPledgeTier: string | null
): Promise<PreflightResult> {
	// check credits with projected liability (need enough for pending + new call)
	const creditCheck = await checkCredits(db, userId, DEFAULT_PROJECTED_SECONDS);
	if (!creditCheck.canSchedule) {
		return { canProceed: false, reason: 'no_credits', creditsRemaining: creditCheck.available, projectedSeconds: creditCheck.projected };
	}

	// check blocklist by eId or phone
	const blockedByEId = eId ? await db
		.select()
		.from(table.therapistBlocklist)
		.where(eq(table.therapistBlocklist.eId, eId))
		.limit(1) : [];

	const blockedByPhone = phone ? await db
		.select()
		.from(table.therapistBlocklist)
		.where(eq(table.therapistBlocklist.phone, phone))
		.limit(1) : [];

	const blocked = blockedByEId[0] || blockedByPhone[0];

	if (blocked) {
		// check if non-permanent block has expired
		if (!blocked.permanent && blocked.expiresAt && blocked.expiresAt < new Date()) {
			// expired, remove from blocklist
			await db.delete(table.therapistBlocklist).where(eq(table.therapistBlocklist.id, blocked.id));
		} else {
			return { canProceed: false, reason: 'therapist_blocked' };
		}
	}

	// check for existing pending/scheduled/frozen call for this therapist by this user
	const [existing] = await db
		.select()
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.userId, userId),
				eq(table.scheduledCalls.eId, eId),
				or(
					eq(table.scheduledCalls.status, 'scheduled'),
					eq(table.scheduledCalls.status, 'in_progress'),
					eq(table.scheduledCalls.status, 'frozen')
				)
			)
		)
		.limit(1);

	if (existing) {
		return { canProceed: false, reason: 'call_already_scheduled' };
	}

	return { canProceed: true, creditsRemaining: creditCheck.available };
}

// ============================================================================
// THERAPIST DETAILS (OPENING HOURS)
// ============================================================================

export interface TherapistDetails {
	eId: string;
	name: string;
	phone: string;
	address: string;
	openingHours: OpeningHours;
	fromCache: boolean;
}

export async function getTherapistDetails(
	db: ReturnType<typeof getDb>,
	eId: string,
	userId: string
): Promise<{ details: TherapistDetails; costUsd: number }> {
	// check cache first
	const [cached] = await db
		.select()
		.from(table.therapistCache)
		.where(eq(table.therapistCache.eId, eId))
		.limit(1);

	if (cached && cached.expiresAt > new Date()) {
		return {
			details: {
				eId: cached.eId,
				name: cached.name || '',
				phone: cached.phone || '',
				address: cached.address || '',
				openingHours: cached.openingHours ? JSON.parse(cached.openingHours) : { regular: [] },
				fromCache: true
			},
			costUsd: 0
		};
	}

	// fetch from tk ärztefuehrer (DD = detail page with opening hours)
	const tkUrl = `https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?a=DD&e_id=${eId}`;
	const response = await fetch(tkUrl, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/135.0.0.0',
			'Referer': 'https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?a=FSS'
		}
	});

	if (!response.ok) {
		throw new Error(`TK API error: ${response.status}`);
	}

	const html = await response.text();
	const $ = load(html);

	// extract basic info
	const name = $('h1').first().text().trim() || $('h2').first().text().trim();
	const addressEl = $('p:contains("Straße")').first();
	const address = addressEl.text().trim() || '';
	const phoneEl = $('p:contains("Telefon:")').first();
	const phoneMatch = phoneEl.text().match(/Telefon:\s*([\d\s\/\-\+]+)/);
	const phone = phoneMatch ? phoneMatch[1].trim() : '';

	// parse opening hours (cheerio first, ai fallback)
	const { hours, cost } = await parseOpeningHours(html);

	// use phone from parser if available
	const finalPhone = hours.phone || phone;

	// cache the result
	const now = new Date();
	const expiresAt = new Date(now.getTime() + THERAPIST_CACHE_TTL_MS);

	if (cached) {
		await db
			.update(table.therapistCache)
			.set({
				name,
				phone: finalPhone,
				address,
				openingHours: JSON.stringify(hours),
				rawHtml: html,
				fetchedAt: now,
				expiresAt
			})
			.where(eq(table.therapistCache.eId, eId));
	} else {
		await db.insert(table.therapistCache).values({
			eId,
			name,
			phone: finalPhone,
			address,
			openingHours: JSON.stringify(hours),
			rawHtml: html,
			fetchedAt: now,
			expiresAt
		});
	}

	// only track cost if ai was used (cost > 0)
	if (cost.costUsd > 0) {
		await db.insert(table.callCostEvents).values({
			id: nanoid(),
			userId,
			eventType: 'haiku_parse_hours',
			provider: 'anthropic',
			model: cost.model,
			inputTokens: cost.inputTokens,
			outputTokens: cost.outputTokens,
			costUsd: cost.costUsd.toFixed(6),
			createdAt: now
		});
	}

	return {
		details: {
			eId,
			name,
			phone: finalPhone,
			address,
			openingHours: hours,
			fromCache: false
		},
		costUsd: cost.costUsd
	};
}

// ============================================================================
// SCHEDULE CALL
// ============================================================================

export interface ScheduleCallParams {
	userId: string;
	therapistId: string;
	therapistName: string;
	eId: string;
	patientName: string;
	patientInsurance: string;
	therapyType: string;
	callbackPhone: string;
	patientEmail?: string;
	urgency?: 'low' | 'medium' | 'high';
}

export interface ScheduleCallResult {
	callId: string;
	scheduledAt: Date;
	batchId: string;
}

export async function scheduleCall(
	db: ReturnType<typeof getDb>,
	params: ScheduleCallParams
): Promise<ScheduleCallResult> {
	const now = new Date();

	// get therapist details (opening hours, phone)
	const { details, costUsd } = await getTherapistDetails(db, params.eId, params.userId);

	if (!details.phone) {
		throw new Error('Therapist phone number not found');
	}

	// check if phone is blocklisted
	const [phoneBlocked] = await db
		.select()
		.from(table.therapistBlocklist)
		.where(eq(table.therapistBlocklist.phone, details.phone))
		.limit(1);

	if (phoneBlocked) {
		if (!phoneBlocked.permanent && phoneBlocked.expiresAt && phoneBlocked.expiresAt < new Date()) {
			await db.delete(table.therapistBlocklist).where(eq(table.therapistBlocklist.id, phoneBlocked.id));
		} else {
			throw new Error('This phone number is blocked');
		}
	}

	// calculate optimal call slot
	const slot = calculateNextCallSlot(details.openingHours);
	if (!slot) {
		throw new Error('No available call slots found');
	}

	// store call params for retries and unfreezing
	const callMetadata = JSON.stringify({
		patientName: params.patientName,
		patientInsurance: params.patientInsurance,
		therapyType: params.therapyType,
		callbackPhone: params.callbackPhone,
		patientEmail: params.patientEmail,
		urgency: params.urgency,
		openingHours: details.openingHours // needed for re-scheduling if frozen
	});

	// atomically check credits and create call record
	const callId = nanoid();
	const reservation = await reserveCallSlot(db, params.userId, {
		id: callId,
		therapistId: params.therapistId,
		therapistName: params.therapistName || details.name,
		therapistPhone: details.phone,
		eId: params.eId,
		scheduledAt: slot.date,
		callMetadata
	});

	if (!reservation.success) {
		throw new Error(`Insufficient credits: ${reservation.available}s available`);
	}

	// build dynamic variables (include callId for webhook matching)
	const variables = {
		...buildPracticeCallVariables(
			params.patientName,
			params.patientInsurance,
			params.therapyType,
			params.callbackPhone,
			params.urgency,
			params.patientEmail
		),
		karl_call_id: callId
	};

	// submit batch call with scheduled time
	const agentId = getPracticeCallerAgentId();
	const result = await triggerOutboundCall({
		agentId,
		phoneNumber: details.phone,
		dynamicVariables: variables,
		scheduledAt: slot.date,
		callName: `karl_${params.therapistId}_${callId}`
	});

	// update with batch id (elevenlabs_conv_id field stores batch id now)
	await db
		.update(table.scheduledCalls)
		.set({
			elevenlabsConvId: result.batchId,
			updatedAt: new Date()
		})
		.where(eq(table.scheduledCalls.id, callId));

	return {
		callId,
		scheduledAt: slot.date,
		batchId: result.batchId
	};
}

// ============================================================================
// DEBUG CALL (for testing without real therapist data)
// ============================================================================

export interface ScheduleDebugCallParams {
	userId: string;
	therapistId?: string; // real therapist id if testing real therapist, else defaults to debug
	eId?: string; // real eId if testing real therapist, else defaults to debug
	therapistName: string;
	therapistPhone: string;
	patientName: string;
	patientInsurance: string;
	therapyType: string;
	callbackPhone: string;
	patientEmail?: string;
	urgency?: 'low' | 'medium' | 'high';
}

export async function scheduleDebugCall(
	db: ReturnType<typeof getDb>,
	params: ScheduleDebugCallParams
): Promise<ScheduleCallResult> {
	console.log('[scheduleDebugCall] starting with params:', {
		userId: params.userId,
		therapistPhone: params.therapistPhone,
		callbackPhone: params.callbackPhone
	});

	const scheduledAt = new Date();
	const callId = nanoid();

	// store call params for retries
	// include default opening hours for debug calls so frozen calls can be rescheduled
	const debugOpeningHours = {
		regular: [
			{ day: 1, from: '09:00', to: '17:00' }, // mon
			{ day: 2, from: '09:00', to: '17:00' }, // tue
			{ day: 3, from: '09:00', to: '17:00' }, // wed
			{ day: 4, from: '09:00', to: '17:00' }, // thu
			{ day: 5, from: '09:00', to: '17:00' }  // fri
		]
	};
	const callMetadata = JSON.stringify({
		patientName: params.patientName,
		patientInsurance: params.patientInsurance,
		therapyType: params.therapyType,
		callbackPhone: params.callbackPhone,
		patientEmail: params.patientEmail,
		urgency: params.urgency,
		isDebug: true,
		openingHours: debugOpeningHours
	});

	// atomically check credits and create call record
	const reservation = await reserveCallSlot(db, params.userId, {
		id: callId,
		therapistId: params.therapistId || 'debug-test-therapist',
		therapistName: params.therapistName,
		therapistPhone: params.therapistPhone,
		eId: params.eId || 'debug',
		scheduledAt,
		callMetadata
	});

	if (!reservation.success) {
		throw new Error(reservation.reason === 'no_credits'
			? 'Not enough credits for debug call'
			: 'Failed to reserve call slot');
	}

	console.log('[scheduleDebugCall] db record created, callId:', callId);

	let batchId = `debug_${callId}`;

	// try to trigger real elevenlabs call if configured
	try {
		console.log('[scheduleDebugCall] building call variables...');
		const variables = {
			...buildPracticeCallVariables(
				params.patientName,
				params.patientInsurance,
				params.therapyType,
				params.callbackPhone,
				params.urgency,
				params.patientEmail
			),
			karl_call_id: callId
		};
		console.log('[scheduleDebugCall] variables:', variables);

		console.log('[scheduleDebugCall] getting agent id...');
		const agentId = getPracticeCallerAgentId();
		console.log('[scheduleDebugCall] agentId:', agentId);

		console.log('[scheduleDebugCall] triggering elevenlabs call...');
		const result = await triggerOutboundCall({
			agentId,
			phoneNumber: params.therapistPhone,
			dynamicVariables: variables,
			scheduledAt,
			callName: `karl_debug_${callId}`
		});

		batchId = result.batchId;
		console.log('[scheduleDebugCall] elevenlabs call scheduled, batchId:', batchId);
	} catch (e) {
		console.error('[scheduleDebugCall] elevenlabs call failed:', e);
	}

	// update with batch id
	await db
		.update(table.scheduledCalls)
		.set({
			elevenlabsConvId: batchId,
			updatedAt: new Date()
		})
		.where(eq(table.scheduledCalls.id, callId));

	return {
		callId,
		scheduledAt,
		batchId
	};
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

export async function handleCallWebhook(
	db: ReturnType<typeof getDb>,
	payload: ElevenLabsWebhookPayload
): Promise<string | null> {
	const now = new Date();
	const data = payload.data;

	// try to find the call by:
	// 1. karl_call_id from dynamic_variables
	// 2. batch_call_id from metadata
	// 3. conversation_id matching elevenlabs_conv_id
	// 4. fetch from API if webhook lacks the above (call_initiation_failure case)
	const karlCallId = data.conversation_initiation_client_data?.dynamic_variables?.karl_call_id;
	const conversationId = data.conversation_id;
	const batchCallId = data.metadata?.batch_call?.batch_call_id;

	console.log('[webhook] conversation_id:', conversationId, 'karl_call_id:', karlCallId, 'batch_call_id:', batchCallId);

	let call: typeof table.scheduledCalls.$inferSelect | undefined;

	// try karl_call_id first (passed via dynamic variables)
	if (karlCallId) {
		const [found] = await db
			.select()
			.from(table.scheduledCalls)
			.where(eq(table.scheduledCalls.id, karlCallId))
			.limit(1);
		call = found;
	}

	// try batch_call_id (batch api - we store this in elevenlabs_conv_id)
	if (!call && batchCallId) {
		const [found] = await db
			.select()
			.from(table.scheduledCalls)
			.where(eq(table.scheduledCalls.elevenlabsConvId, batchCallId))
			.limit(1);
		call = found;
	}

	// fallback: try matching by conversation_id
	if (!call && conversationId) {
		const [found] = await db
			.select()
			.from(table.scheduledCalls)
			.where(eq(table.scheduledCalls.elevenlabsConvId, conversationId))
			.limit(1);
		call = found;
	}

	// last resort: fetch conversation details from API to get karl_call_id or batch_call_id
	if (!call && conversationId) {
		try {
			console.log('[webhook] fetching conversation details from API:', conversationId);
			const convDetails = await getConversation(conversationId) as any;

			// try karl_call_id from dynamic_variables
			const apiKarlCallId = convDetails?.conversation_initiation_client_data?.dynamic_variables?.karl_call_id;
			if (apiKarlCallId) {
				const [found] = await db
					.select()
					.from(table.scheduledCalls)
					.where(eq(table.scheduledCalls.id, apiKarlCallId))
					.limit(1);
				call = found;
				if (call) {
					console.log('[webhook] matched via API karl_call_id:', apiKarlCallId);
				}
			}

			// try batch_call_id from metadata
			if (!call) {
				const apiBatchCallId = convDetails?.metadata?.batch_call?.batch_call_id;
				if (apiBatchCallId) {
					const [found] = await db
						.select()
						.from(table.scheduledCalls)
						.where(eq(table.scheduledCalls.elevenlabsConvId, apiBatchCallId))
						.limit(1);
					call = found;
					if (call) {
						console.log('[webhook] matched via API batch_call_id:', apiBatchCallId);
					}
				}
			}
		} catch (e) {
			console.error('[webhook] failed to fetch conversation details:', e);
		}
	}

	if (!call) {
		console.log('[webhook] no matching call found for conversation_id:', conversationId, 'karl_call_id:', karlCallId, 'batch_call_id:', batchCallId);
		return null;
	}

	console.log('[webhook] matched call:', call.id, 'type:', payload.type);

	// update conversation_id if not already set
	if (!call.elevenlabsConvId || call.elevenlabsConvId !== conversationId) {
		await db.update(table.scheduledCalls)
			.set({ elevenlabsConvId: conversationId })
			.where(eq(table.scheduledCalls.id, call.id));
	}

	// handle call_initiation_failure (couldn't connect - invalid number, sip error, etc)
	if (payload.type === 'call_initiation_failure') {
		const failureReason = data.failure_reason || 'unknown';
		const sipCode = (data.metadata as Record<string, unknown>)?.body
			? ((data.metadata as Record<string, unknown>).body as Record<string, unknown>)?.sip_status_code
			: undefined;

		// determine if retryable, failure type, and user message based on sip code
		let userMessage = 'Der Anruf konnte nicht verbunden werden.';
		let shouldRetry = false;
		let failureType: RetryFailureType = 'other';

		if (sipCode === 404) {
			userMessage = 'Die Telefonnummer scheint nicht zu existieren. Bitte überprüfe die Nummer.';
		} else if (sipCode === 403) {
			userMessage = 'Der Anruf wurde von der Gegenseite blockiert.';
		} else if (sipCode === 486 || sipCode === 600) {
			userMessage = 'Die Leitung war besetzt.';
			shouldRetry = true;
			failureType = 'busy';
		} else if (sipCode === 408 || sipCode === 480 || sipCode === 487) {
			userMessage = 'Keine Antwort - die Praxis war nicht erreichbar.';
			shouldRetry = true;
			failureType = 'no_answer';
		} else {
			userMessage += ' Unsere Entwickler schauen sich das Problem an.';
		}

		const attemptNum = call.attemptNumber || 1;
		const maxAttempts = call.maxAttempts || MAX_ATTEMPTS;
		const canRetry = shouldRetry && attemptNum < maxAttempts;

		if (canRetry) {
			userMessage += ` (Versuch ${attemptNum}/${maxAttempts} - wird automatisch erneut versucht)`;
			// schedule retry with failure type for smart timing, pass current notes for history
			await scheduleRetry(db, call, failureType, userMessage);
			console.log('[webhook] call_initiation_failure - scheduling retry, attempt:', attemptNum, 'type:', failureType);
		} else if (shouldRetry) {
			userMessage += ` (Alle ${maxAttempts} Versuche fehlgeschlagen)`;
		}

		// only mark as failed if no retry scheduled
		// (scheduleRetry already handles the update when canRetry is true)
		if (!canRetry) {
			await db.update(table.scheduledCalls)
				.set({
					status: 'failed',
					outcome: 'connection_failed',
					notes: userMessage,
					completedAt: now,
					updatedAt: now
				})
				.where(eq(table.scheduledCalls.id, call.id));
		}

		console.log('[webhook] call_initiation_failure processed, sip_code:', sipCode, 'retry:', canRetry);
		return call.id;
	}

	// extract transcript as text
	const transcriptText = data.transcript
		?.filter(t => t.message)
		.map(t => `${t.role}: ${t.message}`)
		.join('\n') || null;

	// extract analysis from elevenlabs (they provide it in data.analysis)
	const elAnalysis = data.analysis;
	const dataResults = elAnalysis?.data_collection_results || {};

	// map elevenlabs analysis to our format
	const appointmentDate = dataResults.appointment_date?.value;
	const appointmentTime = dataResults.appointment_time?.value;
	const hasAppointment = appointmentDate && appointmentDate !== 'not_scheduled' && appointmentTime && appointmentTime !== 'not_specified';

	const analysis: AnalyzedCallResult | null = elAnalysis ? {
		outcome: mapElevenLabsOutcome(elAnalysis.call_successful, dataResults.outcome_reason?.value),
		confidence: elAnalysis.call_successful === 'success' ? 0.9 : 0.7,
		notes: elAnalysis.transcript_summary,
		...(hasAppointment && {
			appointment: {
				date: appointmentDate as string,
				time: appointmentTime as string
			}
		}),
		callbackInfo: dataResults.follow_up_needed?.value === 'yes' ? 'follow-up needed' : undefined,
		rejectionReason: (() => {
			const reason = dataResults.outcome_reason?.value;
			if (!reason || reason === 'appointment_scheduled') return undefined;
			if (reason === 'denied talking to ai') return 'ai_rejected';
			return reason;
		})()
	} : null;

	// fetch actual cost from elevenlabs api
	const costInfo = await getConversationCost(data.conversation_id);
	const durationSeconds = costInfo?.durationSecs || data.metadata?.call_duration_secs;

	if (costInfo) {
		// store actual cost from api (credits to usd via ELEVENLABS_CREDITS_PER_USD or default $0.13/1000)
		await db.insert(table.callCostEvents).values({
			id: nanoid(),
			callId: call.id,
			userId: call.userId,
			eventType: 'elevenlabs_call',
			provider: 'elevenlabs',
			durationSeconds: costInfo.durationSecs,
			costUsd: costInfo.totalPriceUsd.toFixed(6),
			metadata: JSON.stringify({
				totalCredits: costInfo.totalCredits,
				callCredits: costInfo.callCredits,
				llmCredits: costInfo.llmCredits,
				llmPriceUsd: costInfo.llmPriceUsd
			}),
			createdAt: now
		});
	} else if (durationSeconds) {
		// fallback to estimated cost
		const elCost = estimateCallCost(durationSeconds);
		await db.insert(table.callCostEvents).values({
			id: nanoid(),
			callId: call.id,
			userId: call.userId,
			eventType: 'elevenlabs_call',
			provider: 'elevenlabs',
			durationSeconds,
			costUsd: elCost.toFixed(6),
			createdAt: now
		});
	}

	// determine outcome
	const outcome = analysis?.outcome || mapWebhookStatusToOutcome(data.status);

	// update call record
	await db
		.update(table.scheduledCalls)
		.set({
			status: 'completed',
			outcome,
			transcript: transcriptText,
			analysis: elAnalysis ? JSON.stringify(elAnalysis) : null,
			appointmentDate: analysis?.appointment?.date || null,
			appointmentTime: analysis?.appointment?.time || null,
			callbackInfo: analysis?.callbackInfo || null,
			rejectionReason: analysis?.rejectionReason || null,
			notes: analysis?.notes || null,
			durationSeconds: durationSeconds || null,
			updatedAt: now,
			completedAt: now
		})
		.where(eq(table.scheduledCalls.id, call.id));

	// handle different outcomes (pass durationSeconds directly since call object is stale)
	await handleCallOutcome(db, call, outcome, analysis, analysis?.notes || null, durationSeconds);

	// check if practice explicitly asked not to be called again
	const practiceBlockedUs = dataResults.practice_blocked_us?.value;
	if (practiceBlockedUs === 'yes' && call.eId) {
		console.log('[webhook] practice explicitly blocked us, adding to permanent blocklist');
		await addToBlocklist(db, call.eId, call.therapistName!, 'practice_blocked_us', true, call.userId);
	}

	return call.id;
}

function mapElevenLabsOutcome(callSuccessful: string | undefined, outcomeReason: string | null | undefined): CallOutcome {
	if (callSuccessful === 'success') return 'success';
	if (outcomeReason === 'denied_ai') return 'rejected_ai';
	if (outcomeReason === 'privacy_concern') return 'rejected_privacy';
	if (outcomeReason === 'no_capacity') return 'no_availability';
	if (callSuccessful === 'failure') return 'unclear';
	return 'unclear';
}

function mapWebhookStatusToOutcome(status: string): CallOutcome {
	switch (status) {
		case 'done':
		case 'completed':
			return 'unclear'; // need transcript analysis
		case 'no_answer':
		case 'busy':
		case 'voicemail':
			return 'no_answer';
		case 'failed':
		default:
			return 'unclear';
	}
}

async function handleCallOutcome(
	db: ReturnType<typeof getDb>,
	call: table.ScheduledCall,
	outcome: CallOutcome,
	analysis: Awaited<ReturnType<typeof analyzeTranscript>>['result'] | null,
	currentNotes?: string | null,
	actualDurationSeconds?: number | null
): Promise<void> {
	const now = new Date();

	// check if this call was already processed (prevent double-deduction from webhook replay)
	if (call.durationSeconds !== null && call.durationSeconds !== undefined) {
		console.log('[handleCallOutcome] call already has durationSeconds, skipping deduction:', call.id);
		// still allow status updates but skip credit deduction
		actualDurationSeconds = null;
	}

	// deduct seconds for calls that connected (capped at available to prevent debt)
	if (actualDurationSeconds && actualDurationSeconds > 0) {
		const { deducted, remaining, giftedSeconds } = await deductSeconds(db, call.userId, actualDurationSeconds, call.id);

		// if we gifted seconds (ate overage), record it in the analysis json
		if (giftedSeconds > 0) {
			const existingAnalysis = call.analysis ? JSON.parse(call.analysis) : {};
			const updatedAnalysis = { ...existingAnalysis, giftedSeconds };
			await db
				.update(table.scheduledCalls)
				.set({ analysis: JSON.stringify(updatedAnalysis) })
				.where(eq(table.scheduledCalls.id, call.id));
		}

		// if credits depleted, freeze other pending calls
		if (remaining <= 0) {
			await freezePendingCalls(db, call.userId);
		}
	}

	switch (outcome) {
		case 'success':
			// todo: send notification
			break;

		case 'no_answer':
			// schedule retry if attempts remaining
			if ((call.attemptNumber || 1) < (call.maxAttempts || MAX_ATTEMPTS)) {
				await scheduleRetry(db, call, 'no_answer', currentNotes || undefined);
			}
			break;

		case 'rejected_ai':
			// soft blocklist (35 days)
			await addToBlocklist(db, call.eId!, call.therapistName!, 'ai_rejected', false, call.userId, 35);
			break;

		case 'rejected_privacy':
			// soft blocklist (20 days) + log incident for manual review
			await addToBlocklist(db, call.eId!, call.therapistName!, 'privacy_concern', false, call.userId, 20);
			await db.insert(table.privacyIncidents).values({
				id: nanoid(),
				callId: call.id,
				therapistEId: call.eId,
				severity: 'medium',
				transcriptExcerpt: analysis?.notes || null,
				actionTaken: 'soft_blocklist_20days',
				createdAt: now
			});
			break;

		case 'callback':
		case 'no_availability':
		case 'rejected_other':
		case 'unclear':
			// no special handling, user will see the status
			break;
	}
}

async function scheduleRetry(
	db: ReturnType<typeof getDb>,
	call: table.ScheduledCall,
	failureType: RetryFailureType = 'other',
	currentNotes?: string
): Promise<void> {
	// parse stored call metadata
	const metadata = call.callMetadata ? JSON.parse(call.callMetadata) : null;
	if (!metadata) {
		console.log('[scheduleRetry] no call metadata, cannot retry');
		return;
	}

	const isDebug = metadata.isDebug === true;
	const now = new Date();
	let scheduledAt: Date;

	if (isDebug) {
		// debug mode: schedule 30 seconds from now (24/7 availability)
		scheduledAt = new Date(now.getTime() + 30 * 1000);
		console.log('[scheduleRetry] debug mode, scheduling in 30s');
	} else {
		// production: use cached opening hours
		const [cached] = await db
			.select()
			.from(table.therapistCache)
			.where(eq(table.therapistCache.eId, call.eId!))
			.limit(1);

		if (!cached?.openingHours) {
			console.log('[scheduleRetry] no cached hours, cannot retry');
			return;
		}

		const hours = JSON.parse(cached.openingHours) as OpeningHours;
		const newSlot = calculateRetrySlot(hours, call.scheduledAt, call.attemptNumber || 1, failureType);

		if (!newSlot) {
			console.log('[scheduleRetry] no available slots');
			return;
		}
		scheduledAt = newSlot.date;
	}

	const newAttempt = (call.attemptNumber || 1) + 1;

	// record current attempt in history before retry
	const currentAttempt = {
		attempt: call.attemptNumber || 1,
		scheduledAt: call.scheduledAt?.toISOString(),
		completedAt: call.completedAt?.toISOString() || now.toISOString(),
		outcome: call.outcome,
		notes: currentNotes || call.notes
	};
	const existingHistory = call.attemptHistory ? JSON.parse(call.attemptHistory) : [];
	const attemptHistory = [...existingHistory, currentAttempt];

	// update call for retry (only if not cancelled by user)
	const result = await db
		.update(table.scheduledCalls)
		.set({
			scheduledAt,
			attemptNumber: newAttempt,
			status: 'scheduled',
			outcome: null, // clear outcome for new attempt
			notes: null,
			transcript: null,
			analysis: null,
			completedAt: null,
			attemptHistory: JSON.stringify(attemptHistory),
			updatedAt: now
		})
		.where(
			and(
				eq(table.scheduledCalls.id, call.id),
				not(eq(table.scheduledCalls.status, 'cancelled'))
			)
		)
		.returning();

	// if update didn't affect any rows, call was cancelled - abort retry
	if (result.length === 0) {
		console.log('[scheduleRetry] call was cancelled, aborting retry');
		return;
	}

	// trigger elevenlabs call
	try {
		const variables = {
			...buildPracticeCallVariables(
				metadata.patientName,
				metadata.patientInsurance,
				metadata.therapyType,
				metadata.callbackPhone,
				metadata.urgency,
				metadata.patientEmail
			),
			karl_call_id: call.id
		};

		const agentId = getPracticeCallerAgentId();
		const result = await triggerOutboundCall({
			agentId,
			phoneNumber: call.therapistPhone,
			dynamicVariables: variables,
			scheduledAt,
			callName: `karl_retry_${call.id}_${newAttempt}`
		});

		// update batch id (only if call still scheduled - user might have cancelled)
		const batchUpdateResult = await db
			.update(table.scheduledCalls)
			.set({ elevenlabsConvId: result.batchId, updatedAt: new Date() })
			.where(
				and(
					eq(table.scheduledCalls.id, call.id),
					eq(table.scheduledCalls.status, 'scheduled')
				)
			)
			.returning();

		// if update failed, call was cancelled - cancel the batch we just created
		if (batchUpdateResult.length === 0) {
			console.log('[scheduleRetry] call was cancelled during retry setup, cancelling new batch');
			await cancelBatchCall(result.batchId);
			return;
		}

		console.log('[scheduleRetry] retry scheduled, attempt:', newAttempt, 'batchId:', result.batchId);
	} catch (e) {
		console.error('[scheduleRetry] failed to trigger call:', e);

		// refund projected seconds since the call never got scheduled
		const projectedSeconds = call.projectedSeconds || DEFAULT_PROJECTED_SECONDS;
		await refundCredits(db, call.userId, projectedSeconds, call.id);

		// mark as failed since we couldn't schedule
		await db
			.update(table.scheduledCalls)
			.set({ status: 'failed', notes: 'Retry scheduling failed', updatedAt: new Date() })
			.where(eq(table.scheduledCalls.id, call.id));
	}
}

async function addToBlocklist(
	db: ReturnType<typeof getDb>,
	eId: string,
	therapistName: string,
	reason: string,
	permanent: boolean,
	userId: string,
	daysToExpire: number = 90
): Promise<void> {
	const now = new Date();
	const expiresAt = permanent ? null : new Date(now.getTime() + daysToExpire * 24 * 60 * 60 * 1000);

	await db
		.insert(table.therapistBlocklist)
		.values({
			id: nanoid(),
			eId,
			therapistName,
			reason,
			permanent,
			reportedByUser: userId,
			createdAt: now,
			expiresAt
		})
		.onConflictDoUpdate({
			target: table.therapistBlocklist.eId,
			set: {
				reason,
				permanent: permanent || undefined,
				reportedByUser: userId,
				expiresAt
			}
		});
}

// ============================================================================
// CALL STATUS
// ============================================================================

export async function getCallStatus(
	db: ReturnType<typeof getDb>,
	callId: string,
	userId: string
): Promise<table.ScheduledCall | null> {
	const [call] = await db
		.select()
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.id, callId),
				eq(table.scheduledCalls.userId, userId)
			)
		)
		.limit(1);

	return call || null;
}

export async function getUserCalls(
	db: ReturnType<typeof getDb>,
	userId: string,
	limit = 20
): Promise<table.ScheduledCall[]> {
	return db
		.select()
		.from(table.scheduledCalls)
		.where(eq(table.scheduledCalls.userId, userId))
		.orderBy(desc(table.scheduledCalls.createdAt))
		.limit(limit);
}

// ============================================================================
// CANCEL CALL
// ============================================================================

export async function cancelCall(
	db: ReturnType<typeof getDb>,
	callId: string,
	userId: string
): Promise<boolean> {
	const [call] = await db
		.select()
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.id, callId),
				eq(table.scheduledCalls.userId, userId),
				or(
					eq(table.scheduledCalls.status, 'scheduled'),
					eq(table.scheduledCalls.status, 'frozen')
				)
			)
		)
		.limit(1);

	if (!call) {
		return false;
	}

	// cancel with elevenlabs if we have a batch id
	if (call.elevenlabsConvId) {
		const cancelled = await cancelBatchCall(call.elevenlabsConvId);
		if (!cancelled) {
			console.warn('[callService] elevenlabs cancel failed for batch:', call.elevenlabsConvId);
		}
	}

	// refund projected seconds back to user's available credits
	const projectedSeconds = call.projectedSeconds || DEFAULT_PROJECTED_SECONDS;
	await refundCredits(db, userId, projectedSeconds, callId);

	await db
		.update(table.scheduledCalls)
		.set({
			status: 'cancelled',
			updatedAt: new Date()
		})
		.where(eq(table.scheduledCalls.id, callId));

	return true;
}

// ============================================================================
// CREDITS MANAGEMENT
// ============================================================================

// get user credits (in seconds)
export async function getUserCredits(
	db: ReturnType<typeof getDb>,
	userId: string
): Promise<{ total: number; used: number; refunded: number; available: number }> {
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const total = credits?.creditsTotal ?? 0;
	const used = credits?.creditsUsed ?? 0;
	const refunded = credits?.creditsRefunded ?? 0;

	return {
		total,
		used,
		refunded,
		available: total - used + refunded
	};
}

// re-export from creditService for convenience
export { addCredits, refundCredits } from './creditService';
