<script lang="ts">
	import { contacts, qualifyingContacts } from '$lib/stores/contacts';
	import { generatePdf } from '$lib/utils/pdf';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import ChipButton from '$lib/components/ui/ChipButton.svelte';
	import { ArrowLeft, FileDown, Trash2 } from 'lucide-svelte';
	import type { ContactAttempt } from '$lib/types';
	import { m } from '$lib/paraglide/messages';

	const waitingTimeOptions = [
		{ key: 'waiting_1_month', value: '< 1 Monat' },
		{ key: 'waiting_1_3_months', value: '1-3 Monate' },
		{ key: 'waiting_3_6_months', value: '3-6 Monate' },
		{ key: 'waiting_6_plus_months', value: '> 6 Monate' }
	];
	const statusKeys: Record<ContactAttempt['status'], string> = {
		pending: 'status_pending',
		sent: 'status_sent',
		replied: 'status_replied',
		no_reply: 'status_no_reply'
	};

	function updateStatus(id: string, status: ContactAttempt['status']) {
		contacts.updateStatus(id, status);
	}

	function updateWaitingTime(id: string, waitingTime: string) {
		contacts.updateStatus(id, 'replied', waitingTime);
	}

	function removeContact(id: string) {
		if (confirm(m.contacts_delete_confirm())) {
			contacts.remove(id);
		}
	}

	function getStatusLabel(status: ContactAttempt['status']): string {
		const labels: Record<ContactAttempt['status'], () => string> = {
			pending: m.status_pending,
			sent: m.status_sent,
			replied: m.status_replied,
			no_reply: m.status_no_reply
		};
		return labels[status]();
	}

	function getWaitingTimeLabel(key: string): string {
		const labels: Record<string, () => string> = {
			waiting_1_month: m.waiting_1_month,
			waiting_1_3_months: m.waiting_1_3_months,
			waiting_3_6_months: m.waiting_3_6_months,
			waiting_6_plus_months: m.waiting_6_plus_months
		};
		return labels[key]?.() ?? key;
	}

	function downloadPdf() {
		generatePdf($contacts);
	}
</script>

<div class="min-h-[100dvh] px-4 py-6">
	<div class="mx-auto max-w-2xl">
		<!-- header -->
		<div class="mb-6 flex items-center justify-between">
			<a href="/chat" class="flex items-center gap-2 text-pencil hover:text-blue-pen">
				<ArrowLeft size={20} strokeWidth={2.5} />
				{m.contacts_back()}
			</a>
			<h1 class="font-heading text-2xl font-bold">{m.contacts_title()}</h1>
		</div>

		<!-- stats -->
		{#if $contacts.length > 0}
			<WobblyCard class="mb-6">
				<div class="flex flex-wrap gap-4 text-center">
					<div class="flex-1">
						<div class="font-heading text-2xl font-bold">{$contacts.length}</div>
						<div class="text-sm text-pencil/60">{m.contacts_attempts()}</div>
					</div>
					<div class="flex-1">
						<div class="font-heading text-2xl font-bold">{$qualifyingContacts.length}</div>
						<div class="text-sm text-pencil/60">{m.contacts_qualifying()}</div>
					</div>
				</div>

				{#if $qualifyingContacts.length >= 5}
					<div class="mt-4 border-t border-pencil/20 pt-4">
						<p class="mb-3 text-sm">
							{m.contacts_qualifying_hint()}
						</p>
						<WobblyButton onclick={downloadPdf} size="sm">
							<FileDown size={18} strokeWidth={2.5} class="mr-2 inline" />
							{m.contacts_download_pdf()}
						</WobblyButton>
					</div>
				{/if}
			</WobblyCard>
		{/if}

		<!-- contact list -->
		{#if $contacts.length === 0}
			<WobblyCard decoration="postit" class="text-center">
				<p class="mb-2 font-heading text-lg">{m.contacts_empty()}</p>
				<p class="text-sm text-pencil/70">
					{m.contacts_empty_hint()}
				</p>
			</WobblyCard>
		{:else}
			<div class="space-y-4">
				{#each $contacts as contact (contact.id)}
					<WobblyCard>
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1">
								<h3 class="font-heading font-bold">{contact.therapistName}</h3>
								{#if contact.therapistAddress}
									<p class="text-sm text-pencil/60">{contact.therapistAddress}</p>
								{/if}
								<p class="mt-1 text-xs text-pencil/40">
									{new Date(contact.contactDate).toLocaleDateString('de-DE')} via {contact.method === 'email' ? 'E-Mail' : contact.method}
								</p>
							</div>
							<button
								onclick={() => removeContact(contact.id)}
								class="text-pencil/40 hover:text-red-marker"
							>
								<Trash2 size={18} strokeWidth={2.5} />
							</button>
						</div>

						<div class="mt-3 flex flex-wrap gap-2">
							{#each ['pending', 'sent', 'replied', 'no_reply'] as status}
								<ChipButton
									selected={contact.status === status}
									onclick={() => updateStatus(contact.id, status as ContactAttempt['status'])}
								>
									{getStatusLabel(status as ContactAttempt['status'])}
								</ChipButton>
							{/each}
						</div>

						{#if contact.status === 'replied'}
							<div class="mt-3">
								<label class="mb-1 block text-xs text-pencil/60">{m.waiting_time()}:</label>
								<div class="flex flex-wrap gap-2">
									{#each waitingTimeOptions as option}
										<ChipButton
											selected={contact.waitingTime === option.value}
											variant="blue"
											onclick={() => updateWaitingTime(contact.id, option.value)}
										>
											{getWaitingTimeLabel(option.key)}
										</ChipButton>
									{/each}
								</div>
							</div>
						{/if}
					</WobblyCard>
				{/each}
			</div>
		{/if}
	</div>
</div>
