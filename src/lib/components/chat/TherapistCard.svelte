<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { Mail, Phone, MapPin } from 'lucide-svelte';
	import type { Therapist } from '$lib/types';
	import { generateMailto } from '$lib/utils/mailto';
	import { campaignDraft } from '$lib/stores/campaign';
	import { get } from 'svelte/store';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		therapist: Therapist;
		onEmailClick?: () => void;
	}

	let { therapist, onEmailClick }: Props = $props();

	const mailtoLink = $derived(
		therapist.email ? generateMailto(therapist.email, therapist.name, get(campaignDraft)) : null
	);
</script>

<div
	class="therapist-card border-2 border-pencil p-4"
	style:border-radius={wobbly.md}
	style:box-shadow="var(--shadow-hard-subtle)"
>
	<div class="mb-3">
		<h4 class="font-heading text-lg font-bold">{therapist.name}</h4>
		{#if therapist.title}
			<p class="text-sm text-pencil/70">{therapist.title}</p>
		{/if}
	</div>

	<div class="mb-3 space-y-1 text-sm">
		<div class="flex items-center gap-2">
			<MapPin size={16} strokeWidth={2.5} class="shrink-0" />
			<span>{therapist.address}</span>
			{#if therapist.distance}
				<span class="text-pencil/60">({therapist.distance} km)</span>
			{/if}
		</div>

		{#if therapist.phone}
			<div class="flex items-center gap-2">
				<Phone size={16} strokeWidth={2.5} class="shrink-0" />
				<a href="tel:{therapist.phone}" class="underline hover:text-blue-pen">{therapist.phone}</a>
			</div>
		{/if}
	</div>

	<div class="mb-3 flex flex-wrap gap-1">
		{#each therapist.therapyTypes as type}
			<span class="tag">{type}</span>
		{/each}
	</div>

	{#if mailtoLink}
		<a
			href={mailtoLink}
			onclick={onEmailClick}
			class="email-btn"
			style:border-radius={wobbly.button}
		>
			<Mail size={18} strokeWidth={2.5} />
			{m.email_write()}
		</a>
	{/if}
</div>

<style>
	.therapist-card {
		background-color: var(--color-paper);
	}

	.tag {
		border-radius: 9999px;
		border: 1px solid var(--color-pencil);
		opacity: 0.5;
		background-color: var(--color-erased);
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
	}

	.email-btn {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		padding: 0.5rem 1rem;
		font-family: var(--font-body);
		font-size: 1rem;
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.email-btn:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}
</style>
