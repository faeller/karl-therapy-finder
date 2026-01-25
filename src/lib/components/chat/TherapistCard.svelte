<script lang="ts">
	import { goto } from '$app/navigation';
	import { wobbly } from '$lib/utils/wobbly';
	import { Mail, Phone, MapPin, PhoneCall, ExternalLink, Search } from 'lucide-svelte';
	import type { Therapist } from '$lib/types';
	import { generateMailto } from '$lib/utils/mailto';
	import { campaignDraft } from '$lib/stores/campaign';
	import { contacts } from '$lib/stores/contacts';
	import { user } from '$lib/stores/user';
	import { debug, DEBUG_THERAPIST_ID } from '$lib/stores/debug';
	import { get } from 'svelte/store';
	import { m } from '$lib/paraglide/messages';
	import PatreonIcon from '$lib/components/ui/PatreonIcon.svelte';
	import AutoCallModal from './AutoCallModal.svelte';

	interface Props {
		therapist: Therapist;
		onContactConfirm?: (confirmed: boolean) => void;
	}

	let { therapist, onContactConfirm }: Props = $props();

	const mailtoLink = $derived(
		therapist.email ? generateMailto(therapist.email, therapist.name, get(campaignDraft)) : null
	);

	// check if there's a pending contact for this therapist
	const pendingContact = $derived(
		$contacts.find((c) => c.therapistId === therapist.id && c.status === 'pending')
	);

	// auto-call modal state
	let showAutoCallModal = $state(false);

	// check if user can use auto-call (debug mode, debug therapist, or paid tier)
	const isDebugTherapist = $derived(therapist.id === DEBUG_THERAPIST_ID);
	const canUseAutoCall = $derived(
		$debug.enabled || isDebugTherapist || $user?.pledgeTier === 'supporter' || $user?.pledgeTier === 'premium'
	);
	const hasPhone = $derived(!!therapist.phone);

	// check if already has a scheduled/pending auto-call (for button styling only)
	const hasScheduledCall = $derived(
		$contacts.some((c) => c.therapistId === therapist.id && c.method === 'auto-call')
	);

	// extract city from address (format: "Street, PLZ City")
	const googleSearchUrl = $derived.by(() => {
		const parts = therapist.address?.split(',');
		const cityPart = parts?.[1]?.trim() || '';
		const city = cityPart.replace(/^\d{5}\s*/, '');
		const query = `${therapist.name} ${city}`.trim();
		return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
	});

	function copyEmail() {
		if (therapist.email) {
			navigator.clipboard.writeText(therapist.email);
		}
	}

	function handleEmailClick() {
		contacts.add({
			therapistId: therapist.id,
			therapistName: therapist.name,
			therapistEmail: therapist.email,
			therapistPhone: therapist.phone,
			therapistAddress: therapist.address,
			method: 'email',
			status: 'pending'
		});
	}

	function handlePhoneClick() {
		contacts.add({
			therapistId: therapist.id,
			therapistName: therapist.name,
			therapistEmail: therapist.email,
			therapistPhone: therapist.phone,
			therapistAddress: therapist.address,
			method: 'phone',
			status: 'pending'
		});
	}

	function confirmContact(confirmed: boolean) {
		if (confirmed) {
			contacts.updateStatusByTherapistId(therapist.id, 'sent');
			goto('/contacts');
		} else {
			contacts.removeByTherapistId(therapist.id);
		}
		onContactConfirm?.(confirmed);
	}

	function openAutoCallModal() {
		if (!canUseAutoCall || !hasPhone) return;
		showAutoCallModal = true;
	}
</script>

<div class="card-wrapper">
<div
	class="therapist-card relative p-4"
	style:border-radius={wobbly.md}
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

		<div class="flex items-center gap-2">
			<Mail size={16} strokeWidth={2.5} class="shrink-0" />
			{#if therapist.email}
				<button onclick={copyEmail} class="underline hover:text-blue-pen text-left" title="Kopieren">
					{therapist.email}
				</button>
			{:else}
				<span class="text-pencil/50 italic">{m.therapist_no_email()}</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<Search size={16} strokeWidth={2.5} class="shrink-0" />
			<a
				href={googleSearchUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="underline hover:text-blue-pen"
			>
				Auf Google suchen
			</a>
		</div>

		{#if therapist.profileUrl}
			<div class="flex items-center gap-2">
				<ExternalLink size={16} strokeWidth={2.5} class="shrink-0" />
				<a
					href={therapist.profileUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-blue-pen"
				>
					{m.therapist_more_info()}
				</a>
			</div>
		{/if}
	</div>

	<div class="mb-3 flex flex-wrap gap-1">
		{#each therapist.therapyTypes as type}
			<span class="tag">{type}</span>
		{/each}
	</div>

	<div class="flex flex-col gap-2">
		{#if mailtoLink && !pendingContact}
			<a
				href={mailtoLink}
				onclick={handleEmailClick}
				class="action-btn"
				style:border-radius={wobbly.button}
			>
				<Mail size={18} strokeWidth={2.5} class="shrink-0" />
				{m.email_write()}
			</a>
		{/if}

		<div class="call-buttons">
			{#if therapist.phone && (!pendingContact || pendingContact.method !== 'phone')}
				<a
					href="tel:{therapist.phone}"
					onclick={handlePhoneClick}
					class="action-btn secondary"
					style:border-radius={wobbly.button}
				>
					<Phone size={16} strokeWidth={2.5} class="shrink-0" />
					{m.therapist_call()}
				</a>
			{/if}

			{#if hasScheduledCall}
				<button
					onclick={openAutoCallModal}
					class="action-btn scheduled"
					style:border-radius={wobbly.button}
				>
					<PhoneCall size={16} strokeWidth={2.5} class="shrink-0" />
					Anruf ansehen
				</button>
			{:else if canUseAutoCall && hasPhone}
				<button
					onclick={openAutoCallModal}
					class="action-btn auto-call"
					style:border-radius={wobbly.button}
				>
					<PhoneCall size={16} strokeWidth={2.5} class="shrink-0" />
					{m.therapist_call_for_me()}
				</button>
			{:else}
				<button
					disabled
					class="action-btn coming-soon"
					style:border-radius={wobbly.button}
					title={!hasPhone ? 'Keine Telefonnummer' : m.therapist_call_for_me_soon()}
				>
					<span class="shrink-0"><PatreonIcon size={14} /></span>
					{m.therapist_call_for_me_disabled()}
				</button>
			{/if}
		</div>
	</div>

</div>
</div>

{#if pendingContact}
	<div class="confirm-prompt">
		<p class="confirm-message">
			{#if pendingContact.method === 'email'}
				{m.email_sent_question({ name: therapist.name })}
			{:else}
				{m.phone_call_question({ name: therapist.name })}
			{/if}
		</p>
		<div class="confirm-buttons">
			<button
				onclick={() => confirmContact(true)}
				class="confirm-btn yes"
				style:border-radius={wobbly.button}
			>
				{#if pendingContact.method === 'email'}
					{m.option_yes_sent()}
				{:else}
					{m.option_yes_called()}
				{/if}
			</button>
			<button
				onclick={() => confirmContact(false)}
				class="confirm-btn no"
				style:border-radius={wobbly.button}
			>
				{m.option_no_cancelled()}
			</button>
		</div>
	</div>
{/if}

<AutoCallModal
	{therapist}
	open={showAutoCallModal}
	onClose={() => showAutoCallModal = false}
/>

<style>
	/* wrapper for positioning tape relative to card */
	.card-wrapper {
		position: relative;
		margin-top: 0.75rem;
	}

	/* ========================================
	   imessage theme (default)
	   ======================================== */
	.therapist-card {
		background-color: var(--color-erased);
		border: 1px solid var(--color-card-border);
		overflow: visible;
	}

	.tag {
		border-radius: 9999px;
		background-color: var(--color-paper);
		border: 1px solid var(--color-card-border);
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
		color: var(--color-secondary);
	}

	.action-btn {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 1px solid var(--color-card-border);
		background-color: var(--color-paper);
		padding: 0.625rem 1rem;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		border-radius: 10px;
		transition: all 100ms;
	}

	.action-btn:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	.action-btn.secondary {
		background-color: var(--color-paper);
	}

	.action-btn.secondary:hover:not(:disabled) {
		background-color: var(--color-erased);
		border-color: var(--color-card-border);
		color: var(--color-pencil);
	}

	.action-btn.coming-soon {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-btn.auto-call {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.action-btn.auto-call:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.action-btn.scheduled {
		background-color: var(--color-paper);
		font-size: 0.8rem;
		color: var(--color-secondary);
	}

	.action-btn.scheduled:hover:not(:disabled) {
		background-color: var(--color-erased);
		color: var(--color-pencil);
	}

	.call-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (min-width: 320px) {
		.call-buttons {
			flex-direction: row;
		}

		.call-buttons > * {
			flex: 1;
		}
	}

	.confirm-prompt {
		margin-top: 0.75rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 12px;
		background-color: var(--color-erased);
	}

	.confirm-message {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.confirm-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.confirm-btn {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-card-border);
		border-radius: 8px;
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.875rem;
		transition: all 100ms;
	}

	.confirm-btn:hover {
		background-color: var(--color-erased);
	}

	.confirm-btn.yes {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.confirm-btn.yes:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	/* ========================================
	   handdrawn theme overrides
	   ======================================== */
	:global(:root.theme-handdrawn) .therapist-card {
		background-color: var(--color-paper);
		border: 2px solid var(--color-pencil);
		box-shadow: var(--shadow-hard-subtle);
	}

	:global(:root.theme-handdrawn) .tag {
		border: 1px solid var(--color-pencil);
		opacity: 0.5;
		background-color: var(--color-erased);
		color: inherit;
	}

	:global(:root.theme-handdrawn) .action-btn {
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		box-shadow: var(--shadow-hard-sm);
		transition: all 100ms;
	}

	:global(:root.theme-handdrawn) .action-btn:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	:global(:root.theme-handdrawn) .action-btn:active:not(:disabled) {
		opacity: 1;
	}

	:global(:root.theme-handdrawn) .action-btn.secondary {
		background-color: transparent;
		box-shadow: none;
	}

	:global(:root.theme-handdrawn) .action-btn.coming-soon {
		opacity: 0.35;
		background-color: var(--color-erased);
		box-shadow: none;
	}

	:global(:root.theme-handdrawn) .action-btn.auto-call {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	:global(:root.theme-handdrawn) .action-btn.auto-call:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	:global(:root.theme-handdrawn) .action-btn.scheduled {
		background-color: var(--color-erased);
		border-style: dashed;
		opacity: 0.8;
		color: var(--color-pencil);
	}

	:global(:root.theme-handdrawn) .confirm-prompt {
		border-radius: 0.5rem;
	}

	:global(:root.theme-handdrawn) .confirm-btn {
		border: 2px solid var(--color-pencil);
		transition: all 100ms;
	}

	:global(:root.theme-handdrawn) .confirm-btn.yes {
		background-color: var(--color-paper);
		border-color: var(--color-pencil);
		color: var(--color-pencil);
	}

	:global(:root.theme-handdrawn) .confirm-btn.yes:hover {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	:global(:root.theme-handdrawn) .confirm-btn.no:hover {
		background-color: var(--color-erased);
	}
</style>
