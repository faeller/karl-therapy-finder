<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import SyncPromptModal from '$lib/components/ui/SyncPromptModal.svelte';
	import { ArrowLeft, LogOut, Cloud, CloudOff, ExternalLink, Loader2, Phone, Clock, CheckCircle, XCircle, Snowflake, Calendar } from 'lucide-svelte';
	import PatreonIcon from '$lib/components/ui/PatreonIcon.svelte';
	import { wobbly } from '$lib/utils/wobbly';
	import { m } from '$lib/paraglide/messages';
	import { formatPledgeTier, formatPledgeAmount, user } from '$lib/stores/user';
	import { initialSync, syncOnLogin, setupAutoSync } from '$lib/services/syncService';
	import { dataSession } from '$lib/stores/dataSession';
	import { getStatusLabel, getOutcomeLabel, getStatusColor, getOutcomeColor } from '$lib/data/callConstants';

	let { data } = $props();
	let syncEnabled = $state(data.user.syncEnabled ?? false);
	let showSyncInfo = $state(false);
	let syncing = $state(false);

	// check for existing local data
	function checkHasExistingData(): boolean {
		if (!browser) return false;
		const appData = dataSession.getData();
		return !!(appData.campaign.plz || appData.contacts.length > 0 || appData.chatMessages.length > 0);
	}

	let hasExistingData = $state(false);
	let showSyncPrompt = $state(false);
	let showCallHistory = $state(false);

	const SYNC_PROMPT_KEY = 'karl_sync_prompt_pending';

	function formatDuration(seconds: number | null): string {
		if (!seconds) return '-';
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatDateTime(iso: string | null): string {
		if (!iso) return '-';
		return new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
	}

	onMount(() => {
		hasExistingData = checkHasExistingData();
		const promptPending = !!localStorage.getItem(SYNC_PROMPT_KEY);
		const needsDecision = data.user.syncEnabled === null;
		const shouldPrompt = needsDecision && (hasExistingData || promptPending);

		if (shouldPrompt && !promptPending) {
			localStorage.setItem(SYNC_PROMPT_KEY, '1');
		}
		showSyncPrompt = shouldPrompt;

		// if sync already enabled, do initial sync
		if (data.user.syncEnabled) {
			syncOnLogin();
			setupAutoSync();
		}
	});

	async function handleSyncChoice(enable: boolean) {
		showSyncPrompt = false;
		localStorage.removeItem(SYNC_PROMPT_KEY);
		if (enable) {
			await enableSync();
		}
		// skip = explicit decision not to sync, clear the prompt flag
	}

	async function enableSync() {
		syncing = true;
		try {
			const fd = new FormData();
			fd.set('enabled', 'true');

			const res = await fetch('?/toggleSync', {
				method: 'POST',
				body: fd
			});

			if (res.ok) {
				syncEnabled = true;
				user.set({ ...data.user, syncEnabled: true });
				await initialSync();
			}
		} catch (e) {
			console.error('Failed to enable sync:', e);
		} finally {
			syncing = false;
		}
	}

	async function toggleSync() {
		syncing = true;
		try {
			const newValue = !syncEnabled;
			const fd = new FormData();
			fd.set('enabled', String(newValue));

			const res = await fetch('?/toggleSync', {
				method: 'POST',
				body: fd
			});

			if (res.ok) {
				syncEnabled = newValue;
				user.set({ ...data.user, syncEnabled: newValue });
				if (newValue) {
					await initialSync();
				}
			}
		} catch (e) {
			console.error('Failed to toggle sync:', e);
		} finally {
			syncing = false;
		}
	}
</script>

<div class="min-h-[100dvh] px-4 py-8">
	<div class="mx-auto max-w-md">
		<!-- back to chat -->
		<a href="/chat" class="back-link">
			<ArrowLeft size={18} />
			{m.contacts_back()}
		</a>

		<!-- user card -->
		<WobblyCard class="mt-6 text-center">
			{#if data.user.avatarUrl}
				<img
					src={data.user.avatarUrl}
					alt={data.user.username}
					class="avatar-large mx-auto"
				/>
			{:else}
				<div class="avatar-fallback-large mx-auto">
					{data.user.username.charAt(0).toUpperCase()}
				</div>
			{/if}
			<h1 class="mt-4 font-heading text-2xl font-bold">{data.user.username}</h1>
			{#if data.user.email}
				<p class="mt-1 text-sm text-pencil/60">{data.user.email}</p>
			{/if}
		</WobblyCard>

		<!-- pledge status -->
		<WobblyCard class="mt-4">
			<div class="flex items-center gap-3">
				<PatreonIcon size={24} class="text-red-marker" />
				<div class="flex-1">
					<h2 class="font-heading text-lg font-bold">{m.auth_pledge_status()}</h2>
					<p class="text-pencil/70">
						{#if data.user.pledgeTier}
							{formatPledgeTier(data.user.pledgeTier)}
							{#if data.user.pledgeAmountCents}
								<span class="text-pencil/50">
									(€{formatPledgeAmount(data.user.pledgeAmountCents)}/mo)
								</span>
							{/if}
						{:else}
							{m.auth_not_pledging()}
						{/if}
					</p>
				</div>
			</div>
			{#if data.user.pledgeTier}
				<a
					href="https://www.patreon.com/settings/memberships"
					target="_blank"
					rel="noopener noreferrer"
					class="manage-link mt-3"
				>
					Abo verwalten
					<ExternalLink size={14} />
				</a>
			{:else}
				<a
					href="https://www.patreon.com/karlhelps"
					target="_blank"
					rel="noopener noreferrer"
					class="mt-4 block"
				>
					<WobblyButton variant="secondary" class="w-full">
						{m.auth_become_patron()}
						<ExternalLink size={16} />
					</WobblyButton>
				</a>
			{/if}
		</WobblyCard>

		<!-- call credits -->
		{#if true}
			{@const hasCredits = data.credits.tierSeconds > 0 || data.credits.availableSeconds > 0}
			{@const availableMins = Math.floor(data.credits.availableSeconds / 60)}
			{@const availableSecs = data.credits.availableSeconds % 60}
			{@const tierMins = Math.floor(data.credits.tierSeconds / 60)}
			{@const totalMins = Math.floor(data.credits.totalSeconds / 60)}
			{@const maxSeconds = data.credits.tierSeconds > 0 ? data.credits.tierSeconds : data.credits.totalSeconds}
			<WobblyCard class="mt-4">
				<div class="flex items-center gap-3">
					<Phone size={24} class="text-blue-pen" />
					<div class="flex-1">
						<h2 class="font-heading text-lg font-bold">{m.account_call_credits()}</h2>
						{#if hasCredits}
							<p class="text-pencil/70">
								{availableMins}:{availableSecs.toString().padStart(2, '0')} / {tierMins > 0 ? tierMins : totalMins}:00 min
							</p>
						{:else}
							<p class="text-pencil/70">
								0:00 min
							</p>
						{/if}
					</div>
				</div>
					<!-- progress bar -->
				<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-erased">
					{#if hasCredits && maxSeconds > 0}
						<div
							class="h-full bg-blue-pen transition-all"
							style:width="{Math.min(100, (data.credits.availableSeconds / maxSeconds) * 100)}%"
						></div>
					{/if}
				</div>
				<div class="mt-2 flex justify-between text-xs text-pencil/50">
					{#if data.credits.tierSeconds > 0}
						<span>{m.account_credits_refresh()}</span>
					{:else if !hasCredits}
						<span>{m.auth_become_patron()}</span>
					{:else}
						<span></span>
					{/if}
					{#if data.credits.pendingCalls > 0}
						<span>{data.credits.pendingCalls} geplant ({Math.floor(data.credits.projectedSeconds / 60)} min reserviert)</span>
					{/if}
				</div>

				<!-- pending calls -->
				{#if data.pendingCalls.length > 0}
					<div class="mt-4 border-t border-pencil/20 pt-4">
						<h3 class="text-sm font-bold mb-2 flex items-center gap-2">
							<Clock size={16} />
							Geplante Anrufe
						</h3>
						<div class="space-y-2">
							{#each data.pendingCalls as call}
								<div class="flex items-center justify-between text-sm bg-erased rounded px-3 py-2">
									<div class="flex items-center gap-2">
										{#if call.status === 'frozen'}
											<Snowflake size={14} class="text-cyan-600" />
										{:else}
											<Clock size={14} class="text-blue-pen" />
										{/if}
										<span class="font-medium truncate max-w-[140px]">{call.therapistName || 'Unbekannt'}</span>
									</div>
									<div class="flex items-center gap-3 text-xs text-pencil/60">
										<span>{formatDuration(call.projectedSeconds)} res.</span>
										{#if call.status === 'frozen'}
											<span class="text-cyan-600">pausiert</span>
										{:else if call.scheduledAt}
											<span>{formatDateTime(call.scheduledAt)}</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- call history toggle -->
				{#if data.callHistory.length > 0}
					<button
						onclick={() => showCallHistory = !showCallHistory}
						class="info-link mt-4"
					>
						{showCallHistory ? 'Verlauf ausblenden' : `Anrufverlauf (${data.callHistory.length})`}
					</button>

					{#if showCallHistory}
						<div class="mt-3 space-y-2">
							{#each data.callHistory as call}
								<div class="text-sm bg-erased rounded px-3 py-2">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											{#if call.status === 'completed'}
												<CheckCircle size={14} class="text-green-600" />
											{:else if call.status === 'cancelled'}
												<XCircle size={14} class="text-pencil/50" />
											{:else}
												<XCircle size={14} class="text-red-marker" />
											{/if}
											<span class="font-medium truncate max-w-[140px]">{call.therapistName || 'Unbekannt'}</span>
										</div>
										<div class="text-xs text-pencil/60">
											{call.completedAt ? formatDateTime(call.completedAt) : '-'}
										</div>
									</div>
									<div class="flex items-center justify-between mt-1 text-xs text-pencil/60">
										<div class="flex items-center gap-2">
											{#if call.outcome}
												<span class="px-1.5 py-0.5 rounded {getOutcomeColor(call.outcome)}">
													{getOutcomeLabel(call.outcome)}
												</span>
											{/if}
											{#if call.appointmentDate}
												<span class="flex items-center gap-1 text-green-600">
													<Calendar size={12} />
													{call.appointmentDate} {call.appointmentTime || ''}
												</span>
											{/if}
										</div>
										{#if call.durationSeconds}
											<span>{formatDuration(call.durationSeconds)}</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</WobblyCard>
		{/if}

		<!-- sync settings -->
		<WobblyCard class="mt-4">
			<div class="flex items-start gap-3">
				{#if syncEnabled}
					<Cloud size={24} class="text-blue-pen shrink-0" />
				{:else}
					<CloudOff size={24} class="text-pencil/50 shrink-0" />
				{/if}
				<div class="flex-1">
					<h2 class="font-heading text-lg font-bold">{m.auth_sync_title()}</h2>
					<p class="text-sm text-pencil/70">{m.auth_sync_description()}</p>
				</div>
			</div>

			<button
				onclick={toggleSync}
				disabled={syncing}
				class="sync-toggle mt-4"
				style:border-radius={wobbly.button}
			>
				{#if syncing}
					<Loader2 size={20} class="animate-spin" />
				{:else}
					<span class="toggle-track" class:enabled={syncEnabled}>
						<span class="toggle-thumb"></span>
					</span>
				{/if}
				<span>{syncEnabled ? m.auth_sync_enabled() : m.auth_sync_disabled()}</span>
			</button>

			<button
				onclick={() => showSyncInfo = !showSyncInfo}
				class="info-link mt-3"
			>
				{m.auth_sync_what_is_synced()}
			</button>

			{#if showSyncInfo}
				<div class="mt-3 rounded bg-erased p-3 text-sm text-pencil/70">
					<p>{m.auth_sync_info()}</p>
					<ul class="mt-2 list-inside list-disc">
						<li>{m.auth_sync_info_campaign()}</li>
						<li>{m.auth_sync_info_contacts()}</li>
					</ul>
				</div>
			{/if}
		</WobblyCard>

		<!-- logout -->
		<div class="mt-6 text-center">
			<a href="/auth/logout" class="logout-link">
				<LogOut size={16} />
				{m.auth_logout()}
			</a>
		</div>
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

	.avatar-large {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 3px solid var(--color-pencil);
		object-fit: cover;
	}

	.avatar-fallback-large {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 3px solid var(--color-pencil);
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-blue-pen);
		color: white;
		font-family: var(--font-heading);
		font-size: 32px;
		font-weight: 700;
	}

	.sync-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 1rem;
		color: var(--color-pencil);
		transition: all 100ms;
	}

	.sync-toggle:hover {
		background-color: var(--color-erased);
	}

	.toggle-track {
		position: relative;
		width: 44px;
		height: 24px;
		background-color: var(--color-erased);
		border-radius: 12px;
		transition: background-color 200ms;
	}

	.toggle-track.enabled {
		background-color: var(--color-blue-pen);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background-color: var(--color-paper);
		border-radius: 50%;
		transition: transform 200ms;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-track.enabled .toggle-thumb {
		transform: translateX(20px);
	}

	.info-link {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--color-blue-pen);
		text-decoration: underline;
	}

	.info-link:hover {
		color: var(--color-red-marker);
	}

	.manage-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--color-blue-pen);
		text-decoration: underline;
	}

	.manage-link:hover {
		color: var(--color-red-marker);
	}

	.logout-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-body);
		color: var(--color-pencil);
		opacity: 0.6;
		transition: all 100ms;
	}

	.logout-link:hover {
		opacity: 1;
		color: var(--color-red-marker);
	}
</style>

{#if showSyncPrompt}
	<SyncPromptModal
		onSync={() => handleSyncChoice(true)}
		onSkip={() => handleSyncChoice(false)}
		onLater={() => showSyncPrompt = false}
	/>
{/if}
