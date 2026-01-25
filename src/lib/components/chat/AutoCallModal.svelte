<script lang="ts">
	import { untrack } from 'svelte';
	import { wobbly } from '$lib/utils/wobbly';
	import { X, Loader2, CheckCircle, AlertCircle, Phone, Trash2, Clock, Calendar, PhoneCall, History, XCircle, Info, ChevronLeft, MessageSquare, Hash, ExternalLink, Pause } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import type { Therapist } from '$lib/types';
	import { debug, DEBUG_THERAPIST_ID } from '$lib/stores/debug';
	import { contacts } from '$lib/stores/contacts';
	import { campaignDraft } from '$lib/stores/campaign';
	import { get } from 'svelte/store';
	import { CallStatus, CallOutcome, getStatusColor, getOutcomeColor } from '$lib/data/callConstants';
	import { m } from '$lib/paraglide/messages';
	import { track } from '$lib/utils/analytics';
	import CallCreditsDisplay from '$lib/components/ui/CallCreditsDisplay.svelte';

	// i18n status labels
	function getStatusLabelI18n(status: string, attemptNumber?: number): string {
		if (status === 'scheduled' && attemptNumber && attemptNumber > 1) {
			return m.call_status_scheduled_retry();
		}
		switch (status) {
			case 'scheduled': return m.call_status_scheduled();
			case 'in_progress': return m.call_status_in_progress();
			case 'completed': return m.call_status_completed();
			case 'failed': return m.call_status_failed();
			case 'cancelled': return m.call_status_cancelled();
			case 'frozen': return m.call_status_frozen();
			default: return status;
		}
	}

	// i18n outcome labels
	function getOutcomeLabelI18n(outcome: string): string {
		switch (outcome) {
			case 'success': return m.call_outcome_success();
			case 'callback': return m.call_outcome_callback();
			case 'no_answer': return m.call_outcome_no_answer();
			case 'no_availability': return m.call_outcome_no_availability();
			case 'rejected_ai': return m.call_outcome_rejected_ai();
			case 'rejected_privacy': return m.call_outcome_rejected_privacy();
			case 'rejected_other': return m.call_outcome_rejected_other();
			case 'unclear': return m.call_outcome_unclear();
			case 'connection_failed': return m.call_outcome_connection_failed();
			default: return outcome;
		}
	}

	// status color is based on status only - completed is always green (call worked)
	// outcome badge has its own colors

	function isCallCompleted(status: string): boolean {
		return status === 'completed';
	}

	function formatCredits(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}:00`;
	}

	function getGiftedSeconds(analysis?: string): number | null {
		if (!analysis) return null;
		try {
			const parsed = JSON.parse(analysis);
			return parsed.giftedSeconds ?? null;
		} catch {
			return null;
		}
	}

	interface Props {
		therapist: Therapist;
		open: boolean;
		onClose: () => void;
	}

	let { therapist, open, onClose }: Props = $props();

	type Step = 'loading' | 'confirm' | 'form' | 'form2' | 'scheduling' | 'success' | 'error' | 'history' | 'details' | 'timeline';
	let step = $state<Step>('loading');
	let error = $state<string | null>(null);
	let errorIsInsufficientCredits = $state<boolean>(false);
	let scheduledTime = $state<string | null>(null);
	let selectedCallId = $state<string | null>(null);
	let rateLimitRetrySeconds = $state<number>(0);
	let rateLimitInterval: ReturnType<typeof setInterval> | null = null;

	function startRateLimitCountdown() {
		if (rateLimitInterval) clearInterval(rateLimitInterval);
		if (rateLimitRetrySeconds > 0) {
			rateLimitInterval = setInterval(() => {
				rateLimitRetrySeconds--;
				if (rateLimitRetrySeconds <= 0 && rateLimitInterval) {
					clearInterval(rateLimitInterval);
					rateLimitInterval = null;
				}
			}, 1000);
		}
	}

	function formatCountdown(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) {
			const m = Math.floor(seconds / 60);
			const s = seconds % 60;
			return s > 0 ? `${m}m ${s}s` : `${m}m`;
		}
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}

	// persist form data in localStorage
	const STORAGE_KEY = 'karl_call_form';
	interface SavedFormData {
		fullName: string;
		callbackPhone: string;
		email: string;
		pronouns: string;
		joinWaitlist: boolean;
	}

	function loadSavedForm(): SavedFormData {
		if (!browser) return { fullName: '', callbackPhone: '', email: '', pronouns: 'auto', joinWaitlist: true };
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) return JSON.parse(saved);
		} catch {}
		return { fullName: '', callbackPhone: '', email: '', pronouns: 'auto', joinWaitlist: true };
	}

	function saveForm() {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				fullName: fullName.trim(),
				callbackPhone: callbackPhone.trim(),
				email: email.trim(),
				pronouns,
				joinWaitlist
			}));
		} catch {}
	}

	// preflight data
	interface AttemptRecord {
		attempt: number;
		scheduledAt?: string;
		completedAt?: string;
		outcome?: string;
		notes?: string;
	}

	interface CallRecord {
		id: string;
		status: string;
		outcome?: string;
		scheduledAt?: string;
		completedAt?: string;
		createdAt?: string;
		updatedAt?: string;
		durationSeconds?: number;
		appointmentDate?: string;
		appointmentTime?: string;
		callbackInfo?: string;
		rejectionReason?: string;
		notes?: string;
		transcript?: string;
		analysis?: string;
		elevenlabsConvId?: string;
		attemptNumber?: number;
		maxAttempts?: number;
		therapistPhone?: string;
		attemptHistory?: AttemptRecord[];
	}

	interface PreflightData {
		therapist: {
			name?: string;
			phone?: string;
			openingHours: {
				regular: Array<{ day: string; start: string; end: string }>;
				sprechstunde?: Array<{ day: string; start: string; end: string }>;
				notes?: string;
			};
		};
		nextSlot: {
			date: string;
			isSprechstunde: boolean;
			isImmediate: boolean;
		} | null;
		existingCalls: CallRecord[];
		canSchedule: boolean;
		canScheduleReason?: string;
		creditsRemaining?: number;
		projectedSeconds?: number;
		credits?: {
			availableSeconds: number;
			projectedSeconds: number;
			tierSeconds: number;
			totalSeconds: number;
			pendingCalls: number;
		};
	}
	let preflightData = $state<PreflightData | null>(null);

	// form fields
	let fullName = $state('');
	let callbackPhone = $state('');
	let email = $state('');
	let pronouns = $state('auto');
	let joinWaitlist = $state(true);
	let healthDataConsent = $state(false);
	let consent = $state(false);
	let formLoaded = $state(false);

	const pronounOptions = [
		{ value: 'auto', label: m.autocall_pronouns_auto() },
		{ value: 'she', label: m.autocall_pronouns_she() },
		{ value: 'he', label: m.autocall_pronouns_he() },
		{ value: 'they', label: m.autocall_pronouns_they() },
		{ value: 'none', label: m.autocall_pronouns_none() }
	];

	const isDebugTherapist = $derived(therapist.id === DEBUG_THERAPIST_ID);
	const isDebugMode = $derived($debug.enabled);

	// phone validation: must start with 0 or +, 8-20 chars
	function isValidPhone(phone: string): boolean {
		const clean = phone.replace(/\s/g, '');
		return /^(0|\+)[\d\-/()]{7,19}$/.test(clean);
	}
	const phoneError = $derived(
		callbackPhone.trim().length > 0 && !isValidPhone(callbackPhone)
			? 'Telefonnummer muss mit 0 oder + beginnen'
			: ''
	);

	// single effect for modal open: load form data, prefill debug phone, fetch preflight
	$effect(() => {
		if (!open) return;

		// use untrack to prevent form field reads from triggering effect re-runs
		untrack(() => {
			// load saved form data (only once per component lifecycle)
			if (!formLoaded && browser) {
				const saved = loadSavedForm();
				if (saved.fullName) fullName = saved.fullName;
				if (saved.callbackPhone) callbackPhone = saved.callbackPhone;
				if (saved.email) email = saved.email;
				if (saved.pronouns) pronouns = saved.pronouns;
				if (saved.joinWaitlist !== undefined) joinWaitlist = saved.joinWaitlist;
				formLoaded = true;
			}

			// prefill callback phone from debug store if empty
			if (isDebugMode && !callbackPhone) {
				const debugState = get(debug);
				if (debugState.callbackPhone) {
					callbackPhone = debugState.callbackPhone;
				}
			}
		});

		fetchPreflight();
	});

	async function fetchPreflight() {
		step = 'loading';
		error = null;
		preflightData = null;
		rateLimitRetrySeconds = 0;
		if (rateLimitInterval) {
			clearInterval(rateLimitInterval);
			rateLimitInterval = null;
		}

		try {
			const params = new URLSearchParams({ eId: therapist.id });
			if (isDebugMode) {
				params.set('isDebug', 'true');
			}

			const response = await fetch(`/api/calls/preflight?${params}`);
			if (!response.ok) {
				const data = await response.json().catch(() => ({})) as { message?: string; retryAfter?: number };

				// handle rate limiting (429)
				if (response.status === 429) {
					const message = data.message || '';
					const retryAfter = data.retryAfter || 10;
					rateLimitRetrySeconds = retryAfter;
					throw new Error(message || m.autocall_error_rate_limit({ seconds: String(retryAfter) }));
				}

				throw new Error(data.message || `Error ${response.status}`);
			}

			const data = await response.json() as PreflightData;
			preflightData = data;

			// if there are existing calls, show history first
			if (data.existingCalls.length > 0) {
				step = 'history';
			} else if (data.nextSlot) {
				step = 'confirm';
			} else {
				error = m.autocall_no_times();
				step = 'error';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : m.autocall_error_loading();
			step = 'error';
			startRateLimitCountdown();
		}
	}

	const canProceedToStep2 = $derived(
		fullName.trim().length >= 2 &&
		isValidPhone(callbackPhone)
	);

	const canSubmit = $derived(
		canProceedToStep2 &&
		healthDataConsent &&
		consent
	);

	function proceedToForm() {
		step = 'form';
	}

	function proceedToStep2() {
		if (!canProceedToStep2) return;
		saveForm();
		step = 'form2';
	}

	async function handleSubmit() {
		if (!canSubmit || !preflightData?.nextSlot) return;

		step = 'scheduling';
		error = null;
		errorIsInsufficientCredits = false;

		// save form data for next time
		saveForm();

		const campaign = get(campaignDraft);
		const insuranceMap: Record<string, string> = {
			GKV: 'gesetzlich versichert',
			PKV: 'privat versichert',
			Selbstzahler: 'Selbstzahler'
		};

		try {
			const debugState = get(debug);
			const response = await fetch('/api/calls/schedule', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					therapistId: therapist.id,
					therapistName: therapist.name,
					eId: therapist.id,
					patientName: fullName.trim(),
					patientInsurance: insuranceMap[campaign.insuranceType || 'GKV'] || 'gesetzlich versichert',
					therapyType: campaign.therapyTypes?.length ? campaign.therapyTypes[0] : 'Psychotherapie',
					callbackPhone: callbackPhone.trim(),
					patientEmail: email.trim() || undefined,
					urgency: campaign.urgency || 'medium',
					isDebug: isDebugMode || isDebugTherapist,
					debugTestPhone: isDebugMode ? debugState.testPhone : undefined
				})
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({})) as { message?: string; retryAfter?: number };

				// handle insufficient credits (402)
				if (response.status === 402) {
					errorIsInsufficientCredits = true;
				}

				// handle rate limiting (429)
				if (response.status === 429) {
					const message = data.message || '';
					const retryAfter = data.retryAfter || 10;
					rateLimitRetrySeconds = retryAfter;
					throw new Error(message || m.autocall_error_rate_limit({ seconds: String(retryAfter) }));
				}

				throw new Error(data.message || `Error ${response.status}`);
			}

			const data = await response.json() as { scheduledAt: string };
			scheduledTime = formatDateTime(data.scheduledAt);

			// add to contacts (store handles uniqueness by therapistId)
			contacts.add({
				therapistId: therapist.id,
				therapistName: therapist.name,
				therapistEmail: therapist.email,
				therapistPhone: therapist.phone,
				therapistAddress: therapist.address,
				method: 'auto-call',
				status: 'pending'
			});

			step = 'success';
		} catch (e) {
			error = e instanceof Error ? e.message : m.autocall_error_unknown();
			// track validation rejections
			if (error.includes('validiert werden')) {
				// extract reason between the two \n\n blocks
				const reasonMatch = error.match(/validiert werden:\n\n(.+?)\.\n\n/s);
				track('validation_rejected', { reason: reasonMatch?.[1] || 'unknown' });
			}
			step = 'error';
			startRateLimitCountdown();
		}
	}

	function handleClose() {
		if (step === 'scheduling') return;
		rateLimitRetrySeconds = 0;
		onClose();
	}

	async function handleCancel(callId: string) {
		if (!confirm(m.autocall_cancel_confirm())) return;

		try {
			const response = await fetch('/api/calls/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ callId })
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				console.error('[AutoCallModal] cancel failed:', data);
			}

			contacts.removeByTherapistId(therapist.id);
			await fetchPreflight();
		} catch (e) {
			console.error('[AutoCallModal] cancel error:', e);
		}
	}

	function showDetails(callId: string) {
		selectedCallId = callId;
		step = 'details';
	}

	function showTimeline(callId: string) {
		selectedCallId = callId;
		step = 'timeline';
	}

	const selectedCall = $derived(
		preflightData?.existingCalls.find(c => c.id === selectedCallId)
	);

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
	}

	function parseAnalysis(analysisJson: string | undefined): Record<string, unknown> | null {
		if (!analysisJson) return null;
		try {
			return JSON.parse(analysisJson);
		} catch {
			return null;
		}
	}

	// formatting helpers
	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleString('de-DE', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const dayNames = $derived<Record<string, string>>({
		mon: m.day_mon(), tue: m.day_tue(), wed: m.day_wed(), thu: m.day_thu(), fri: m.day_fri(), sat: m.day_sat(), sun: m.day_sun()
	});

	function formatOpeningHours(hours: PreflightData['therapist']['openingHours']): string[] {
		if (!hours.regular.length) return [];

		// group by day
		const byDay: Record<string, string[]> = {};
		for (const slot of hours.regular) {
			const day = dayNames[slot.day] || slot.day;
			if (!byDay[day]) byDay[day] = [];
			byDay[day].push(`${slot.start}–${slot.end}`);
		}

		return Object.entries(byDay).map(([day, times]) => `${day} ${times.join(', ')}`);
	}

</script>

{#if open}
	<div class="modal-backdrop" onclick={handleClose} onkeydown={(e) => e.key === 'Escape' && handleClose()} role="button" tabindex="-1">
		<div
			class="modal-content"
			style:border-radius={wobbly.lg}
			onclick={(e) => e.stopPropagation()}
			role="presentation"
			tabindex="-1"
		>
			<button class="close-btn" onclick={handleClose} disabled={step === 'scheduling'}>
				<X size={20} />
			</button>

			<div class="modal-header">
				<PhoneCall size={24} />
				<h2>{m.autocall_title()}</h2>
			</div>

			<p class="therapist-name">{therapist.name}</p>

			{#if step === 'loading'}
				<div class="state-view">
					<Loader2 size={48} class="animate-spin text-blue-pen" />
					<p class="state-title">{m.autocall_loading()}</p>
					<p class="state-hint">{m.autocall_loading_hint()}</p>
				</div>

			{:else if step === 'history'}
				{@const activeCalls = (preflightData?.existingCalls || []).filter(c => c.status !== 'cancelled')}
				{@const cancelledCalls = (preflightData?.existingCalls || []).filter(c => c.status === 'cancelled')}
				<div class="history-section">
					<div class="history-header">
						<History size={18} />
						<span>{m.autocall_history_title()}</span>
					</div>

					<div class="calls-list">
						{#each activeCalls as call}
							<div class="call-item">
								<div class="call-status {getStatusColor(call.status)}">
									{#if isCallCompleted(call.status)}
										<CheckCircle size={16} />
									{:else if call.status === 'scheduled'}
										<Clock size={16} />
									{:else if call.status === 'frozen'}
										<Pause size={16} />
									{:else}
										<XCircle size={16} />
									{/if}
									<span>{getStatusLabelI18n(call.status, call.attemptNumber)}</span>
								</div>

								<div class="call-details">
									{#if call.status === 'frozen'}
										<span class="call-frozen-hint">{m.autocall_frozen_hint()}</span>
									{/if}
									{#if call.scheduledAt}
										<span class="call-time">{formatDateTime(call.scheduledAt)}</span>
									{/if}
									{#if call.status === 'scheduled' && call.attemptNumber && call.attemptNumber > 1}
										<span class="call-attempt">{m.autocall_attempt({ current: call.attemptNumber, max: call.maxAttempts || 3 })}</span>
									{/if}
									{#if call.outcome}
										<span class="call-outcome">{getOutcomeLabelI18n(call.outcome)}</span>
									{/if}
									{#if call.appointmentDate}
										<span class="call-appointment">Termin: {call.appointmentDate} {call.appointmentTime}</span>
									{/if}
									{#if call.status === 'failed' && call.notes}
										<span class="call-notes-preview">{call.notes.slice(0, 60)}...</span>
									{/if}
								</div>

								<div class="call-actions">
									{#if call.status === 'scheduled'}
										<button class="action-link cancel-link" onclick={() => handleCancel(call.id)}>
											<Trash2 size={14} />
											{m.autocall_cancel()}
										</button>
									{/if}
									{#if call.status === 'scheduled' && (call.attemptHistory?.length || (call.attemptNumber && call.attemptNumber > 1))}
										<button class="action-link info-link" onclick={() => showTimeline(call.id)}>
											<History size={14} />
											{m.autocall_timeline_title()}
										</button>
									{/if}
									{#if call.status === 'completed' || call.status === 'failed'}
										<button class="action-link info-link" onclick={() => showDetails(call.id)}>
											<Info size={14} />
											{m.autocall_more_info()}
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					{#if cancelledCalls.length > 0}
						<details class="cancelled-calls">
							<summary>
								<ChevronLeft size={14} class="chevron" />
								{m.autocall_history_cancelled({ count: cancelledCalls.length })}
							</summary>
							<div class="calls-list">
								{#each cancelledCalls as call}
									<div class="call-item cancelled">
										<div class="call-status {getStatusColor(call.status)}">
											<XCircle size={16} />
											<span>{getStatusLabelI18n(call.status)}</span>
										</div>
										<div class="call-details">
											{#if call.scheduledAt}
												<span class="call-time">{formatDateTime(call.scheduledAt)}</span>
											{/if}
											{#if call.attemptNumber && call.attemptNumber > 1}
												<span class="call-attempt">{m.autocall_attempt({ current: call.attemptNumber, max: call.maxAttempts || 12 })}</span>
											{/if}
											{#if call.outcome}
												<span class="call-outcome">{getOutcomeLabelI18n(call.outcome)}</span>
											{/if}
										</div>
										<div class="call-actions">
											{#if call.attemptHistory?.length || call.outcome || call.notes || (call.attemptNumber && call.attemptNumber > 1)}
												<button class="action-link info-link" onclick={() => showDetails(call.id)}>
													<Info size={14} />
													{m.autocall_more_info()}
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</details>
					{/if}

					{#if preflightData?.nextSlot && preflightData.canSchedule}
						<button class="new-call-btn" style:border-radius={wobbly.button} onclick={() => step = 'confirm'}>
							<Phone size={18} />
							{m.autocall_new_call()}
						</button>
					{:else if !preflightData?.canSchedule}
						{#if preflightData?.canScheduleReason === 'no_credits' && preflightData?.credits}
							<div class="mb-4">
								<CallCreditsDisplay
									availableSeconds={preflightData.credits.availableSeconds}
									projectedSeconds={preflightData.credits.projectedSeconds}
									tierSeconds={preflightData.credits.tierSeconds}
									totalSeconds={preflightData.credits.totalSeconds}
									pendingCalls={preflightData.credits.pendingCalls}
									compact={true}
									showTitle={true}
								/>
							</div>
							<p class="blocked-hint">
								{m.autocall_blocked_no_credits({
									available: formatCredits(preflightData?.creditsRemaining ?? 0),
									pending: formatCredits(preflightData?.projectedSeconds ?? 0)
								})}
							</p>
						{:else}
							<p class="blocked-hint">
								{#if preflightData?.canScheduleReason === 'call_already_scheduled'}
									{m.autocall_blocked_scheduled()}
								{:else if preflightData?.canScheduleReason === 'therapist_blocked'}
									{m.autocall_blocked_practice()}
								{:else if preflightData?.canScheduleReason === 'tier_required'}
									{m.autocall_blocked_tier()}
								{:else if preflightData?.canScheduleReason === 'no_credits'}
									{m.autocall_blocked_no_credits({
										available: formatCredits(preflightData?.creditsRemaining ?? 0),
										pending: formatCredits(preflightData?.projectedSeconds ?? 0)
									})}
								{:else}
									{m.autocall_blocked_default()}
								{/if}
							</p>
						{/if}
					{/if}
				</div>

			{:else if step === 'details'}
				{#if selectedCall}
					{@const analysis = parseAnalysis(selectedCall.analysis)}
					<div class="details-section">
						<button class="back-link" onclick={() => step = 'history'}>
							<ChevronLeft size={16} />
							{m.autocall_back()}
						</button>

						<!-- status header with outcome badge -->
						<div class="details-header">
							<div class="details-status {getStatusColor(selectedCall.status)}">
								{#if isCallCompleted(selectedCall.status)}
									<CheckCircle size={20} />
								{:else if selectedCall.status === CallStatus.SCHEDULED}
									<Clock size={20} />
								{:else if selectedCall.status === CallStatus.IN_PROGRESS}
									<Loader2 size={20} class="animate-spin" />
								{:else}
									<XCircle size={20} />
								{/if}
								<span>{getStatusLabelI18n(selectedCall.status, selectedCall.attemptNumber)}</span>
							</div>
							{#if selectedCall.outcome}
								<span class="outcome-badge {getOutcomeColor(selectedCall.outcome)}">{getOutcomeLabelI18n(selectedCall.outcome)}</span>
							{/if}
						</div>

						<!-- appointment highlight (if successful) -->
						{#if selectedCall.appointmentDate}
							<div class="appointment-card">
								<Calendar size={24} class="shrink-0" />
								<div>
									<span class="appointment-label">{m.autocall_appointment_title()}</span>
									<span class="appointment-value">{selectedCall.appointmentDate} {selectedCall.appointmentTime || ''}</span>
								</div>
							</div>
						{/if}

						<!-- callback info highlight -->
						{#if selectedCall.callbackInfo}
							<div class="callback-card">
								<Phone size={20} class="shrink-0" />
								<div>
									<span class="callback-label">{m.autocall_callback_title()}</span>
									<span class="callback-value">{selectedCall.callbackInfo}</span>
								</div>
							</div>
						{/if}

						<!-- rejection warning -->
						{#if selectedCall.rejectionReason}
							<div class="rejection-card">
								<AlertCircle size={20} class="shrink-0" />
								<div>
									<span class="rejection-label">{m.autocall_rejection_title()}</span>
									<span class="rejection-value">{selectedCall.rejectionReason}</span>
								</div>
							</div>
						{/if}

						<!-- summary -->
						{#if selectedCall.notes}
							<div class="summary-card">
								<MessageSquare size={18} class="shrink-0" />
								<p>{selectedCall.notes}</p>
							</div>
						{/if}

						<!-- call timing details -->
						<div class="timing-section">
							<h4><Clock size={14} class="shrink-0" /> {m.autocall_timing_title()}</h4>
							<div class="timing-grid">
								{#if selectedCall.scheduledAt}
									<div class="timing-item">
										<span class="timing-label">{m.autocall_timing_scheduled()}</span>
										<span class="timing-value">{formatDateTime(selectedCall.scheduledAt)}</span>
									</div>
								{/if}
								{#if selectedCall.completedAt}
									<div class="timing-item">
										<span class="timing-label">{m.autocall_timing_completed()}</span>
										<span class="timing-value">{formatDateTime(selectedCall.completedAt)}</span>
									</div>
								{/if}
								{#if selectedCall.durationSeconds}
									<div class="timing-item">
										<span class="timing-label">{m.autocall_timing_duration()}</span>
										<span class="timing-value">{formatDuration(selectedCall.durationSeconds)}</span>
									</div>
								{/if}
								{#if getGiftedSeconds(selectedCall.analysis)}
									<div class="timing-item gifted">
										<span class="timing-label">{m.autocall_timing_gifted()}</span>
										<span class="timing-value">{formatDuration(getGiftedSeconds(selectedCall.analysis)!)} ✨</span>
									</div>
								{/if}
								{#if selectedCall.attemptNumber}
									<div class="timing-item">
										<span class="timing-label">{m.autocall_timing_attempt()}</span>
										<span class="timing-value">{selectedCall.attemptNumber} / {selectedCall.maxAttempts || 3}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- transcript -->
						{#if selectedCall.transcript}
							<div class="transcript-section">
								<h4><MessageSquare size={14} class="shrink-0" /> {m.autocall_transcript_title()}</h4>
								<div class="transcript-container">
									{#each selectedCall.transcript.split('\n') as line}
										{@const isAgent = line.startsWith('agent:')}
										{@const isUser = line.startsWith('user:')}
										<div class="transcript-line" class:agent={isAgent} class:user={isUser}>
											{#if isAgent}
												<span class="speaker agent">{m.autocall_speaker_karl()}</span>
											{:else if isUser}
												<span class="speaker user">{m.autocall_speaker_practice()}</span>
											{/if}
											<span class="message">{line.replace(/^(agent|user):\s*/, '')}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- elevenlabs analysis (structured) -->
						{#if analysis}
							<div class="analysis-section">
								<h4><Info size={14} class="shrink-0" /> {m.autocall_analysis_title()}</h4>

								{#if analysis.call_successful}
									<div class="analysis-row">
										<span class="analysis-label">{m.autocall_analysis_success()}</span>
										<span class="analysis-value {analysis.call_successful === 'success' ? 'success' : 'failure'}">
											{analysis.call_successful}
										</span>
									</div>
								{/if}

								{#if analysis.transcript_summary}
									<div class="analysis-summary">
										<span class="analysis-label">{m.autocall_analysis_summary()}</span>
										<p>{analysis.transcript_summary}</p>
									</div>
								{/if}

								{#if analysis.data_collection_results}
									<div class="data-collection">
										<span class="analysis-label">{m.autocall_analysis_data()}</span>
										<div class="data-grid">
											{#each Object.entries(analysis.data_collection_results) as [key, result]}
												{@const r = result as { value?: string; rationale?: string }}
												<div class="data-item">
													<span class="data-key">{key.replace(/_/g, ' ')}</span>
													<span class="data-value">{r.value || '–'}</span>
													{#if r.rationale}
														<span class="data-rationale">{r.rationale}</span>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}

						<!-- attempt history (if retried) -->
						{#if selectedCall.attemptHistory?.length || (selectedCall.attemptNumber && selectedCall.attemptNumber > 1)}
							{@const allAttempts = [
								...(selectedCall.attemptHistory || []),
								{
									attempt: selectedCall.attemptNumber || 1,
									scheduledAt: selectedCall.scheduledAt,
									completedAt: selectedCall.completedAt,
									outcome: selectedCall.outcome,
									notes: selectedCall.notes
								}
							]}
							<details class="attempt-history-details" open>
								<summary><History size={14} class="shrink-0" /> {m.autocall_history_previous({ count: allAttempts.length })}</summary>
								<div class="timeline-list compact">
									{#each allAttempts as attempt}
										<div class="timeline-item">
											<div class="timeline-marker {attempt.outcome ? getStatusColor(attempt.outcome) : 'neutral'}">
												<span class="attempt-num">{attempt.attempt}</span>
											</div>
											<div class="timeline-content">
												<div class="timeline-header">
													<span class="timeline-date">
														{#if attempt.scheduledAt}
															{formatDateTime(attempt.scheduledAt)}
														{/if}
													</span>
													{#if attempt.outcome}
														<span class="timeline-outcome {getOutcomeColor(attempt.outcome)}">
															{getOutcomeLabelI18n(attempt.outcome)}
														</span>
													{/if}
												</div>
												{#if attempt.notes}
													<p class="timeline-notes">{attempt.notes}</p>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</details>
						{/if}

						<!-- technical details (collapsible) -->
						<details class="tech-details">
							<summary><Hash size={14} class="shrink-0" /> {m.autocall_tech_title()}</summary>
							<div class="tech-grid">
								<div class="tech-item">
									<span class="tech-label">{m.autocall_tech_call_id()}</span>
									<code class="tech-value">{selectedCall.id}</code>
								</div>
								{#if selectedCall.elevenlabsConvId}
									<div class="tech-item">
										<span class="tech-label">{m.autocall_tech_conv_id()}</span>
										<code class="tech-value">{selectedCall.elevenlabsConvId}</code>
									</div>
								{/if}
								{#if selectedCall.therapistPhone}
									<div class="tech-item">
										<span class="tech-label">{m.autocall_tech_phone()}</span>
										<code class="tech-value">{selectedCall.therapistPhone}</code>
									</div>
								{/if}
								{#if selectedCall.createdAt}
									<div class="tech-item">
										<span class="tech-label">{m.autocall_tech_created()}</span>
										<span class="tech-value">{formatDateTime(selectedCall.createdAt)}</span>
									</div>
								{/if}
								{#if selectedCall.updatedAt}
									<div class="tech-item">
										<span class="tech-label">{m.autocall_tech_updated()}</span>
										<span class="tech-value">{formatDateTime(selectedCall.updatedAt)}</span>
									</div>
								{/if}
							</div>
						</details>
					</div>
				{/if}

			{:else if step === 'timeline'}
				{#if selectedCall}
					<div class="timeline-section">
						<button class="back-link" onclick={() => step = 'history'}>
							<ChevronLeft size={16} />
							{m.autocall_back()}
						</button>

						<!-- next scheduled call -->
						<div class="next-call-card">
							<div class="next-call-header">
								<Clock size={20} class="text-blue-pen shrink-0" />
								<span>{m.autocall_timeline_next()}</span>
							</div>
							<div class="next-call-time">
								{#if selectedCall.scheduledAt}
									<span class="next-date">{formatDate(selectedCall.scheduledAt)}</span>
									<span class="next-time">{formatTime(selectedCall.scheduledAt)} Uhr</span>
								{/if}
							</div>
							<div class="next-call-attempt">
								{m.autocall_timeline_attempt_of({ current: selectedCall.attemptNumber || 1, max: selectedCall.maxAttempts || 3 })}
							</div>
						</div>

						<!-- previous attempts timeline -->
						{#if selectedCall.attemptHistory?.length}
							<div class="attempts-timeline">
								<h4><History size={16} class="shrink-0" /> {m.autocall_timeline_previous()}</h4>
								<div class="timeline-list">
									{#each selectedCall.attemptHistory as attempt, i}
										<div class="timeline-item">
											<div class="timeline-marker {attempt.outcome ? getStatusColor(attempt.outcome) : 'neutral'}">
												<span class="attempt-num">{attempt.attempt}</span>
											</div>
											<div class="timeline-content">
												<div class="timeline-header">
													<span class="timeline-date">
														{#if attempt.scheduledAt}
															{formatDateTime(attempt.scheduledAt)}
														{/if}
													</span>
													{#if attempt.outcome}
														<span class="timeline-outcome {getOutcomeColor(attempt.outcome)}">
															{getOutcomeLabelI18n(attempt.outcome)}
														</span>
													{/if}
												</div>
												{#if attempt.notes}
													<p class="timeline-notes">{attempt.notes}</p>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{:else if selectedCall.attemptNumber && selectedCall.attemptNumber > 1}
							<div class="no-history-hint">
								<p>{m.autocall_timeline_no_history()}</p>
								<p class="hint-small">{m.autocall_timeline_this_is_attempt({ attempt: selectedCall.attemptNumber })}</p>
							</div>
						{/if}

						<!-- actions -->
						<div class="timeline-actions">
							<button class="action-link cancel-link" onclick={() => handleCancel(selectedCall.id)}>
								<Trash2 size={14} />
								{m.autocall_cancel()}
							</button>
						</div>
					</div>
				{/if}

			{:else if step === 'confirm'}
				<div class="confirm-section">
					<div class="proposed-time">
						<div class="time-icon">
							<Calendar size={32} class="text-blue-pen" />
						</div>
						<div class="time-details">
							<p class="time-label">{m.autocall_proposed_time()}</p>
							{#if preflightData?.nextSlot}
								<p class="time-value">{formatDate(preflightData.nextSlot.date)}</p>
								<p class="time-value-lg">{formatTime(preflightData.nextSlot.date)} {m.autocall_time_suffix()}</p>
								{#if preflightData.nextSlot.isSprechstunde}
									<p class="time-hint sprechstunde">{m.autocall_phone_hours()}</p>
								{/if}
								{#if preflightData.nextSlot.isImmediate}
									<p class="time-hint debug">{m.autocall_debug_immediate()}</p>
								{/if}
							{/if}
						</div>
					</div>

					{#if preflightData?.therapist.openingHours.regular.length}
						<div class="opening-hours">
							<p class="hours-label">{m.autocall_opening_hours()}</p>
							<div class="hours-list">
								{#each formatOpeningHours(preflightData.therapist.openingHours) as line}
									<span class="hours-line">{line}</span>
								{/each}
							</div>
						</div>
					{/if}

					{#if preflightData?.creditsRemaining !== undefined}
						<div class="credits-info">
							<Clock size={14} />
							<span>{m.autocall_confirm_credits({ available: formatCredits(preflightData.creditsRemaining) })}</span>
						</div>
					{/if}

					<div class="confirm-question">
						<p>{m.autocall_confirm_question({
							date: preflightData?.nextSlot ? formatDate(preflightData.nextSlot.date) : '',
							time: preflightData?.nextSlot ? formatTime(preflightData.nextSlot.date) + ' ' + m.autocall_time_suffix() : '',
							name: therapist.name
						})}</p>
					</div>

					<div class="confirm-actions">
						{#if preflightData?.existingCalls.length}
							<button class="confirm-btn secondary" style:border-radius={wobbly.button} onclick={() => step = 'history'}>
								{m.autocall_back()}
							</button>
						{/if}
						<button class="confirm-btn primary" style:border-radius={wobbly.button} onclick={proceedToForm}>
							{m.autocall_confirm_yes()}
						</button>
					</div>
				</div>

			{:else if step === 'form'}
				<div class="form">
					<div class="form-header">
						<p class="form-time">
							{m.autocall_form_time({ time: preflightData?.nextSlot ? formatDateTime(preflightData.nextSlot.date) : '' })}
							{#if preflightData?.nextSlot?.isImmediate}
								<span class="debug-badge">{m.autocall_form_debug()}</span>
							{/if}
						</p>
						<p class="step-indicator">Schritt 1 von 2</p>
					</div>

					<div class="field">
						<label for="fullName">{m.autocall_form_name()} *</label>
						<input
							id="fullName"
							type="text"
							bind:value={fullName}
							placeholder="Max Mustermann"
							class="input"
							style:border-radius={wobbly.sm}
							required
						/>
						<p class="hint">{m.autocall_form_name_hint()}</p>
					</div>

					<div class="field">
						<label for="callbackPhone">{m.autocall_form_phone()} *</label>
						<input
							id="callbackPhone"
							type="tel"
							bind:value={callbackPhone}
							placeholder="+49 170 1234567"
							class="input"
							class:input-error={phoneError}
							style:border-radius={wobbly.sm}
							required
						/>
						{#if phoneError}
							<p class="field-error">{phoneError}</p>
						{:else}
							<p class="hint">{m.autocall_form_phone_hint()}</p>
						{/if}
					</div>

					<div class="field">
						<label for="email">{m.autocall_form_email()}</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="max@beispiel.de"
							class="input"
							style:border-radius={wobbly.sm}
						/>
						<p class="hint">{m.autocall_form_email_hint()}</p>
					</div>

					<div class="form-actions">
						<button class="back-btn" type="button" style:border-radius={wobbly.button} onclick={() => step = 'confirm'}>
							{m.autocall_back()}
						</button>
						<button
							type="button"
							class="submit-btn"
							style:border-radius={wobbly.button}
							disabled={!canProceedToStep2}
							onclick={proceedToStep2}
						>
							Weiter
						</button>
					</div>
				</div>

			{:else if step === 'form2'}
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="form">
					<div class="form-header">
						<p class="form-time">
							{m.autocall_form_time({ time: preflightData?.nextSlot ? formatDateTime(preflightData.nextSlot.date) : '' })}
							{#if preflightData?.nextSlot?.isImmediate}
								<span class="debug-badge">{m.autocall_form_debug()}</span>
							{/if}
						</p>
						<p class="step-indicator">Schritt 2 von 2</p>
					</div>

					<div class="field">
						<label for="pronouns">{m.autocall_form_pronouns()}</label>
						<select
							id="pronouns"
							bind:value={pronouns}
							class="input"
							style:border-radius={wobbly.sm}
						>
							{#each pronounOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<p class="hint">
							{m.autocall_form_pronouns_hint()}
							<a href="https://github.com/faeller/karl-therapy-finder/issues" target="_blank" rel="noopener" class="hint-link">{m.autocall_form_pronouns_link()}</a>
						</p>
					</div>

					<div class="checkbox-field">
						<input
							id="joinWaitlist"
							type="checkbox"
							bind:checked={joinWaitlist}
							class="checkbox"
						/>
						<label for="joinWaitlist">
							{m.autocall_form_waitlist()}
						</label>
					</div>

					<div class="consent-section">
						<div class="checkbox-field">
							<input
								id="healthDataConsent"
								type="checkbox"
								bind:checked={healthDataConsent}
								class="checkbox"
							/>
							<label for="healthDataConsent">
								Ich willige in die temporäre Verarbeitung meiner Gesundheitsdaten (Therapiebedarf) gemäß Art. 9 DSGVO ein. <a href="/dsgvo" target="_blank" class="hint-link">Mehr erfahren</a>
							</label>
						</div>

						<div class="checkbox-field">
							<input
								id="consent"
								type="checkbox"
								bind:checked={consent}
								class="checkbox"
							/>
							<label for="consent">
								{m.autocall_form_consent()} <a href="/privacy" target="_blank" class="hint-link">Datenschutzerklärung</a>
							</label>
						</div>
					</div>

					<div class="form-actions">
						<button class="back-btn" type="button" style:border-radius={wobbly.button} onclick={() => step = 'form'}>
							{m.autocall_back()}
						</button>
						<button
							type="submit"
							class="submit-btn"
							style:border-radius={wobbly.button}
							disabled={!canSubmit}
						>
							{m.autocall_form_submit()}
						</button>
					</div>
				</form>

			{:else if step === 'scheduling'}
				<div class="state-view">
					<Loader2 size={48} class="animate-spin text-blue-pen" />
					<p class="state-title">{m.autocall_scheduling()}</p>
				</div>

			{:else if step === 'success'}
				<div class="state-view success">
					<CheckCircle size={48} class="text-green-600" />
					<p class="state-title">{m.autocall_success_title()}</p>
					<p class="state-detail">{m.autocall_success_time({ time: scheduledTime || '' })}</p>
					<p class="state-hint">{m.autocall_success_hint()}</p>
					<button class="done-btn" style:border-radius={wobbly.button} onclick={() => { fetchPreflight(); step = 'history'; }}>
						{m.autocall_success_done()}
					</button>
				</div>

			{:else if step === 'error'}
				<div class="state-view error">
					<AlertCircle size={48} class="text-red-marker" />
					<p class="state-title">{m.autocall_error_title()}</p>
					{#if errorIsInsufficientCredits && preflightData?.credits}
						<div class="mb-4">
							<CallCreditsDisplay
								availableSeconds={preflightData.credits.availableSeconds}
								projectedSeconds={preflightData.credits.projectedSeconds}
								tierSeconds={preflightData.credits.tierSeconds}
								totalSeconds={preflightData.credits.totalSeconds}
								pendingCalls={preflightData.credits.pendingCalls}
								compact={true}
								showTitle={true}
								noBackground={true}
								showLegend={true}
							/>
							<p class="mt-3 text-sm text-center">
								<a href="/account" class="text-blue-pen underline hover:text-red-marker">
									Mehr Info in deinem Account
								</a>
							</p>
						</div>
					{/if}
					<p class="state-detail">{error}</p>
					<p class="error-links">
						<a href="mailto:karl@mail.online-impressum.de">E-Mail</a> · <a href="https://github.com/faeller/karl-therapy-finder/issues" target="_blank" rel="noopener">GitHub Issue</a>
					</p>
					<button
						class="retry-btn"
						style:border-radius={wobbly.button}
						onclick={fetchPreflight}
						disabled={rateLimitRetrySeconds > 0}
					>
						{rateLimitRetrySeconds > 0 ? `${m.autocall_error_retry()} (${formatCountdown(rateLimitRetrySeconds)})` : m.autocall_error_retry()}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal-content {
		position: relative;
		background: var(--color-paper);
		border: 3px solid var(--color-pencil);
		box-shadow: var(--shadow-hard);
		padding: 1.5rem;
		max-width: 420px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.close-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.25rem;
		opacity: 0.5;
		transition: opacity 100ms;
	}

	.close-btn:hover:not(:disabled) {
		opacity: 1;
	}

	.close-btn:disabled {
		cursor: not-allowed;
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.modal-header h2 {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: bold;
	}

	.therapist-name {
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.7;
		margin-bottom: 1.25rem;
	}

	/* state views */
	.state-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 0.5rem 1rem 2rem;
		gap: 0.75rem;
	}

	.state-title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: bold;
	}

	.state-detail {
		font-size: 0.9375rem;
		white-space: pre-line;
	}

	.error-links {
		font-size: 0.875rem;
	}

	.error-links a {
		color: var(--color-blue-pen);
		text-decoration: underline;
	}

	.state-hint {
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.7;
		margin-top: 0.25rem;
	}

	/* history section */
	.history-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.history-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--color-pencil);
		opacity: 0.8;
	}

	.calls-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.call-item {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		background: var(--color-erased);
		border-radius: 0.5rem;
	}

	.call-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.call-details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.8;
	}

	.call-time {
		background: var(--color-paper);
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.call-outcome {
		background: var(--color-paper);
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.call-appointment {
		color: var(--color-blue-pen);
		font-weight: 500;
	}

	.call-attempt {
		font-size: 0.7rem;
		color: var(--color-pencil);
		opacity: 0.7;
		background: var(--color-erased);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.call-notes-preview {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.7;
		font-style: italic;
	}

	.call-frozen-hint {
		font-size: 0.75rem;
		color: var(--color-cyan-600, #0891b2);
		font-style: italic;
	}

	.action-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.action-link:hover {
		opacity: 1;
	}

	.cancel-link {
		color: var(--color-red-marker);
		align-self: flex-start;
	}

	.info-link {
		color: var(--color-blue-pen);
	}

	.call-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	/* details section */
	.details-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.7;
		margin-bottom: 0.5rem;
	}

	.back-link:hover {
		opacity: 1;
	}

	.details-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.details-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-weight: 600;
		font-size: 1rem;
	}

	.outcome-badge {
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		border: 1px solid;
	}

	/* highlight cards */
	.appointment-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
		border: 2px solid #22c55e;
		border-radius: 0.5rem;
		color: #166534;
	}

	:global(:root.dark) .appointment-card {
		background: linear-gradient(135deg, #14532d 0%, #166534 100%);
		border-color: #22c55e;
		color: #86efac;
	}

	.appointment-card div {
		display: flex;
		flex-direction: column;
	}

	.appointment-label {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.appointment-value {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.callback-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #dbeafe;
		border: 1px solid #3b82f6;
		border-radius: 0.5rem;
		color: #1e40af;
	}

	:global(:root.dark) .callback-card {
		background: #1e3a5f;
		border-color: #3b82f6;
		color: #93c5fd;
	}

	.callback-card div {
		display: flex;
		flex-direction: column;
	}

	.callback-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		opacity: 0.8;
	}

	.callback-value {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.rejection-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #fee2e2;
		border: 1px solid #ef4444;
		border-radius: 0.5rem;
		color: #991b1b;
	}

	:global(:root.dark) .rejection-card {
		background: #450a0a;
		border-color: #ef4444;
		color: #fca5a5;
	}

	.rejection-card div {
		display: flex;
		flex-direction: column;
	}

	.rejection-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		opacity: 0.8;
	}

	.rejection-value {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.summary-card {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--color-erased);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.summary-card p {
		margin: 0;
	}

	/* timing section */
	.timing-section h4,
	.transcript-section h4,
	.analysis-section h4 {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-pencil);
		opacity: 0.8;
		margin-bottom: 0.5rem;
	}

	.timing-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.timing-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem;
		background: var(--color-erased);
		border-radius: 0.375rem;
	}

	.timing-item.gifted {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border: 1px solid #f59e0b;
	}

	.timing-label {
		font-size: 0.6875rem;
		color: var(--color-pencil);
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.timing-value {
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* transcript section */
	.transcript-container {
		max-height: 450px;
		overflow-y: auto;
		padding: 0.75rem;
		background: var(--color-erased);
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.transcript-line {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		line-height: 1.4;
	}

	.transcript-line.agent {
		background: #dbeafe;
		margin-right: 1rem;
	}

	.transcript-line.user {
		background: #f3f4f6;
		margin-left: 1rem;
	}

	:global(:root.dark) .transcript-line.agent {
		background: #1e3a5f;
	}

	:global(:root.dark) .transcript-line.user {
		background: #374151;
	}

	.speaker {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.speaker.agent {
		color: #1d4ed8;
	}

	.speaker.user {
		color: #374151;
	}

	:global(:root.dark) .speaker.agent {
		color: #93c5fd;
	}

	:global(:root.dark) .speaker.user {
		color: #d1d5db;
	}

	.message {
		color: var(--color-pencil);
	}

	/* analysis section */
	.analysis-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: var(--color-erased);
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.analysis-label {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.analysis-value {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.analysis-value.success {
		color: #16a34a;
	}

	.analysis-value.failure {
		color: #dc2626;
	}

	:global(:root.dark) .analysis-value.success {
		color: #4ade80;
	}

	:global(:root.dark) .analysis-value.failure {
		color: #f87171;
	}

	.analysis-summary {
		padding: 0.75rem;
		background: var(--color-erased);
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.analysis-summary p {
		margin: 0.375rem 0 0 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.data-collection {
		margin-top: 0.5rem;
	}

	.data-grid {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.375rem;
	}

	.data-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem;
		background: var(--color-paper);
		border: 1px solid var(--color-erased);
		border-radius: 0.375rem;
	}

	.data-key {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.7;
		text-transform: capitalize;
	}

	.data-value {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.data-rationale {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.6;
		font-style: italic;
	}

	/* technical details */
	.tech-details {
		margin-top: 0.5rem;
	}

	.tech-details summary {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-pencil);
		opacity: 0.6;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.375rem;
	}

	.tech-details summary:hover {
		opacity: 1;
		background: var(--color-erased);
	}

	.tech-details[open] summary {
		margin-bottom: 0.75rem;
	}

	.tech-grid {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.tech-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem;
		background: var(--color-erased);
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.tech-label {
		color: var(--color-pencil);
		opacity: 0.7;
	}

	.tech-value {
		font-family: ui-monospace, monospace;
		font-size: 0.6875rem;
		background: var(--color-paper);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.new-call-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-blue-pen);
		border: 2px solid var(--color-blue-pen);
		color: white;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
		transition: all 100ms;
		margin-top: 0.5rem;
	}

	.new-call-btn:hover {
		background: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.blocked-hint {
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.6;
		text-align: center;
		padding: 0.75rem;
	}

	.cancelled-calls {
		margin-top: 0.75rem;
	}

	.cancelled-calls summary {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--color-pencil);
		cursor: pointer;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: var(--color-erased);
		border: 1px solid var(--color-pencil);
		opacity: 0.7;
	}

	.cancelled-calls summary:hover {
		opacity: 1;
	}

	.cancelled-calls summary :global(.chevron) {
		transition: transform 150ms;
		transform: rotate(-90deg);
	}

	.cancelled-calls[open] summary :global(.chevron) {
		transform: rotate(-180deg);
	}

	.cancelled-calls[open] summary {
		margin-bottom: 0.5rem;
	}

	.cancelled-calls .calls-list {
		gap: 0.375rem;
	}

	.call-item.cancelled {
		padding: 0.5rem 0.75rem;
		opacity: 0.7;
	}

	.call-item.cancelled:hover {
		opacity: 1;
	}

	/* confirm section */
	.confirm-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.proposed-time {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: linear-gradient(135deg, var(--color-erased) 0%, var(--color-paper) 100%);
		border: 2px solid var(--color-blue-pen);
		border-radius: 0.75rem;
	}

	.time-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
	}

	.time-details {
		flex: 1;
	}

	.time-label {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.7;
		margin-bottom: 0.25rem;
	}

	.time-value {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
	}

	.time-value-lg {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-blue-pen);
	}

	.time-hint {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.6;
		margin-top: 0.25rem;
	}

	.time-hint.sprechstunde {
		color: var(--color-blue-pen);
		opacity: 1;
		font-weight: 500;
	}

	.time-hint.debug {
		color: var(--color-red-marker);
		opacity: 0.8;
		font-style: italic;
	}

	.opening-hours {
		padding: 0.75rem;
		background: var(--color-erased);
		border-radius: 0.5rem;
	}

	.hours-label {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.7;
		margin-bottom: 0.375rem;
	}

	.hours-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.hours-line {
		font-size: 0.8125rem;
		background: var(--color-paper);
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		white-space: nowrap;
	}

	.credits-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.8;
		padding: 0.5rem 0.75rem;
		background: var(--color-erased);
		border-radius: 0.375rem;
	}

	.confirm-question {
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.confirm-actions {
		display: flex;
		gap: 0.75rem;
	}

	.confirm-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 2px solid var(--color-pencil);
		background: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		transition: all 100ms;
	}

	.confirm-btn.primary {
		background: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.confirm-btn.primary:hover {
		background: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.confirm-btn.secondary:hover {
		background: var(--color-erased);
	}

	/* form */
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-header {
		padding: 0.5rem 0.75rem;
		background: var(--color-erased);
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.debug-badge {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.125rem 0.375rem;
		background: var(--color-red-marker);
		color: white;
		font-size: 0.6875rem;
		font-weight: 500;
		border-radius: 0.25rem;
		vertical-align: middle;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.input {
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--color-pencil);
		background: var(--color-paper);
		font-family: var(--font-body);
		font-size: 1rem;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-blue-pen);
	}

	.hint {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.6;
	}

	.field-error {
		font-size: 0.75rem;
		color: var(--color-red-marker);
	}

	.input-error {
		border-color: var(--color-red-marker);
	}

	.hint-link {
		color: var(--color-blue-pen);
		text-decoration: underline;
	}

	.step-indicator {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.6;
		margin-top: 0.25rem;
	}

	.checkbox-field {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.checkbox {
		width: 1.25rem;
		height: 1.25rem;
		margin-top: 0.125rem;
		flex-shrink: 0;
	}

	.checkbox-field label {
		font-size: 0.8125rem;
		line-height: 1.4;
	}

	.consent-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--color-pencil);
		opacity: 0.9;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.back-btn {
		padding: 0.75rem 1rem;
		border: 2px solid var(--color-pencil);
		background: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		transition: all 100ms;
	}

	.back-btn:hover {
		background: var(--color-erased);
	}

	.submit-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		background: var(--color-blue-pen);
		border: 2px solid var(--color-blue-pen);
		color: white;
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: 500;
		transition: all 100ms;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.done-btn, .retry-btn {
		margin-top: 1rem;
		padding: 0.625rem 1.5rem;
		border: 2px solid var(--color-pencil);
		background: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		transition: all 100ms;
	}

	.done-btn:hover, .retry-btn:hover {
		background: var(--color-erased);
	}

	.retry-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--color-paper);
	}

	/* timeline view */
	.timeline-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.next-call-card {
		background: var(--color-postit);
		border: 2px solid var(--color-pencil);
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
	}

	.next-call-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.next-call-time {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.next-date {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.next-time {
		font-size: 1.5rem;
		font-weight: 700;
		font-family: var(--font-heading);
	}

	.next-call-attempt {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		opacity: 0.6;
	}

	.attempts-timeline h4 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
	}

	.timeline-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-left: 0.25rem;
	}

	.timeline-item {
		display: flex;
		gap: 0.75rem;
		position: relative;
	}

	.timeline-item:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 12px;
		top: 28px;
		bottom: -12px;
		width: 2px;
		background: var(--color-erased);
	}

	.timeline-marker {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: 2px solid var(--color-pencil);
		background: var(--color-paper);
	}

	.timeline-marker.status-red {
		border-color: var(--color-red-marker);
		background: rgba(239, 68, 68, 0.1);
	}

	.timeline-marker.status-yellow {
		border-color: #f59e0b;
		background: rgba(245, 158, 11, 0.1);
	}

	.attempt-num {
		font-size: 0.7rem;
		font-weight: 600;
	}

	.timeline-content {
		flex: 1;
		min-width: 0;
	}

	.timeline-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.timeline-date {
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.timeline-outcome {
		font-size: 0.7rem;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.timeline-notes {
		font-size: 0.8rem;
		margin-top: 0.25rem;
		opacity: 0.8;
		line-height: 1.3;
	}

	.no-history-hint {
		text-align: center;
		padding: 1rem;
		background: var(--color-erased);
		border-radius: 8px;
	}

	.no-history-hint p {
		margin: 0;
		font-size: 0.875rem;
	}

	.hint-small {
		font-size: 0.75rem !important;
		opacity: 0.6;
		margin-top: 0.25rem !important;
	}

	.timeline-actions {
		display: flex;
		justify-content: center;
		padding-top: 0.5rem;
		border-top: 1px dashed var(--color-erased);
	}

	.attempt-history-details {
		margin-top: 1rem;
		border: 1px solid var(--color-erased);
		border-radius: 8px;
		padding: 0.75rem;
	}

	.attempt-history-details summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.timeline-list.compact {
		margin-top: 0.75rem;
		gap: 0.5rem;
	}

	.timeline-list.compact .timeline-item::before {
		top: 24px;
		bottom: -8px;
	}
</style>
