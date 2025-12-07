<script lang="ts">
	import { contacts } from '$lib/stores/contacts';
	import TherapistCard from './TherapistCard.svelte';
	import type { Therapist } from '$lib/types';
	import { ChevronDown, ChevronRight, CheckCircle } from 'lucide-svelte';

	interface Props {
		therapists: Therapist[];
		onEmailClick: (therapist: Therapist) => void;
	}

	let { therapists, onEmailClick }: Props = $props();

	// Get IDs of therapists already contacted
	const contactedIds = $derived(new Set($contacts.map((c) => c.therapistId)));

	// Split therapists into contacted and not contacted
	const availableTherapists = $derived(
		therapists.filter((t) => !contactedIds.has(t.id))
	);
	const contactedTherapists = $derived(
		therapists.filter((t) => contactedIds.has(t.id))
	);

	let showContacted = $state(false);
</script>

<div class="therapist-list">
	{#if availableTherapists.length > 0}
		<div class="list-header">
			<span class="font-heading font-bold">Noch nicht kontaktiert</span>
			<span class="badge">{availableTherapists.length}</span>
		</div>
		<div class="space-y-3">
			{#each availableTherapists as therapist (therapist.id)}
				<TherapistCard
					{therapist}
					onEmailClick={() => onEmailClick(therapist)}
				/>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<CheckCircle size={24} class="text-blue-pen" />
			<p>Alle Therapeut:innen wurden kontaktiert!</p>
		</div>
	{/if}

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
				<span>Bereits kontaktiert</span>
			</span>
			<span class="badge muted">{contactedTherapists.length}</span>
		</button>

		{#if showContacted}
			<div class="contacted-list">
				{#each contactedTherapists as therapist (therapist.id)}
					<div class="contacted-item">
						<CheckCircle size={16} class="shrink-0" />
						<span>{therapist.name}</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.therapist-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.list-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.7;
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
	}

	.contacted-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.5;
	}
</style>
