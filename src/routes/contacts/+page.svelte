<script lang="ts">
	import { onMount } from 'svelte';
	import { contacts, qualifyingContacts } from '$lib/stores/contacts';
	import { downloadPdf, viewPdf } from '$lib/utils/pdf';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import ChipButton from '$lib/components/ui/ChipButton.svelte';
	import { ArrowLeft, FileDown, Eye, Trash2, Pencil, Plus, X, Search, Loader2, MapPin } from 'lucide-svelte';
	import type { ContactAttempt } from '$lib/types';
	import { m } from '$lib/paraglide/messages';
	import { wobbly } from '$lib/utils/wobbly';
	import { nanoid } from 'nanoid';

	let mounted = $state(false);
	onMount(() => { mounted = true; });

	// manual add form state
	let showAddForm = $state(false);
	let addName = $state('');
	let addAddress = $state('');
	let addMethod = $state<ContactAttempt['method']>('phone');

	// photon address search (komoot, free)
	let addressQuery = $state('');
	let addressResults = $state<Array<{ name: string; street?: string; housenumber?: string; postcode?: string; city?: string }>>([]);
	let addressSearching = $state(false);
	let addressTimeout: ReturnType<typeof setTimeout> | null = null;

	async function searchAddress(query: string) {
		if (query.length < 3) {
			addressResults = [];
			return;
		}
		addressSearching = true;
		try {
			const params = new URLSearchParams({
				q: query,
				limit: '5',
				lang: 'de',
				lat: '51.1657',  // germany center bias
				lon: '10.4515'
			});
			const res = await fetch(`https://photon.komoot.io/api/?${params}`);
			if (res.ok) {
				const data = await res.json();
				addressResults = data.features?.map((f: { properties: Record<string, string> }) => f.properties) ?? [];
			}
		} catch (e) {
			console.error('address search failed:', e);
		} finally {
			addressSearching = false;
		}
	}

	function handleAddressInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		addressQuery = value;
		addAddress = value;
		if (addressTimeout) clearTimeout(addressTimeout);
		addressTimeout = setTimeout(() => searchAddress(value), 300);
	}

	function selectAddress(result: { name?: string; street?: string; housenumber?: string; postcode?: string; city?: string }) {
		const parts = [];
		if (result.name && result.name !== result.street) parts.push(result.name);
		if (result.street) parts.push(result.street + (result.housenumber ? ' ' + result.housenumber : ''));
		if (result.postcode || result.city) parts.push([result.postcode, result.city].filter(Boolean).join(' '));
		addAddress = parts.join(', ');
		addressQuery = '';
		addressResults = [];
	}
	let addDate = $state('');
	let addTime = $state('');


	function openAddForm() {
		const now = new Date();
		addDate = now.toISOString().split('T')[0];
		addTime = now.toTimeString().slice(0, 5);
		addName = '';
		addAddress = '';
		addressQuery = '';
		addressResults = [];
		addMethod = 'phone';
		showAddForm = true;
	}

	function closeAddForm() {
		showAddForm = false;
	}


	function handleAddSubmit() {
		if (!addName.trim()) return;
		const dateTime = new Date(`${addDate}T${addTime}`);
		contacts.addWithDate({
			therapistId: `manual-${nanoid(8)}`,
			therapistName: addName.trim(),
			therapistAddress: addAddress.trim() || undefined,
			method: addMethod,
			status: 'sent',
			contactDate: dateTime.toISOString()
		});
		closeAddForm();
	}

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
		{#if !mounted && $contacts.length === 0}
			<div class="flex justify-center py-12">
				<Loader2 size={32} class="animate-spin text-pencil/40" />
			</div>
		{:else if $contacts.length === 0}
			<WobblyCard decoration="postit" class="text-center">
				<p class="mb-2 font-heading text-lg">{m.contacts_empty()}</p>
				<p class="mb-4 text-sm text-pencil/70">
					{m.contacts_empty_hint()}
				</p>
				<WobblyButton onclick={openAddForm} variant="secondary" size="sm">
					<Plus size={16} strokeWidth={2.5} class="mr-1 inline" />
					{m.contacts_add_manual()}
				</WobblyButton>
			</WobblyCard>
		{:else}
			<!-- add button -->
			<button
				onclick={openAddForm}
				class="mb-4 flex w-full items-center justify-center gap-2 border-2 border-dashed border-pencil/30 px-4 py-3 text-pencil/50 transition-colors hover:border-pencil hover:text-pencil"
				style:border-radius={wobbly.md}
			>
				<Plus size={18} strokeWidth={2.5} />
				{m.contacts_add_manual()}
			</button>

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

<!-- add contact modal -->
{#if showAddForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onclick={closeAddForm} onkeydown={(e) => e.key === 'Escape' && closeAddForm()} role="button" tabindex="-1">
		<div
			class="relative w-full max-w-md border-3 border-pencil bg-paper p-6"
			style:border-radius={wobbly.lg}
			style:box-shadow="var(--shadow-hard)"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			role="dialog"
		>
			<button onclick={closeAddForm} class="absolute right-3 top-3 text-pencil/50 hover:text-pencil">
				<X size={20} />
			</button>

			<h2 class="mb-4 font-heading text-xl font-bold">{m.contacts_add_title()}</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleAddSubmit(); }} class="space-y-4">
				<!-- name -->
				<div>
					<label for="add-name" class="mb-1 block text-sm font-medium">{m.contacts_add_name()} *</label>
					<input
						id="add-name"
						type="text"
						bind:value={addName}
						placeholder={m.contacts_add_name_placeholder()}
						class="w-full border-2 border-pencil bg-paper px-3 py-2 focus:border-blue-pen focus:outline-none"
						style:border-radius={wobbly.sm}
						required
					/>
				</div>

				<!-- address with photon search -->
				<div class="relative">
					<label for="add-address" class="mb-1 block text-sm font-medium">{m.contacts_add_address()}</label>
					<div class="relative">
						<input
							id="add-address"
							type="text"
							value={addressQuery || addAddress}
							oninput={handleAddressInput}
							onfocus={() => { if (addAddress && !addressQuery) addressQuery = addAddress; }}
							placeholder={m.contacts_add_address_placeholder()}
							class="w-full border-2 border-pencil bg-paper px-3 py-2 pr-10 focus:border-blue-pen focus:outline-none"
							style:border-radius={wobbly.sm}
						/>
						<div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-pencil/40">
							{#if addressSearching}
								<Loader2 size={16} class="animate-spin" />
							{:else}
								<Search size={16} />
							{/if}
						</div>
					</div>
					{#if addressResults.length > 0}
						<div class="absolute z-10 mt-1 w-full border-2 border-pencil bg-paper shadow-lg" style:border-radius={wobbly.sm}>
							{#each addressResults as result}
								<button
									type="button"
									onclick={() => selectAddress(result)}
									class="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-erased"
								>
									<MapPin size={14} class="mt-0.5 shrink-0 text-pencil/50" />
									<span class="line-clamp-2">
										{[result.name, result.street, result.housenumber, result.postcode, result.city].filter(Boolean).join(', ')}
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- method -->
				<div>
					<label class="mb-1 block text-sm font-medium">{m.contacts_method_label()}</label>
					<div class="flex gap-2">
						{#each methodOptions as option}
							<ChipButton
								selected={addMethod === option.key}
								onclick={() => addMethod = option.key}
							>
								{getMethodLabel(option.labelKey)}
							</ChipButton>
						{/each}
					</div>
				</div>

				<!-- date/time -->
				<div class="flex gap-3">
					<div class="flex-1">
						<label for="add-date" class="mb-1 block text-sm font-medium">{m.contacts_add_date()}</label>
						<input
							id="add-date"
							type="date"
							bind:value={addDate}
							class="w-full border-2 border-pencil bg-paper px-3 py-2 focus:border-blue-pen focus:outline-none"
							style:border-radius={wobbly.sm}
						/>
					</div>
					<div class="flex-1">
						<label for="add-time" class="mb-1 block text-sm font-medium">{m.contacts_add_time()}</label>
						<input
							id="add-time"
							type="time"
							bind:value={addTime}
							class="w-full border-2 border-pencil bg-paper px-3 py-2 focus:border-blue-pen focus:outline-none"
							style:border-radius={wobbly.sm}
						/>
					</div>
				</div>

				<!-- submit -->
				<div class="flex justify-end gap-2 pt-2">
					<WobblyButton type="button" variant="secondary" onclick={closeAddForm}>
						{m.contacts_add_cancel()}
					</WobblyButton>
					<WobblyButton type="submit" disabled={!addName.trim()}>
						{m.contacts_add_submit()}
					</WobblyButton>
				</div>
			</form>
		</div>
	</div>
{/if}
