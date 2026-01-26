<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import { wobbly } from '$lib/utils/wobbly';
	import { ArrowLeft, RefreshCw, Phone, Clock, Ban, Database, DollarSign, Loader2, CheckCircle, XCircle, AlertTriangle, Play, Trash2, Bug, Webhook, Shield, ChevronDown, ChevronRight } from 'lucide-svelte';
	import { debug } from '$lib/stores/debug';

	let { data, form } = $props();

	import { onMount } from 'svelte';

	let loading = $state(false);
	let activeSection = $state<string | null>(null);
	let callsExpanded = $state(false);
	let tickCount = $state(0);

	// tick every second to update countdowns
	onMount(() => {
		const interval = setInterval(() => tickCount++, 1000);
		return () => clearInterval(interval);
	});

	// test therapist eId input
	let testEId = $state('');

	// test call scheduling inputs
	let scheduleEId = $state('');
	let schedulePatientName = $state('Test Patient');
	let scheduleInsurance = $state('gesetzlich versichert');
	let scheduleTherapyType = $state('Verhaltenstherapie');
	let scheduleCallbackPhone = $state('');
	let scheduleUrgency = $state<'low' | 'medium' | 'high'>('medium');
	let scheduleSkipElevenLabs = $state(true);

	// webhook simulation inputs
	let simCallId = $state('');
	let simStatus = $state('completed');
	let simTranscript = $state('');
	let simDuration = $state(60);

	// sample transcripts for testing
	const sampleTranscripts = {
		success: `Praxis: Guten Tag, Praxis Dr. Müller.
Agent: Guten Tag, ich rufe im Auftrag eines Patienten an, der einen Therapieplatz sucht.
Praxis: Ja, wir haben tatsächlich einen Platz frei. Der Patient kann gerne am Dienstag um 14 Uhr zum Erstgespräch kommen.
Agent: Das ist wunderbar, vielen Dank. Darf ich die Kontaktdaten des Patienten hinterlassen?
Praxis: Ja, gerne.`,
		callback: `Praxis: Praxis Schmidt, was kann ich für Sie tun?
Agent: Guten Tag, ich rufe im Auftrag eines Patienten an, der dringend einen Therapieplatz sucht.
Praxis: Verstehe. Die Therapeutin ist gerade in einer Sitzung. Können Sie uns eine Rückrufnummer geben?
Agent: Selbstverständlich, die Nummer ist 0170 1234567.
Praxis: Danke, wir rufen heute Nachmittag zurück.`,
		no_availability: `Praxis: Psychotherapiepraxis Weber.
Agent: Guten Tag, ich rufe im Auftrag eines Patienten an.
Praxis: Leider nehmen wir momentan keine neuen Patienten auf. Unsere Warteliste ist bereits sehr lang, etwa 8 Monate.
Agent: Verstehe. Gibt es vielleicht eine Möglichkeit auf die Warteliste zu kommen?
Praxis: Nein, tut mir leid. Wir empfehlen die Terminservicestelle.`,
		rejected_ai: `Praxis: Praxis Bauer.
Agent: Guten Tag, ich bin ein KI-Assistent und rufe im Auftrag...
Praxis: Moment, Sie sind eine KI? Wir möchten nicht mit automatisierten Anrufen sprechen. Bitte lassen Sie den Patienten selbst anrufen.
Agent: Ich verstehe, das tut mir leid für die Umstände.
Praxis: Danke, auf Wiederhören.`,
		rejected_privacy: `Praxis: Praxis Klein.
Agent: Guten Tag, ich rufe im Auftrag eines Patienten an, um einen Therapieplatz zu vereinbaren.
Praxis: Wie haben Sie diese Nummer bekommen? Und Sie rufen im Auftrag an? Das ist aus Datenschutzgründen problematisch. Der Patient muss selbst anrufen, wir können keine Dritten...
Agent: Ich verstehe Ihre Bedenken bezüglich des Datenschutzes.
Praxis: Ja, bitte keine weiteren Anrufe dieser Art. Das ist nicht DSGVO-konform.`
	};

	function formatDate(iso: string | null | undefined): string {
		if (!iso) return '-';
		return new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
	}

	function formatCost(usd: string | null): string {
		if (!usd) return '-';
		return `$${parseFloat(usd).toFixed(4)}`;
	}

	// estimate cost from raw webhook payload (credits * $0.13/1000)
	const CREDITS_TO_USD = 0.13 / 1000;
	function estimateCostFromPayload(rawPayload: string): { cost: string; credits: number; breakdown: string; duration: number } | null {
		try {
			const payload = JSON.parse(rawPayload);
			const meta = payload.data?.metadata;
			if (!meta) return null;

			const charging = meta.charging;
			const totalCredits = meta.cost || 0;
			const duration = meta.call_duration_secs || 0;
			if (!totalCredits && !charging) return null;

			const callCredits = charging?.call_charge || 0;
			const llmCredits = charging?.llm_charge || 0;
			const credits = totalCredits || (callCredits + llmCredits);
			const cost = (credits * CREDITS_TO_USD).toFixed(4);
			return {
				cost: `$${cost}`,
				credits,
				breakdown: `${callCredits}+${llmCredits} credits`,
				duration
			};
		} catch {
			return null;
		}
	}

	const statusColors: Record<string, string> = {
		scheduled: 'text-blue-pen',
		in_progress: 'text-yellow-600',
		completed: 'text-green-600',
		failed: 'text-red-marker',
		cancelled: 'text-pencil/50'
	};

	const outcomeColors: Record<string, string> = {
		success: 'bg-green-100 text-green-800',
		callback: 'bg-blue-100 text-blue-800',
		no_answer: 'bg-yellow-100 text-yellow-800',
		no_availability: 'bg-orange-100 text-orange-800',
		rejected_ai: 'bg-red-100 text-red-800',
		rejected_privacy: 'bg-red-200 text-red-900',
		rejected_other: 'bg-red-100 text-red-800',
		unclear: 'bg-gray-100 text-gray-800'
	};
</script>

<div class="min-h-[100dvh] px-4 py-6">
	<div class="mx-auto max-w-2xl">
		<!-- header -->
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center gap-4">
				<a href="/chat" class="back-link">
					<ArrowLeft size={18} />
					zurück
				</a>
				<h1 class="font-heading text-2xl font-bold">Debug - ElevenLabs</h1>
			</div>
			<button
				onclick={() => invalidateAll()}
				class="refresh-btn"
				style:border-radius={wobbly.button}
			>
				<RefreshCw size={16} />
				refresh
			</button>
		</div>

		<!-- env status -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3">Environment Status</h2>
			{#if data.envStatus.configured}
				<div class="flex items-center gap-2 text-green-600">
					<CheckCircle size={20} />
					<span>all required env vars configured</span>
				</div>
			{:else}
				<div class="flex items-start gap-2 text-red-marker">
					<XCircle size={20} class="shrink-0 mt-0.5" />
					<div>
						<span class="font-bold">missing env vars:</span>
						<ul class="mt-1 text-sm">
							{#each data.envStatus.missing as v}
								<li class="font-mono">{v}</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}

			<div class="mt-4 pt-4 border-t border-pencil/20">
				<h3 class="font-bold text-sm mb-2">Setup Checklist</h3>
				<ul class="text-sm space-y-2">
					<li class="flex items-start gap-2">
						{#if data.calls.length > 0 || data.cache.length > 0}
							<CheckCircle size={14} class="text-green-600 shrink-0 mt-0.5" />
						{:else}
							<AlertTriangle size={14} class="text-yellow-600 shrink-0 mt-0.5" />
						{/if}
						<div>
							<span>Migration run</span>
							<code class="block text-xs bg-erased px-1 rounded mt-1 break-all">wrangler d1 execute karl-auth --file=./migrations/0002_auto_call_system.sql --local</code>
						</div>
					</li>
					<li class="flex items-start gap-2">
						{#if !data.envStatus.missing.includes('ELEVENLABS_PRACTICE_AGENT_ID')}
							<CheckCircle size={14} class="text-green-600 shrink-0 mt-0.5" />
						{:else}
							<XCircle size={14} class="text-red-marker shrink-0 mt-0.5" />
						{/if}
						<div>
							<span>ElevenLabs agent created</span>
							<a href="/docs/elevenlabs-practice-agent.md" target="_blank" class="text-blue-pen hover:underline text-xs ml-1">(prompt)</a>
						</div>
					</li>
					<li class="flex items-start gap-2">
						{#if !data.envStatus.missing.includes('ELEVENLABS_WEBHOOK_SECRET')}
							<CheckCircle size={14} class="text-green-600 shrink-0 mt-0.5" />
						{:else}
							<AlertTriangle size={14} class="text-yellow-600 shrink-0 mt-0.5" />
						{/if}
						<div>
							<span>Webhook URL</span>
							<code class="block text-xs bg-erased px-1 rounded mt-1">/api/calls/webhook</code>
						</div>
					</li>
				</ul>
			</div>
		</WobblyCard>

		<!-- debug mode -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<Bug size={20} />
				Debug Mode
			</h2>
			<p class="text-sm text-pencil/60 mb-4">adds a test therapist to the list with auto-call enabled</p>

			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						id="debugEnabled"
						checked={$debug.enabled}
						onchange={(e) => debug.setEnabled(e.currentTarget.checked)}
						class="w-4 h-4"
					/>
					<label for="debugEnabled" class="text-sm">
						enable debug mode
					</label>
				</div>

				{#if $debug.enabled}
					<div class="space-y-3">
						<div>
							<label for="testTherapistPhone" class="text-sm text-pencil/70">test therapist phone (will be called)</label>
							<input
								type="tel"
								id="testTherapistPhone"
								value={$debug.testPhone}
								oninput={(e) => debug.setTestPhone(e.currentTarget.value)}
								placeholder="+49 170 1234567"
								class="input-field w-full"
							/>
						</div>
						<div>
							<label for="debugCallbackPhone" class="text-sm text-pencil/70">callback phone (your number for callbacks)</label>
							<input
								type="tel"
								id="debugCallbackPhone"
								value={$debug.callbackPhone}
								oninput={(e) => debug.setCallbackPhone(e.currentTarget.value)}
								placeholder="+49 170 1234567"
								class="input-field w-full"
							/>
						</div>
					</div>
				{/if}
			</div>
		</WobblyCard>

		<!-- user & credits -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3">User & Credits</h2>
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<span class="text-pencil/60">user:</span>
					<span class="font-mono">{data.user?.username || 'anonymous'}</span>
				</div>
				<div>
					<span class="text-pencil/60">tier:</span>
					<span class="font-bold" class:text-blue-pen={data.user?.pledgeTier === 'premium'} class:text-green-600={data.user?.pledgeTier === 'supporter'}>
						{data.user?.pledgeTier || 'free'}
					</span>
				</div>
				<div>
					<span class="text-pencil/60">credits:</span>
					<span class="font-mono">{data.credits.available} / {data.credits.total}</span>
					<span class="text-pencil/50">(used: {data.credits.used}, refunded: {data.credits.refunded})</span>
				</div>
			</div>

			<form method="POST" action="?/addCredits" use:enhance={() => { loading = true; return async ({ update }) => { await update(); loading = false; }; }} class="mt-4 flex gap-2">
				<input type="number" name="amount" value="5" class="input-field w-20" />
				<button type="submit" class="action-btn" style:border-radius={wobbly.button} disabled={loading}>
					{#if loading}<Loader2 size={16} class="animate-spin" />{/if}
					add credits
				</button>
			</form>
		</WobblyCard>

		<!-- elevenlabs pending batch calls -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<Phone size={20} />
				ElevenLabs Pending Batch Calls
			</h2>
			{#if data.elevenlabsBatchCalls && data.elevenlabsBatchCalls.length > 0}
				<div class="space-y-2">
					{#each data.elevenlabsBatchCalls as batch}
						<div class="bg-erased rounded p-3 flex items-start justify-between gap-3">
							<div class="flex-1 text-sm">
								<div class="font-mono text-xs text-pencil/60 mb-1">{batch.batchId}</div>
								<div class="font-medium">{batch.callName || 'unnamed'}</div>
								<div class="text-xs text-pencil/60 mt-1">
									<span>status: {batch.status}</span>
									<span class="mx-2">•</span>
									<span>scheduled: {batch.scheduledAt}</span>
								</div>
							</div>
							<form method="POST" action="?/cancelBatchCall" use:enhance={() => { loading = true; return async ({ update }) => { await update(); loading = false; }; }}>
								<input type="hidden" name="batchId" value={batch.batchId} />
								<button type="submit" class="action-btn-sm danger" disabled={loading}>
									<Trash2 size={14} />
									cancel
								</button>
							</form>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-pencil/60">no pending batch calls in elevenlabs</p>
			{/if}
		</WobblyCard>

		<!-- test therapist fetch -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3">Test Opening Hours Parser</h2>
			<form method="POST" action="?/fetchTherapist" use:enhance={() => { loading = true; activeSection = 'fetch'; return async ({ update }) => { await update(); loading = false; activeSection = null; }; }} class="flex gap-2">
				<input
					type="text"
					name="eId"
					bind:value={testEId}
					placeholder="tk e_id (e.g. 123456)"
					class="input-field flex-1"
				/>
				<button type="submit" class="action-btn" style:border-radius={wobbly.button} disabled={loading && activeSection === 'fetch'}>
					{#if loading && activeSection === 'fetch'}<Loader2 size={16} class="animate-spin" />{/if}
					fetch & parse
				</button>
			</form>

			{#if form?.action === 'fetchTherapist'}
				<div class="mt-4 p-3 rounded bg-erased text-sm">
					{#if form.success}
						<div class="text-green-600 font-bold mb-2">
							{#if form.costUsd === 0}
								parsed via cheerio (free)
							{:else}
								parsed via ai, cost: {formatCost(String(form.costUsd))}
							{/if}
						</div>
						<pre class="overflow-x-auto whitespace-pre-wrap font-mono text-xs">{JSON.stringify(form.details, null, 2)}</pre>
					{:else}
						<div class="text-red-marker">{form.error}</div>
					{/if}
				</div>
			{/if}
		</WobblyCard>

		<!-- schedule test call -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<Phone size={20} />
				Schedule Test Call
			</h2>
			<p class="text-sm text-pencil/60 mb-4">schedule a call to test the full flow (use cached eId from above)</p>

			<form method="POST" action="?/scheduleTestCall" use:enhance={() => { loading = true; activeSection = 'schedule'; return async ({ update }) => { await update(); loading = false; activeSection = null; }; }} class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="scheduleTherapistEId" class="text-sm text-pencil/70">therapist eId *</label>
						<input type="text" id="scheduleTherapistEId" name="eId" bind:value={scheduleEId} placeholder="e.g. 123456" class="input-field w-full" required />
					</div>
					<div>
						<label for="scheduleCallbackPhone" class="text-sm text-pencil/70">callback phone *</label>
						<input type="tel" id="scheduleCallbackPhone" name="callbackPhone" bind:value={scheduleCallbackPhone} placeholder="+49 170 1234567" class="input-field w-full" required />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="schedulePatientName" class="text-sm text-pencil/70">patient name</label>
						<input type="text" id="schedulePatientName" name="patientName" bind:value={schedulePatientName} class="input-field w-full" />
					</div>
					<div>
						<label for="scheduleInsurance" class="text-sm text-pencil/70">insurance</label>
						<select id="scheduleInsurance" name="patientInsurance" bind:value={scheduleInsurance} class="input-field w-full">
							<option value="gesetzlich versichert">GKV (gesetzlich)</option>
							<option value="privat versichert">PKV (privat)</option>
							<option value="Selbstzahler">Selbstzahler</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="scheduleTherapyType" class="text-sm text-pencil/70">therapy type</label>
						<select id="scheduleTherapyType" name="therapyType" bind:value={scheduleTherapyType} class="input-field w-full">
							<option value="Verhaltenstherapie">Verhaltenstherapie</option>
							<option value="Tiefenpsychologie">Tiefenpsychologie</option>
							<option value="Psychoanalyse">Psychoanalyse</option>
							<option value="Psychotherapie">Psychotherapie (allgemein)</option>
						</select>
					</div>
					<div>
						<label for="scheduleUrgency" class="text-sm text-pencil/70">urgency</label>
						<select id="scheduleUrgency" name="urgency" bind:value={scheduleUrgency} class="input-field w-full">
							<option value="low">niedrig</option>
							<option value="medium">mittel</option>
							<option value="high">dringend</option>
						</select>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<input type="checkbox" id="skipElevenLabs" name="skipElevenLabs" value="true" bind:checked={scheduleSkipElevenLabs} class="w-4 h-4" />
					<label for="skipElevenLabs" class="text-sm">
						skip ElevenLabs API call (db record only)
						<span class="text-pencil/50">(for testing webhook simulation)</span>
					</label>
				</div>

				<div class="flex gap-2">
					<button type="submit" class="action-btn primary" style:border-radius={wobbly.button} disabled={!scheduleEId || !scheduleCallbackPhone || (loading && activeSection === 'schedule')}>
						{#if loading && activeSection === 'schedule'}<Loader2 size={16} class="animate-spin" />{/if}
						schedule call
					</button>
					{#if form?.action === 'fetchTherapist' && form.success}
						<button type="button" onclick={() => scheduleEId = testEId} class="action-btn" style:border-radius={wobbly.button}>
							use fetched eId ({testEId})
						</button>
					{/if}
				</div>
			</form>

			{#if form?.action === 'scheduleTestCall'}
				<div class="mt-4 p-3 rounded {form.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-sm">
					{#if form.success}
						<div class="font-bold mb-2">call scheduled!</div>
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div>call id: <span class="font-mono">{form.callId}</span></div>
							<div>batch id: <span class="font-mono">{form.batchId}</span></div>
							<div>therapist: {form.therapistName}</div>
							<div>phone: {form.therapistPhone}</div>
							<div>scheduled: {formatDate(form.scheduledAt)}</div>
							<div>ai cost: {formatCost(String(form.costUsd))}</div>
						</div>
						{#if form.skippedElevenLabs}
							<div class="mt-2 text-yellow-700">ElevenLabs skipped - use webhook simulation to test outcomes</div>
						{/if}
					{:else}
						{form.error}
					{/if}
				</div>
			{/if}
		</WobblyCard>

		<!-- rate limit debug (dev only) -->
		{#if data.rateLimit.devMode}
			<WobblyCard class="mb-4">
				<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
					<Shield size={20} />
					Rate Limit Debug
				</h2>
				<p class="text-sm text-pencil/60 mb-4">
					test limit: <code class="bg-erased px-1 rounded">{data.rateLimit.testLimit || 'false'}</code>
					· user: <code class="bg-erased px-1 rounded">u:{data.rateLimit.userId?.slice(0, 8)}...</code>
				</p>

				<div class="flex flex-wrap gap-2 mb-4">
					<form method="POST" action="?/triggerRateLimit" use:enhance={() => { loading = true; return async ({ update }) => { await update(); loading = false; }; }}>
						<input type="hidden" name="type" value="minute" />
						<button type="submit" class="action-btn" style:border-radius={wobbly.button}>
							trigger minute
						</button>
					</form>
					<form method="POST" action="?/triggerRateLimit" use:enhance={() => { loading = true; return async ({ update }) => { await update(); loading = false; }; }}>
						<input type="hidden" name="type" value="hourly" />
						<button type="submit" class="action-btn" style:border-radius={wobbly.button}>
							trigger hourly
						</button>
					</form>
					<form method="POST" action="?/triggerRateLimit" use:enhance={() => { loading = true; return async ({ update }) => { await update(); loading = false; }; }}>
						<input type="hidden" name="type" value="ban" />
						<button type="submit" class="action-btn" style:border-radius={wobbly.button}>
							trigger ban
						</button>
					</form>
					<button type="button" onclick={() => invalidateAll()} class="action-btn" style:border-radius={wobbly.button}>
						<RefreshCw size={14} />
						reload
					</button>
					<form method="POST" action="?/clearAllRateLimits" use:enhance={() => { loading = true; return async ({ update }) => { await update(); loading = false; }; }}>
						<button type="submit" class="action-btn text-red-marker" style:border-radius={wobbly.button}>
							clear all
						</button>
					</form>
				</div>

				{#if data.rateLimit.entries.length === 0}
					<p class="text-pencil/60 text-sm">no active rate limits</p>
				{:else}
					<div class="space-y-2">
						{#each data.rateLimit.entries as entry}
							{@const remaining = Math.max(0, entry.expiresIn - tickCount)}
							{#if remaining > 0}
								<div class="flex items-center justify-between border-2 border-pencil/20 rounded p-2 text-sm">
									<div>
										<code class="text-xs break-all">{entry.key}</code>
										<span class="ml-2 text-pencil/60">= {entry.value}</span>
										<span class="ml-2 text-xs text-pencil/50">({remaining}s)</span>
									</div>
									<form method="POST" action="?/deleteRateLimit" use:enhance>
										<input type="hidden" name="key" value={entry.key} />
										<button type="submit" class="text-red-marker hover:text-red-700" title="delete">
											<Trash2 size={14} />
										</button>
									</form>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</WobblyCard>
		{/if}

		<!-- scheduled calls (collapsible) -->
		<WobblyCard class="mb-4">
			<button
				type="button"
				onclick={() => callsExpanded = !callsExpanded}
				class="w-full flex items-center justify-between text-left"
			>
				<h2 class="font-heading text-lg font-bold flex items-center gap-2">
					<Phone size={20} />
					Scheduled Calls ({data.calls.length})
				</h2>
				{#if callsExpanded}
					<ChevronDown size={20} />
				{:else}
					<ChevronRight size={20} />
				{/if}
			</button>

			{#if callsExpanded}
				{#if data.calls.length === 0}
					<p class="text-pencil/60 text-sm mt-3">no calls scheduled yet</p>
				{:else}
					<div class="space-y-3 mt-3">
						{#each data.calls as call}
						<div class="border-2 border-pencil/20 rounded p-3">
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="font-bold">{call.therapistName || 'unknown'}</div>
									<div class="text-sm text-pencil/60">{call.therapistPhone}</div>
								</div>
								<div class="text-right">
									<span class="text-sm {statusColors[call.status] || ''}">{call.status}</span>
									{#if call.outcome}
										<span class="ml-2 text-xs px-2 py-0.5 rounded {outcomeColors[call.outcome] || 'bg-gray-100'}">{call.outcome}</span>
									{/if}
								</div>
							</div>

							<div class="mt-2 grid grid-cols-2 gap-2 text-xs text-pencil/70">
								<div>id: <span class="font-mono">{call.id.slice(0, 8)}...</span></div>
								<div>attempt: {call.attemptNumber}/{call.maxAttempts}</div>
								<div>scheduled: {formatDate(call.scheduledAt)}</div>
								<div>completed: {formatDate(call.completedAt)}</div>
								{#if call.durationSeconds}
									<div>duration: {call.durationSeconds}s</div>
								{/if}
								{#if call.appointmentDate}
									<div class="text-green-600">appt: {call.appointmentDate} {call.appointmentTime}</div>
								{/if}
							</div>

							{#if call.transcript}
								<details class="mt-2">
									<summary class="text-xs text-blue-pen cursor-pointer">transcript</summary>
									<pre class="mt-1 text-xs bg-erased p-2 rounded overflow-x-auto whitespace-pre-wrap">{call.transcript}</pre>
								</details>
							{/if}

							{#if call.analysis}
								<details class="mt-2">
									<summary class="text-xs text-blue-pen cursor-pointer">analysis</summary>
									<pre class="mt-1 text-xs bg-erased p-2 rounded overflow-x-auto whitespace-pre-wrap">{call.analysis}</pre>
								</details>
							{/if}

							{#if call.notes}
								<div class="mt-2 text-xs text-pencil/70">notes: {call.notes}</div>
							{/if}
						</div>
					{/each}
					</div>
				{/if}
			{/if}
		</WobblyCard>

		<!-- webhook simulation -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<Play size={20} />
				Simulate Webhook
			</h2>
			<p class="text-sm text-pencil/60 mb-4">test call outcomes without making real calls</p>

			<form method="POST" action="?/simulateWebhook" use:enhance={() => { loading = true; activeSection = 'webhook'; return async ({ update }) => { await update(); loading = false; activeSection = null; }; }} class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="simCallId" class="text-sm text-pencil/70">call id</label>
						<select id="simCallId" name="callId" bind:value={simCallId} class="input-field w-full">
							<option value="">select a call...</option>
							{#each data.calls.filter(c => c.status === 'scheduled') as call}
								<option value={call.id}>{call.therapistName} ({call.id.slice(0, 8)}...)</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="simStatus" class="text-sm text-pencil/70">status</label>
						<select id="simStatus" name="status" bind:value={simStatus} class="input-field w-full">
							<option value="completed">completed</option>
							<option value="no_answer">no_answer</option>
							<option value="busy">busy</option>
							<option value="voicemail">voicemail</option>
							<option value="failed">failed</option>
						</select>
					</div>
				</div>

				<div>
					<label for="simDuration" class="text-sm text-pencil/70">duration (seconds)</label>
					<input type="number" id="simDuration" name="durationSeconds" bind:value={simDuration} class="input-field w-24" />
				</div>

				<div>
					<label for="simTranscript" class="text-sm text-pencil/70 flex items-center justify-between">
						<span>transcript</span>
						<span class="text-xs">
							<button type="button" onclick={() => simTranscript = sampleTranscripts.success} class="text-blue-pen hover:underline">success</button>
							<span class="mx-1">|</span>
							<button type="button" onclick={() => simTranscript = sampleTranscripts.callback} class="text-blue-pen hover:underline">callback</button>
							<span class="mx-1">|</span>
							<button type="button" onclick={() => simTranscript = sampleTranscripts.no_availability} class="text-blue-pen hover:underline">no avail</button>
							<span class="mx-1">|</span>
							<button type="button" onclick={() => simTranscript = sampleTranscripts.rejected_ai} class="text-blue-pen hover:underline">reject ai</button>
							<span class="mx-1">|</span>
							<button type="button" onclick={() => simTranscript = sampleTranscripts.rejected_privacy} class="text-blue-pen hover:underline">reject privacy</button>
						</span>
					</label>
					<textarea id="simTranscript" name="transcript" bind:value={simTranscript} rows="6" class="input-field w-full font-mono text-xs"></textarea>
				</div>

				<button type="submit" class="action-btn primary" style:border-radius={wobbly.button} disabled={!simCallId || (loading && activeSection === 'webhook')}>
					{#if loading && activeSection === 'webhook'}<Loader2 size={16} class="animate-spin" />{/if}
					simulate webhook
				</button>
			</form>

			{#if form?.action === 'simulateWebhook'}
				<div class="mt-4 p-3 rounded {form.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-sm">
					{form.success ? `webhook simulated: ${form.status}` : form.error}
				</div>
			{/if}
		</WobblyCard>

		<!-- blocklist -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<Ban size={20} />
				Blocklist ({data.blocklist.length})
			</h2>

			{#if data.blocklist.length === 0}
				<p class="text-pencil/60 text-sm">no blocked therapists</p>
			{:else}
				<div class="space-y-2">
					{#each data.blocklist as entry}
						<div class="flex items-center justify-between border-2 border-pencil/20 rounded p-2">
							<div>
								<span class="font-mono text-sm">{entry.eId}</span>
								{#if entry.therapistName}
									<span class="text-pencil/60 ml-2">{entry.therapistName}</span>
								{/if}
								<span class="ml-2 text-xs px-2 py-0.5 rounded {entry.permanent ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
									{entry.reason} {entry.permanent ? '(permanent)' : ''}
								</span>
							</div>
							<form method="POST" action="?/clearBlocklist" use:enhance>
								<input type="hidden" name="eId" value={entry.eId} />
								<button type="submit" class="text-red-marker hover:text-red-700" title="remove">
									<Trash2 size={16} />
								</button>
							</form>
						</div>
					{/each}
				</div>
			{/if}
		</WobblyCard>

		<!-- cache -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<Database size={20} />
				Therapist Cache ({data.cache.length})
			</h2>

			{#if data.cache.length === 0}
				<p class="text-pencil/60 text-sm">no cached therapists</p>
			{:else}
				<div class="space-y-2">
					{#each data.cache as entry}
						<div class="border-2 border-pencil/20 rounded p-2">
							<div class="flex items-center justify-between">
								<div>
									<span class="font-mono text-sm">{entry.eId}</span>
									<span class="text-pencil/60 ml-2">{entry.name}</span>
									<span class="text-pencil/50 ml-2 text-xs">{entry.phone}</span>
								</div>
								<form method="POST" action="?/clearCache" use:enhance>
									<input type="hidden" name="eId" value={entry.eId} />
									<button type="submit" class="text-red-marker hover:text-red-700" title="clear cache">
										<Trash2 size={16} />
									</button>
								</form>
							</div>
							<div class="text-xs text-pencil/50 mt-1">
								fetched: {formatDate(entry.fetchedAt)} | expires: {formatDate(entry.expiresAt)}
							</div>
							{#if entry.openingHours}
								<details class="mt-1">
									<summary class="text-xs text-blue-pen cursor-pointer">opening hours</summary>
									<pre class="mt-1 text-xs bg-erased p-2 rounded overflow-x-auto whitespace-pre-wrap">{entry.openingHours}</pre>
								</details>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</WobblyCard>

		<!-- cost events -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<DollarSign size={20} />
				Cost Events ({data.costEvents.length})
			</h2>

			{#if data.costEvents.length === 0}
				<p class="text-pencil/60 text-sm">no cost events recorded</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="text-left text-pencil/60 border-b border-pencil/20">
								<th class="py-1">time</th>
								<th>type</th>
								<th>provider</th>
								<th class="text-right">tokens</th>
								<th class="text-right">cost</th>
							</tr>
						</thead>
						<tbody>
							{#each data.costEvents as event}
								<tr class="border-b border-pencil/10">
									<td class="py-1 text-xs">{formatDate(event.createdAt)}</td>
									<td class="font-mono text-xs">{event.eventType}</td>
									<td>{event.provider}</td>
									<td class="text-right text-xs">
										{#if event.inputTokens}
											{event.inputTokens}↓ {event.outputTokens}↑
										{:else if event.durationSeconds}
											{event.durationSeconds}s
										{/if}
									</td>
									<td class="text-right font-mono">{formatCost(event.costUsd)}</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr class="font-bold border-t-2 border-pencil/30">
								<td colspan="4" class="py-2">total</td>
								<td class="text-right font-mono">
									${data.costEvents.reduce((sum, e) => sum + parseFloat(e.costUsd || '0'), 0).toFixed(4)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}
		</WobblyCard>

		<!-- webhook logs -->
		<WobblyCard class="mb-4">
			<h2 class="font-heading text-lg font-bold mb-3 flex items-center gap-2">
				<Webhook size={20} />
				Webhook Logs ({data.webhookLogs.length})
			</h2>

			{#if data.webhookLogs.length === 0}
				<p class="text-pencil/60 text-sm">no webhooks received yet</p>
			{:else}
				<div class="space-y-3">
					{#each data.webhookLogs as log}
						<div class="border-2 border-pencil/20 rounded p-3">
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="flex items-center gap-2">
										<span class="font-mono text-sm">{log.source}</span>
										{#if log.status}
											<span class="text-xs px-2 py-0.5 rounded {log.status === 'completed' ? 'bg-green-100 text-green-800' : log.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
												{log.status}
											</span>
										{/if}
										{#if log.processingError}
											<span class="text-xs px-2 py-0.5 rounded bg-red-200 text-red-900">error</span>
										{:else if log.processedAt}
											<span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">processed</span>
										{:else}
											<span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">pending</span>
										{/if}
									</div>
									{#if log.conversationId}
										<div class="text-xs text-pencil/60 mt-1">conv: <span class="font-mono">{log.conversationId}</span></div>
									{/if}
									{#if log.callId}
										<div class="text-xs text-pencil/60">
											call: <span class="font-mono">{log.callId.slice(0, 8)}...</span>
										</div>
									{/if}
									{#each [estimateCostFromPayload(log.rawPayload)].filter((x): x is NonNullable<typeof x> => !!x) as estCost}
										<div class="text-xs mt-1 flex items-center gap-2">
											<span class="font-mono text-green-600 font-bold">{estCost.cost}</span>
											<span class="text-pencil/50">({estCost.breakdown})</span>
											<span class="text-pencil/40">{estCost.duration}s</span>
										</div>
									{/each}
								</div>
								<div class="text-right text-xs text-pencil/50">
									{formatDate(log.createdAt)}
								</div>
							</div>

							{#if log.processingError}
								<div class="mt-2 text-xs text-red-marker bg-red-50 p-2 rounded">
									{log.processingError}
								</div>
							{/if}

							<details class="mt-2">
								<summary class="text-xs text-blue-pen cursor-pointer">raw payload</summary>
								<pre class="mt-1 text-xs bg-erased p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">{JSON.stringify(JSON.parse(log.rawPayload), null, 2)}</pre>
							</details>

							{#if log.headers}
								<details class="mt-1">
									<summary class="text-xs text-blue-pen cursor-pointer">headers</summary>
									<pre class="mt-1 text-xs bg-erased p-2 rounded overflow-x-auto whitespace-pre-wrap">{JSON.stringify(JSON.parse(log.headers), null, 2)}</pre>
								</details>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</WobblyCard>
	</div>
</div>

<style>
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-body);
		color: var(--color-pencil);
		opacity: 0.7;
		transition: opacity 100ms;
	}

	.back-link:hover {
		opacity: 1;
		color: var(--color-blue-pen);
	}

	.refresh-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.875rem;
		transition: all 100ms;
	}

	.refresh-btn:hover {
		background-color: var(--color-erased);
	}

	.input-field {
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.875rem;
		border-radius: 0.25rem;
	}

	.input-field:focus {
		border-color: var(--color-blue-pen);
		outline: none;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.875rem;
		transition: all 100ms;
	}

	.action-btn:hover:not(:disabled) {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn.primary {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.action-btn.primary:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}
</style>
