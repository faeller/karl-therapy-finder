<script lang="ts">
	import { contacts } from '$lib/stores/contacts';
	import TherapistCard from './TherapistCard.svelte';
	import type { Therapist } from '$lib/types';
	import { ChevronDown, ChevronRight, CheckCircle, Download } from 'lucide-svelte';
	import { t } from '$lib/i18n';
	import { m } from '$lib/paraglide/messages';
	import { wobbly } from '$lib/utils/wobbly';

	interface Props {
		therapists: Therapist[];
	}

	let { therapists }: Props = $props();

	const INITIAL_SHOW = 5;
	const LOAD_MORE_COUNT = 5;

	// Get IDs of therapists already contacted (not pending)
	const contactedIds = $derived(
		new Set($contacts.filter((c) => c.status !== 'pending').map((c) => c.therapistId))
	);

	// Split therapists into contacted and not contacted
	const availableTherapists = $derived(
		therapists.filter((t) => !contactedIds.has(t.id))
	);
	const contactedTherapists = $derived(
		therapists.filter((t) => contactedIds.has(t.id))
	);

	let showCount = $state(INITIAL_SHOW);
	let showContacted = $state(true);

	const displayedTherapists = $derived(availableTherapists.slice(0, showCount));
	const hasMore = $derived(showCount < availableTherapists.length);
	const remainingCount = $derived(availableTherapists.length - showCount);

	function showMore() {
		showCount = Math.min(showCount + LOAD_MORE_COUNT, availableTherapists.length);
	}

	function exportCsv() {
		const headers = ['Name', 'Titel', 'Adresse', 'Telefon', 'E-Mail', 'Therapieformen', 'Entfernung'];
		const rows = therapists.map((t) => [
			t.name,
			t.title || '',
			t.address,
			t.phone || '',
			t.email || '',
			t.therapyTypes?.join('; ') || '',
			t.distance ? `${t.distance} km` : ''
		]);

		const csv = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
			.join('\n');

		const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'therapeuten.csv';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="therapist-list">
	{#if contactedTherapists.length > 0}
		<button
			onclick={() => (showContacted = !showContacted)}
			class="contacted-toggle"
		>
			<span class="flex items-center gap-2">
				{#if showContacted}
					<ChevronDown size={16} />
				{:else}
					<ChevronRight size={16} />
				{/if}
				<span>{t('chat_already_contacted', 'Bereits kontaktiert')}</span>
			</span>
			<span class="badge muted">{contactedTherapists.length}</span>
		</button>

		{#if showContacted}
			<div class="contacted-list">
				{#each contactedTherapists as therapist (therapist.id)}
					{@const contact = $contacts.find(c => c.therapistId === therapist.id)}
					<div class="contacted-item">
						<CheckCircle size={16} class="shrink-0" />
						<span class="flex-1">{therapist.name}</span>
						{#if contact?.status === 'sent'}
							<a href="/contacts" class="reply-link">{t('chat_got_reply', 'Antwort bekommen?')}</a>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	{#if availableTherapists.length > 0}
		<div class="list-header">
			<span class="font-heading font-bold">{m.chat_not_contacted()}</span>
			{#if availableTherapists.length > INITIAL_SHOW}
				<span class="showing-count">{m.karl_showing_of({ showing: displayedTherapists.length, total: availableTherapists.length })}</span>
			{:else}
				<span class="badge">{availableTherapists.length}</span>
			{/if}
		</div>
		<div class="space-y-3">
			{#each displayedTherapists as therapist (therapist.id)}
				<TherapistCard {therapist} />
			{/each}
		</div>
		{#if hasMore}
			<button onclick={showMore} class="show-more-btn" style:border-radius={wobbly.button}>
				{m.karl_show_more({ count: Math.min(remainingCount, LOAD_MORE_COUNT) })}
			</button>
		{/if}
	{:else}
		<div class="empty-state">
			<CheckCircle size={24} class="text-blue-pen" />
			<p>{m.chat_all_contacted()}</p>
		</div>
	{/if}

	<button onclick={exportCsv} class="export-btn" style:border-radius={wobbly.button}>
		<Download size={16} />
		{m.therapist_export_csv()}
	</button>
</div>

<style>
	.therapist-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.list-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.7;
	}

	.showing-count {
		font-size: 0.75rem;
		opacity: 0.7;
	}

	.show-more-btn {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border: 2px dashed var(--color-pencil);
		background-color: transparent;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		color: var(--color-pencil);
		opacity: 0.6;
		transition: all 150ms;
	}

	.show-more-btn:hover {
		opacity: 1;
		border-style: solid;
		background-color: var(--color-erased);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.375rem;
		border-radius: 9999px;
		background-color: var(--color-blue-pen);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge.muted {
		background-color: var(--color-erased);
		color: var(--color-pencil);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		text-align: center;
		color: var(--color-pencil);
		opacity: 0.7;
	}

	.contacted-toggle {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background-color: var(--color-erased);
		color: var(--color-pencil);
		font-size: 0.875rem;
		opacity: 0.6;
		transition: opacity 150ms;
	}

	.contacted-toggle:hover {
		opacity: 1;
	}

	.contacted-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-left: 0.5rem;
		padding-bottom: 0.5rem;
	}

	.contacted-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.5;
	}

	.reply-link {
		font-size: 0.75rem;
		color: var(--color-blue-pen);
		opacity: 1;
		text-decoration: underline;
		white-space: nowrap;
	}

	.reply-link:hover {
		color: var(--color-red-marker);
	}

	.export-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.7;
		transition: all 150ms;
	}

	.export-btn:hover {
		opacity: 1;
		background-color: var(--color-erased);
	}
</style>
