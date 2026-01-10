// call service - orchestrates the auto-call system
// handles scheduling, execution tracking, retries, and blocklist management
import { nanoid } from 'nanoid';
import { eq, and, lt, gt, isNull, or, desc } from 'drizzle-orm';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from './db';
import * as table from './db/schema';
import {
	triggerOutboundCall,
	buildPracticeCallVariables,
	getPracticeCallerAgentId,
	estimateCallCost,
	type ElevenLabsWebhookPayload,
	type CallOutcome
} from './elevenlabs';
import { parseOpeningHours, analyzeTranscript, calculateNextCallSlot, calculateRetrySlot, type OpeningHours } from './aiService';
import { env } from '$env/dynamic/private';
import { load } from 'cheerio';

const MAX_ATTEMPTS = 3;
const THERAPIST_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// ============================================================================
// PRE-FLIGHT CHECKS
// ============================================================================

export interface PreflightResult {
	canProceed: boolean;
	reason?: string;
	creditsRemaining?: number;
}

export async function checkCanScheduleCall(
	db: ReturnType<typeof getDb>,
	userId: string,
	eId: string,
	userPledgeTier: string | null
): Promise<PreflightResult> {
	// check tier - require supporter or premium
	const allowedTiers = ['supporter', 'premium'];
	if (!userPledgeTier || !allowedTiers.includes(userPledgeTier)) {
		return { canProceed: false, reason: 'tier_required' };
	}

	// check credits
	const [credits] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const available = (credits?.creditsTotal ?? 0) - (credits?.creditsUsed ?? 0) + (credits?.creditsRefunded ?? 0);
	if (available <= 0) {
		return { canProceed: false, reason: 'no_credits', creditsRemaining: 0 };
	}

	// check blocklist
	const [blocked] = await db
		.select()
		.from(table.therapistBlocklist)
		.where(eq(table.therapistBlocklist.eId, eId))
		.limit(1);

	if (blocked) {
		// check if non-permanent block has expired
		if (!blocked.permanent && blocked.expiresAt && blocked.expiresAt < new Date()) {
			// expired, remove from blocklist
			await db.delete(table.therapistBlocklist).where(eq(table.therapistBlocklist.id, blocked.id));
		} else {
			return { canProceed: false, reason: 'therapist_blocked' };
		}
	}

	// check for existing pending/scheduled call for this therapist by this user
	const [existing] = await db
		.select()
		.from(table.scheduledCalls)
		.where(
			and(
				eq(table.scheduledCalls.userId, userId),
				eq(table.scheduledCalls.eId, eId),
				or(
					eq(table.scheduledCalls.status, 'scheduled'),
					eq(table.scheduledCalls.status, 'in_progress')
				)
			)
		)
		.limit(1);

	if (existing) {
		return { canProceed: false, reason: 'call_already_scheduled' };
	}

	return { canProceed: true, creditsRemaining: available };
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

	// fetch from tk ärztefuehrer
	const tkUrl = `https://www.tk-aerztefuehrer.de/TK/Suche_SN/index.js?a=DL&e_id=${eId}`;
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

	// use haiku to parse opening hours
	const { hours, cost } = await parseOpeningHours(html);

	// update phone from haiku result if available
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

	// track cost
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

	// calculate optimal call slot
	const slot = calculateNextCallSlot(details.openingHours);
	if (!slot) {
		throw new Error('No available call slots found');
	}

	// create call record
	const callId = nanoid();
	await db.insert(table.scheduledCalls).values({
		id: callId,
		userId: params.userId,
		therapistId: params.therapistId,
		therapistName: params.therapistName || details.name,
		therapistPhone: details.phone,
		eId: params.eId,
		scheduledAt: slot.date,
		attemptNumber: 1,
		maxAttempts: MAX_ATTEMPTS,
		status: 'scheduled',
		createdAt: now,
		updatedAt: now
	});

	// build dynamic variables
	const variables = buildPracticeCallVariables(
		params.patientName,
		params.patientInsurance,
		params.therapyType,
		params.callbackPhone,
		params.urgency
	);

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
// WEBHOOK HANDLING
// ============================================================================

export async function handleCallWebhook(
	db: ReturnType<typeof getDb>,
	payload: ElevenLabsWebhookPayload
): Promise<void> {
	const now = new Date();

	// find the call by conversation id
	const [call] = await db
		.select()
		.from(table.scheduledCalls)
		.where(eq(table.scheduledCalls.elevenlabsConvId, payload.conversation_id))
		.limit(1);

	if (!call) {
		console.error('[webhook] call not found for conversation:', payload.conversation_id);
		return;
	}

	// determine if we need to analyze transcript
	let analysis: Awaited<ReturnType<typeof analyzeTranscript>>['result'] | null = null;
	let analysisCost = 0;

	if (payload.status === 'completed' && payload.transcript) {
		const result = await analyzeTranscript(payload.transcript);
		analysis = result.result;
		analysisCost = result.cost.costUsd;

		// track analysis cost
		await db.insert(table.callCostEvents).values({
			id: nanoid(),
			callId: call.id,
			userId: call.userId,
			eventType: 'haiku_analyze_transcript',
			provider: 'anthropic',
			model: result.cost.model,
			inputTokens: result.cost.inputTokens,
			outputTokens: result.cost.outputTokens,
			costUsd: result.cost.costUsd.toFixed(6),
			createdAt: now
		});
	}

	// track elevenlabs call cost
	if (payload.duration_seconds) {
		const elCost = estimateCallCost(payload.duration_seconds);
		await db.insert(table.callCostEvents).values({
			id: nanoid(),
			callId: call.id,
			userId: call.userId,
			eventType: 'elevenlabs_call',
			provider: 'elevenlabs',
			durationSeconds: payload.duration_seconds,
			costUsd: elCost.toFixed(6),
			createdAt: now
		});
	}

	// determine outcome
	const outcome = analysis?.outcome || mapWebhookStatusToOutcome(payload.status);

	// update call record
	await db
		.update(table.scheduledCalls)
		.set({
			status: 'completed',
			outcome,
			transcript: payload.transcript || null,
			analysis: analysis ? JSON.stringify(analysis) : null,
			appointmentDate: analysis?.appointment?.date || null,
			appointmentTime: analysis?.appointment?.time || null,
			callbackInfo: analysis?.callbackInfo || null,
			rejectionReason: analysis?.rejectionReason || null,
			notes: analysis?.notes || null,
			durationSeconds: payload.duration_seconds || null,
			updatedAt: now,
			completedAt: now
		})
		.where(eq(table.scheduledCalls.id, call.id));

	// handle different outcomes
	await handleCallOutcome(db, call, outcome, analysis);
}

function mapWebhookStatusToOutcome(status: string): CallOutcome {
	switch (status) {
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
	analysis: Awaited<ReturnType<typeof analyzeTranscript>>['result'] | null
): Promise<void> {
	const now = new Date();

	switch (outcome) {
		case 'success':
			// deduct credit - fetch current then increment
			const [userCredits] = await db
				.select()
				.from(table.userCallCredits)
				.where(eq(table.userCallCredits.userId, call.userId))
				.limit(1);
			if (userCredits) {
				await db
					.update(table.userCallCredits)
					.set({ creditsUsed: (userCredits.creditsUsed ?? 0) + 1 })
					.where(eq(table.userCallCredits.userId, call.userId));
			}
			// todo: send notification
			break;

		case 'no_answer':
			// schedule retry if attempts remaining
			if ((call.attemptNumber || 1) < (call.maxAttempts || MAX_ATTEMPTS)) {
				await scheduleRetry(db, call);
			}
			break;

		case 'rejected_ai':
			// soft blocklist
			await addToBlocklist(db, call.eId!, call.therapistName!, 'ai_rejected', false, call.userId);
			break;

		case 'rejected_privacy':
			// permanent blocklist + log incident
			await addToBlocklist(db, call.eId!, call.therapistName!, 'privacy_concern', true, call.userId);
			await db.insert(table.privacyIncidents).values({
				id: nanoid(),
				callId: call.id,
				therapistEId: call.eId,
				severity: 'medium',
				transcriptExcerpt: analysis?.notes || null,
				actionTaken: 'permanent_blocklist',
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
	call: table.ScheduledCall
): Promise<void> {
	// get opening hours
	const [cached] = await db
		.select()
		.from(table.therapistCache)
		.where(eq(table.therapistCache.eId, call.eId!))
		.limit(1);

	if (!cached?.openingHours) {
		return; // can't retry without opening hours
	}

	const hours = JSON.parse(cached.openingHours) as OpeningHours;
	const newSlot = calculateRetrySlot(hours, call.scheduledAt, call.attemptNumber || 1);

	if (!newSlot) {
		return; // no available slots
	}

	const now = new Date();

	// update call for retry
	await db
		.update(table.scheduledCalls)
		.set({
			scheduledAt: newSlot.date,
			attemptNumber: (call.attemptNumber || 1) + 1,
			status: 'scheduled',
			updatedAt: now
		})
		.where(eq(table.scheduledCalls.id, call.id));

	// todo: re-trigger elevenlabs call
	// for now, just update the record - a cron job could pick it up
}

async function addToBlocklist(
	db: ReturnType<typeof getDb>,
	eId: string,
	therapistName: string,
	reason: string,
	permanent: boolean,
	userId: string
): Promise<void> {
	const now = new Date();
	const expiresAt = permanent ? null : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

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
				eq(table.scheduledCalls.status, 'scheduled')
			)
		)
		.limit(1);

	if (!call) {
		return false;
	}

	// todo: cancel with elevenlabs if possible

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

export async function addCredits(
	db: ReturnType<typeof getDb>,
	userId: string,
	amount: number
): Promise<void> {
	const [existing] = await db
		.select()
		.from(table.userCallCredits)
		.where(eq(table.userCallCredits.userId, userId))
		.limit(1);

	const now = new Date();

	if (existing) {
		await db
			.update(table.userCallCredits)
			.set({
				creditsTotal: (existing.creditsTotal ?? 0) + amount,
				lastRefillAt: now
			})
			.where(eq(table.userCallCredits.userId, userId));
	} else {
		await db.insert(table.userCallCredits).values({
			userId,
			creditsTotal: amount,
			creditsUsed: 0,
			creditsRefunded: 0,
			lastRefillAt: now
		});
	}
}
