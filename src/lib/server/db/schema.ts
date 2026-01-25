import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	patreonId: text('patreon_id').unique(),
	email: text('email'),
	username: text('username').notNull(),
	avatarUrl: text('avatar_url'),
	pledgeTier: text('pledge_tier'), // 'free' | 'supporter' | 'premium' etc
	pledgeAmountCents: integer('pledge_amount_cents'),
	syncEnabled: integer('sync_enabled', { mode: 'boolean' }).default(false),
	isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;

// synced user data (opt-in)
export const userCampaign = sqliteTable('user_campaign', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	campaignData: text('campaign_data'), // json blob
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const userContacts = sqliteTable('user_contacts', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	contactsData: text('contacts_data'), // json blob
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export type UserCampaign = typeof userCampaign.$inferSelect;
export type UserContacts = typeof userContacts.$inferSelect;

// ============================================================================
// AUTO-CALL SYSTEM TABLES
// ============================================================================

// scheduled calls - tracks all automated calls to therapist practices
export const scheduledCalls = sqliteTable('scheduled_calls', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	therapistId: text('therapist_id').notNull(),
	therapistName: text('therapist_name'),
	therapistPhone: text('therapist_phone').notNull(),
	eId: text('e_id'), // tk ärztefuehrer id
	elevenlabsConvId: text('elevenlabs_conv_id'),
	scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
	attemptNumber: integer('attempt_number').default(1),
	maxAttempts: integer('max_attempts').default(3),
	status: text('status').notNull(), // scheduled, in_progress, completed, failed, cancelled, frozen
	projectedSeconds: integer('projected_seconds').default(180), // estimated duration for credit reservation
	outcome: text('outcome'), // success, callback, no_answer, no_availability, rejected_ai, rejected_privacy, rejected_other, unclear
	transcript: text('transcript'),
	analysis: text('analysis'), // json from haiku
	appointmentDate: text('appointment_date'),
	appointmentTime: text('appointment_time'),
	callbackInfo: text('callback_info'),
	rejectionReason: text('rejection_reason'),
	notes: text('notes'),
	durationSeconds: integer('duration_seconds'),
	callMetadata: text('call_metadata'), // json with original call params for retries
	attemptHistory: text('attempt_history'), // json array of past attempts [{attempt, scheduledAt, completedAt, outcome, notes}]
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	completedAt: integer('completed_at', { mode: 'timestamp' })
});

export type ScheduledCall = typeof scheduledCalls.$inferSelect;
export type NewScheduledCall = typeof scheduledCalls.$inferInsert;

// therapist blocklist - practices that rejected ai calls or have privacy concerns
export const therapistBlocklist = sqliteTable('therapist_blocklist', {
	id: text('id').primaryKey(),
	eId: text('e_id').notNull().unique(),
	therapistName: text('therapist_name'),
	reason: text('reason').notNull(), // ai_rejected, privacy_concern, hostile, other
	details: text('details'),
	permanent: integer('permanent', { mode: 'boolean' }).default(false),
	reportedByUser: text('reported_by_user'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' })
});

export type TherapistBlocklist = typeof therapistBlocklist.$inferSelect;

// therapist cache - stores parsed details including opening hours
export const therapistCache = sqliteTable('therapist_cache', {
	eId: text('e_id').primaryKey(),
	name: text('name'),
	phone: text('phone'),
	address: text('address'),
	openingHours: text('opening_hours'), // json structured hours
	specialties: text('specialties'), // json array
	languages: text('languages'), // json array
	accessibility: text('accessibility'), // json
	rawHtml: text('raw_html'),
	fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type TherapistCache = typeof therapistCache.$inferSelect;

// user call credits - tracks monthly allocation and usage
export const userCallCredits = sqliteTable('user_call_credits', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id),
	creditsTotal: integer('credits_total').default(0),
	creditsUsed: integer('credits_used').default(0),
	creditsRefunded: integer('credits_refunded').default(0),
	version: integer('version').default(0), // optimistic locking
	lastRefillAt: integer('last_refill_at', { mode: 'timestamp' }),
	subscriptionStartedAt: integer('subscription_started_at', { mode: 'timestamp' }) // audit trail only
});

export type UserCallCredits = typeof userCallCredits.$inferSelect;

// credit audit log - append-only log of all credit operations for reconciliation
export const creditAuditLog = sqliteTable('credit_audit_log', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	eventType: text('event_type').notNull(), // allocate, reserve, deduct, refund, freeze, unfreeze
	seconds: integer('seconds').notNull(), // amount changed (positive or negative)
	callId: text('call_id').references(() => scheduledCalls.id), // null for allocate/refund events
	metadata: text('metadata'), // json with operation details
	balanceBefore: integer('balance_before'), // seconds available before this operation
	balanceAfter: integer('balance_after'), // seconds available after this operation
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type CreditAuditLog = typeof creditAuditLog.$inferSelect;

// call cost events - tracks all costs (elevenlabs, anthropic, etc.)
export const callCostEvents = sqliteTable('call_cost_events', {
	id: text('id').primaryKey(),
	callId: text('call_id').references(() => scheduledCalls.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	eventType: text('event_type').notNull(), // elevenlabs_call, haiku_parse_hours, haiku_analyze_transcript
	provider: text('provider').notNull(), // elevenlabs, anthropic
	model: text('model'),
	inputTokens: integer('input_tokens'),
	outputTokens: integer('output_tokens'),
	durationSeconds: integer('duration_seconds'),
	costUsd: text('cost_usd'), // stored as string for precision
	metadata: text('metadata'), // json for extra details
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type CallCostEvent = typeof callCostEvents.$inferSelect;

// privacy incidents - tracks potential issues for admin review
export const privacyIncidents = sqliteTable('privacy_incidents', {
	id: text('id').primaryKey(),
	callId: text('call_id').references(() => scheduledCalls.id),
	therapistEId: text('therapist_e_id'),
	severity: text('severity').notNull(), // low, medium, high
	transcriptExcerpt: text('transcript_excerpt'),
	actionTaken: text('action_taken'),
	adminReviewed: integer('admin_reviewed', { mode: 'boolean' }).default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type PrivacyIncident = typeof privacyIncidents.$inferSelect;

// webhook logs - stores raw webhook payloads for debugging
export const webhookLogs = sqliteTable('webhook_logs', {
	id: text('id').primaryKey(),
	source: text('source').notNull(), // elevenlabs, etc
	conversationId: text('conversation_id'),
	callId: text('call_id').references(() => scheduledCalls.id),
	status: text('status'),
	rawPayload: text('raw_payload').notNull(), // full json
	headers: text('headers'), // relevant headers as json
	processedAt: integer('processed_at', { mode: 'timestamp' }),
	processingError: text('processing_error'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type WebhookLog = typeof webhookLogs.$inferSelect;

// validation overrides - whitelist for users flagged by validation but are legit
export const validationOverrides = sqliteTable('validation_overrides', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id),
	reason: text('reason'), // why they were whitelisted
	approvedBy: text('approved_by'), // admin who approved
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type ValidationOverride = typeof validationOverrides.$inferSelect;
