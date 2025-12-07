<script lang="ts">
	import { contacts, qualifyingContacts } from '$lib/stores/contacts';
	import { generatePdf } from '$lib/utils/pdf';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import ChipButton from '$lib/components/ui/ChipButton.svelte';
	import { ArrowLeft, FileDown, Trash2 } from 'lucide-svelte';
	import type { ContactAttempt } from '$lib/types';

	const waitingTimeOptions = ['< 1 Monat', '1-3 Monate', '3-6 Monate', '> 6 Monate'];
	const statusLabels: Record<ContactAttempt['status'], string> = {
		pending: 'Ausstehend',
		sent: 'Gesendet',
		replied: 'Antwort erhalten',
		no_reply: 'Keine Antwort'
	};

	function updateStatus(id: string, status: ContactAttempt['status']) {
		contacts.updateStatus(id, status);
	}

	function updateWaitingTime(id: string, waitingTime: string) {
		contacts.updateStatus(id, 'replied', waitingTime);
	}

	function removeContact(id: string) {
		if (confirm('Kontaktversuch wirklich löschen?')) {
			contacts.remove(id);
		}
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
				Zurück
			</a>
			<h1 class="font-heading text-2xl font-bold">Kontakte</h1>
		</div>

		<!-- stats -->
		{#if $contacts.length > 0}
			<WobblyCard class="mb-6">
				<div class="flex flex-wrap gap-4 text-center">
					<div class="flex-1">
						<div class="font-heading text-2xl font-bold">{$contacts.length}</div>
						<div class="text-sm text-pencil/60">Kontaktversuche</div>
					</div>
					<div class="flex-1">
						<div class="font-heading text-2xl font-bold">{$qualifyingContacts.length}</div>
						<div class="text-sm text-pencil/60">Qualifizierend</div>
					</div>
				</div>

				{#if $qualifyingContacts.length >= 5}
					<div class="mt-4 border-t border-pencil/20 pt-4">
						<p class="mb-3 text-sm">
							Du hast genug Kontaktversuche für das Kostenerstattungsverfahren dokumentiert!
						</p>
						<WobblyButton onclick={downloadPdf} size="sm">
							<FileDown size={18} strokeWidth={2.5} class="mr-2 inline" />
							PDF herunterladen
						</WobblyButton>
					</div>
				{/if}
			</WobblyCard>
		{/if}

		<!-- contact list -->
		{#if $contacts.length === 0}
			<WobblyCard decoration="postit" class="text-center">
				<p class="mb-2 font-heading text-lg">Noch keine Kontakte</p>
				<p class="text-sm text-pencil/70">
					Schreib Therapeut:innen über den Chat an - die Kontakte erscheinen dann hier.
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
									{statusLabels[status as ContactAttempt['status']]}
								</ChipButton>
							{/each}
						</div>

						{#if contact.status === 'replied'}
							<div class="mt-3">
								<label class="mb-1 block text-xs text-pencil/60">Wartezeit:</label>
								<div class="flex flex-wrap gap-2">
									{#each waitingTimeOptions as time}
										<ChipButton
											selected={contact.waitingTime === time}
											variant="blue"
											onclick={() => updateWaitingTime(contact.id, time)}
										>
											{time}
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
