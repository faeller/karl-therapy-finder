<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { Mail, Phone, MapPin, PhoneCall, ExternalLink } from 'lucide-svelte';
	import type { Therapist } from '$lib/types';
	import { generateMailto } from '$lib/utils/mailto';
	import { campaignDraft } from '$lib/stores/campaign';
	import { contacts } from '$lib/stores/contacts';
	import { get } from 'svelte/store';
	import { m } from '$lib/paraglide/messages';
	import KarlAvatar from './KarlAvatar.svelte';

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
		} else {
			contacts.removeByTherapistId(therapist.id);
		}
		onContactConfirm?.(confirmed);
	}
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
				<Mail size={18} strokeWidth={2.5} />
				{m.email_write()}
			</a>
		{/if}

		<div class="flex gap-2">
			{#if therapist.phone && (!pendingContact || pendingContact.method !== 'phone')}
				<a
					href="tel:{therapist.phone}"
					onclick={handlePhoneClick}
					class="action-btn secondary flex-1"
					style:border-radius={wobbly.button}
				>
					<Phone size={16} strokeWidth={2.5} />
					{m.therapist_call()}
				</a>
			{/if}

			<button
				disabled
				class="action-btn coming-soon flex-1"
				style:border-radius={wobbly.button}
			>
				<PhoneCall size={16} strokeWidth={2.5} />
				{m.therapist_call_for_me()}
			</button>
		</div>
	</div>

</div>

{#if pendingContact}
	<div class="confirm-prompt">
		<div class="confirm-message">
			<KarlAvatar size="sm" />
			<span>
				{#if pendingContact.method === 'email'}
					{m.email_sent_question({ name: therapist.name })}
				{:else}
					{m.phone_call_question({ name: therapist.name })}
				{/if}
			</span>
		</div>
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

	.action-btn {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		padding: 0.5rem 1rem;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.action-btn:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	.action-btn.secondary {
		background-color: transparent;
		box-shadow: none;
	}

	.action-btn.coming-soon {
		opacity: 0.35;
		cursor: not-allowed;
		background-color: var(--color-erased);
		box-shadow: none;
	}

	.confirm-prompt {
		margin-top: 0.75rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background-color: var(--color-erased);
	}

	.confirm-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.confirm-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.confirm-btn {
		flex: 1;
		padding: 0.375rem 0.75rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.875rem;
		transition: all 100ms;
	}

	.confirm-btn.yes:hover {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.confirm-btn.no:hover {
		background-color: var(--color-erased);
	}
</style>
