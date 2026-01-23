<script lang="ts">
	import { contacts, qualifyingContacts } from '$lib/stores/contacts';
	import { downloadPdf, viewPdf } from '$lib/utils/pdf';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import ChipButton from '$lib/components/ui/ChipButton.svelte';
	import { ArrowLeft, FileDown, Eye, Trash2, Pencil } from 'lucide-svelte';
	import type { ContactAttempt } from '$lib/types';
	import { m } from '$lib/paraglide/messages';

	// store keys as values - translate only for display
	const waitingTimeOptions = [
		{ key: 'waiting_1_month', value: '< 1 Monat' },
		{ key: 'waiting_1_3_months', value: '1-3 Monate' },
		{ key: 'waiting_3_6_months', value: '3-6 Monate' },
		{ key: 'waiting_6_plus_months', value: '> 6 Monate' },
		{ key: 'waiting_no_spot', value: 'Kein Platz' }
	];

	// label is translated for display
	const methodOptions: { key: ContactAttempt['method']; labelKey: string }[] = [
		{ key: 'email', labelKey: 'email' },
		{ key: 'phone', labelKey: 'phone' }
	];

	function getMethodLabel(labelKey: string): string {
		if (labelKey === 'email') return m.pdf_method_email();
		if (labelKey === 'phone') return m.pdf_method_phone();
		return labelKey;
	}

	let editingDateId = $state<string | null>(null);

	function updateStatus(id: string, status: ContactAttempt['status']) {
		contacts.updateStatus(id, status);
	}

	function updateWaitingTime(id: string, waitingTime: string) {
		contacts.updateStatus(id, 'replied', waitingTime);
	}

	function updateDateTime(id: string, dateStr: string, timeStr: string) {
		const combined = new Date(`${dateStr}T${timeStr}`);
		contacts.updateDate(id, combined.toISOString());
	}

	function closeEdit() {
		editingDateId = null;
	}

	function updateMethod(id: string, method: ContactAttempt['method']) {
		contacts.updateMethod(id, method);
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
			waiting_6_plus_months: m.waiting_6_plus_months,
			waiting_no_spot: m.waiting_no_spot
		};
		return labels[key]?.() ?? key;
	}

	function toDateInputValue(isoDate: string): string {
		return isoDate.split('T')[0];
	}

	function toTimeInputValue(isoDate: string): string {
		const d = new Date(isoDate);
		return d.toTimeString().slice(0, 5);
	}

	function handleDownload() {
		downloadPdf($contacts);
	}

	function handleView() {
		viewPdf($contacts);
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

				<div class="mt-4 border-t border-pencil/20 pt-4">
					{#if $qualifyingContacts.length >= 5}
						<p class="mb-3 text-sm">
							{m.contacts_qualifying_hint()}
						</p>
					{/if}
					<div class="flex flex-wrap gap-2">
						<WobblyButton onclick={handleView} size="sm" variant="secondary">
							<Eye size={18} strokeWidth={2.5} class="mr-2 inline" />
							{m.contacts_view_pdf()}
						</WobblyButton>
						<WobblyButton onclick={handleDownload} size="sm">
							<FileDown size={18} strokeWidth={2.5} class="mr-2 inline" />
							{m.contacts_download_pdf()}
						</WobblyButton>
					</div>
				</div>
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
								<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pencil/40">
									{#if editingDateId === contact.id}
										{@const dateVal = toDateInputValue(contact.contactDate)}
										{@const timeVal = toTimeInputValue(contact.contactDate)}
										<div class="flex items-center gap-1">
											<input
												type="date"
												value={dateVal}
												onchange={(e) => updateDateTime(contact.id, e.currentTarget.value, timeVal)}
												class="rounded border border-pencil/30 bg-paper px-1 py-0.5 text-xs"
											/>
											<input
												type="time"
												value={timeVal}
												onchange={(e) => updateDateTime(contact.id, dateVal, e.currentTarget.value)}
												class="rounded border border-pencil/30 bg-paper px-1 py-0.5 text-xs"
											/>
											<button onclick={closeEdit} class="ml-1 text-pencil/60 hover:text-pencil">
												OK
											</button>
										</div>
									{:else}
										<button
											onclick={() => editingDateId = contact.id}
											class="flex items-center gap-1 hover:text-blue-pen"
										>
											{new Date(contact.contactDate).toLocaleDateString('de-DE')}, {new Date(contact.contactDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
											<Pencil size={10} />
										</button>
									{/if}
								</div>
							</div>
							<button
								onclick={() => removeContact(contact.id)}
								class="text-pencil/40 hover:text-red-marker"
								title={m.contacts_delete_title()}
							>
								<Trash2 size={18} strokeWidth={2.5} />
							</button>
						</div>

						<!-- contact method -->
						<div class="mt-3">
							<label class="mb-1 block text-xs text-pencil/60">{m.contacts_method_label()}</label>
							<div class="flex flex-wrap gap-2">
								{#each methodOptions as option}
									<ChipButton
										selected={contact.method === option.key}
										onclick={() => updateMethod(contact.id, option.key)}
									>
										{getMethodLabel(option.labelKey)}
									</ChipButton>
								{/each}
							</div>
						</div>

						<!-- status -->
						<div class="mt-3">
							<label class="mb-1 block text-xs text-pencil/60">{m.contacts_status_label()}</label>
							<div class="flex flex-wrap gap-2">
								{#each ['pending', 'sent', 'replied', 'no_reply'] as status}
									<ChipButton
										selected={contact.status === status}
										onclick={() => updateStatus(contact.id, status as ContactAttempt['status'])}
									>
										{getStatusLabel(status as ContactAttempt['status'])}
									</ChipButton>
								{/each}
							</div>
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
