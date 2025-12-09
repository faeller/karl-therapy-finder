<script lang="ts">
	import { onMount } from 'svelte';
	import { chat } from '$lib/stores/chat';
	import { campaignDraft } from '$lib/stores/campaign';
	import { contacts } from '$lib/stores/contacts';
	import { getCityFromPlz } from '$lib/data/plzLookup';
	import { OptionId } from '$lib/data/optionIds';
	import MessageBubble from '$lib/components/chat/MessageBubble.svelte';
	import OptionButtons from '$lib/components/chat/OptionButtons.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import TypingIndicator from '$lib/components/chat/TypingIndicator.svelte';
	import TherapistList from '$lib/components/chat/TherapistList.svelte';
	import ChatSection from '$lib/components/chat/ChatSection.svelte';
	import EditDialog from '$lib/components/chat/EditDialog.svelte';
	import EterminserviceStep from '$lib/components/chat/EterminserviceStep.svelte';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import LangToggle from '$lib/components/ui/LangToggle.svelte';
	import { ClipboardList, RotateCcw, Sun, Moon, Undo2, HelpCircle } from 'lucide-svelte';
	import { wobbly } from '$lib/utils/wobbly';
	import PatreonIcon from '$lib/components/ui/PatreonIcon.svelte';
	import { theme } from '$lib/stores/theme';
	import { m } from '$lib/paraglide/messages';
	import type { ChatOption, Therapist, ChatMessage, ChatState } from '$lib/types';

	const { messages, isTyping, state: chatState } = chat;

	// progress calculation
	// finding therapists is ~40%, contacting them and getting responses is the rest
	const progress = $derived.by(() => {
		// onboarding: 5-25%
		const onboardingStates = ['greeting', 'for_whom', 'for_other_name', 'location', 'insurance_type', 'insurance_details', 'therapy_type', 'preferences'];
		const onboardingIdx = onboardingStates.indexOf($chatState);
		if (onboardingIdx >= 0) return 5 + Math.round((onboardingIdx / (onboardingStates.length - 1)) * 20);

		// summary/edit = 28%
		if (['summary', 'edit_hint'].includes($chatState)) return 28;
		// terminservice = 32%
		if ($chatState === 'terminservice') return 32;
		// searching = 38%
		if ($chatState === 'searching') return 38;

		// results phase: 40% + progress based on contacts
		if ($chatState === 'results') {
			const totalTherapists = allTherapists.length || 1;
			const contacted = $contacts.length;
			const contactProgress = Math.min(contacted / Math.min(totalTherapists, 10), 1); // cap at 10 contacts for 100%
			return 40 + Math.round(contactProgress * 60);
		}

		return 0;
	});

	// undo - find previous user message and go back
	function handleUndo() {
		const msgs = $messages;
		if (msgs.length < 2) return;
		// find last user message index
		let lastUserIdx = -1;
		for (let i = msgs.length - 1; i >= 0; i--) {
			if (msgs[i].role === 'user') {
				lastUserIdx = i;
				break;
			}
		}
		if (lastUserIdx > 0) {
			chat.rewindTo(lastUserIdx);
		}
	}

	const canUndo = $derived($messages.length > 1 && !$isTyping);

	let messagesContainer: HTMLDivElement;

	// Edit dialog state
	let editingMessageIndex = $state<number | null>(null);

	// Process explanation toggle (for "Wie funktioniert das?" in history)
	let showProcessExplanation = $state(false);

	// Re-search modal state
	let showReSearchModal = $state(false);

	// Find the Karl message that prompted this user answer
	const editingKarlMessage = $derived.by(() => {
		if (editingMessageIndex === null) return null;
		// Look backwards from the user message to find the Karl message
		for (let i = editingMessageIndex - 1; i >= 0; i--) {
			const msg = $messages[i];
			if (msg.role === 'karl' && (msg.options?.length || msg.inputType)) {
				return msg;
			}
		}
		return null;
	});

	const editingCurrentValue = $derived(
		editingMessageIndex !== null ? $messages[editingMessageIndex]?.content : ''
	);

	const editingCurrentContentKey = $derived(
		editingMessageIndex !== null ? $messages[editingMessageIndex]?.contentKey : undefined
	);

	onMount(() => {
		// ensure all stores are hydrated from localStorage before starting
		chat.hydrateChat();
		campaignDraft.hydrate();
		chat.start();
	});

	// auto-scroll on new messages
	$effect(() => {
		if ($messages.length && messagesContainer) {
			setTimeout(() => {
				if (isInResults) {
					// in results, scroll to show the results section (scroll up more)
					const resultsSection = messagesContainer.querySelector('[data-section="results"]');
					if (resultsSection) {
						resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
					} else {
						// fallback: scroll up enough to show new content
						const targetScroll = messagesContainer.scrollTop + 500;
						messagesContainer.scrollTop = Math.min(targetScroll, messagesContainer.scrollHeight);
					}
				} else {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 100);
		}
	});

	async function handleOptionSelect(option: ChatOption) {
		if (option.id === OptionId.useLocation) {
			const plz = await handleGetLocation();
			if (plz) handleTextSubmit(plz);
			return;
		}
		chat.handleOption(option);
	}

	function handleMultiSelect(options: ChatOption[]) {
		chat.handleMultiSelect(options);
	}

	function handleTextSubmit(text: string) {
		chat.handleInput(text);
	}

	function handleEdit(messageIndex: number) {
		editingMessageIndex = messageIndex;
	}

	function handleReset() {
		if (confirm(m.chat_reset_confirm())) {
			chat.reset();
		}
	}

	async function handleEditSubmit(newValue: string, option?: ChatOption, contentKey?: string) {
		if (editingMessageIndex === null) return;

		// handle geolocation option in edit mode
		if (option?.id === OptionId.useLocation) {
			const plz = await handleGetLocation();
			if (plz) {
				const needsReSearch = await chat.updateMessage(editingMessageIndex, plz, undefined, undefined);
				const city = getCityFromPlz(plz) || '';
				campaignDraft.update((d) => ({ ...d, plz, city }));
				if (needsReSearch) showReSearchModal = true;
			}
			editingMessageIndex = null;
			return;
		}

		// check if editing location field - update campaignDraft.plz
		const editedMessage = $messages[editingMessageIndex];
		if (editedMessage?.field === 'location' && !option) {
			const plz = newValue.match(/\d{5}/)?.[0];
			if (plz) {
				const city = getCityFromPlz(plz) || '';
				campaignDraft.update((d) => ({ ...d, plz, city }));
			}
		}

		const needsReSearch = await chat.updateMessage(editingMessageIndex, newValue, option, contentKey);
		editingMessageIndex = null;
		if (needsReSearch) showReSearchModal = true;
	}

	function handleEditMultiSubmit(options: ChatOption[]) {
		// use centralized mapping from optionMapping.ts - handled by chat.updateMessage already
	}

	// Geolocation
	let isGettingLocation = $state(false);

	async function handleGetLocation(): Promise<string | null> {
		if (isGettingLocation) return null;

		if (!navigator.geolocation) {
			alert('Geolocation wird von diesem Browser nicht unterstützt');
			return null;
		}

		isGettingLocation = true;
		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: false, // wifi/cell is faster and plz-accurate enough
					timeout: 20000,
					maximumAge: 300000 // 5 min cache is fine for plz
				});
			});

			const { latitude, longitude } = position.coords;
			const response = await fetch(
				`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=de`
			);

			if (!response.ok) throw new Error('Geocoding fehlgeschlagen');
			const data = await response.json();

			if (data.postcode && /^\d{5}$/.test(data.postcode)) {
				return data.postcode;
			} else {
				alert('Keine PLZ gefunden. Bitte gib deine PLZ manuell ein.');
				return null;
			}
		} catch (error: unknown) {
			const geoError = error as GeolocationPositionError;
			let msg = 'Standort konnte nicht ermittelt werden.';
			if (geoError.code === 1) msg = 'Standort-Zugriff wurde verweigert.';
			else if (geoError.code === 2) msg = 'Standort nicht verfügbar.';
			else if (geoError.code === 3) msg = 'Zeitüberschreitung beim Ermitteln des Standorts.';
			alert(msg + ' Bitte gib deine PLZ manuell ein.');
			return null;
		} finally {
			isGettingLocation = false;
		}
	}

	// Determine chat phases
	const isInResults = $derived(['terminservice', 'searching', 'results'].includes($chatState));

	// Find index where results phase starts (first message with therapists)
	const resultsStartIndex = $derived(
		$messages.findIndex((m) => m.therapists?.length)
	);

	// Split messages into onboarding and results
	// Filter out terminservice and searching messages (rendered separately)
	const onboardingMessages = $derived(
		(resultsStartIndex > 0 ? $messages.slice(0, resultsStartIndex) : (isInResults ? $messages : $messages))
			.filter((msg) => msg.contentKey !== 'terminservice_intro' && msg.contentKey !== 'karl_searching')
	);

	const resultsMessages = $derived(
		resultsStartIndex > 0
			? $messages.slice(resultsStartIndex).filter(
					(msg) => msg.contentKey !== 'terminservice_intro' && msg.contentKey !== 'karl_searching'
				)
			: []
	);

	// searching message shown separately
	const searchingMessage = $derived(
		$messages.find((msg) => msg.contentKey === 'karl_searching')
	);

	// get therapists from the latest results message
	// filtering will happen server-side when real api is implemented
	const allTherapists = $derived(
		$messages.filter((m) => m.therapists?.length).at(-1)?.therapists ?? []
	);

	const lastMessage = $derived($messages[$messages.length - 1]);
	// show bottom input only if there's inputType but NO options (inline input handles the case with options)
	const showTextInput = $derived(
		(lastMessage?.inputType === 'text' || lastMessage?.inputType === 'plz') &&
		!lastMessage?.options?.length
	);

	// Get terminservice message (for showing in collapsed section after completion)
	const terminserviceMessage = $derived(
		$messages.find((msg) => msg.contentKey === 'terminservice_intro')
	);
	const showTerminserviceSection = $derived(
		$chatState === 'terminservice' || (isInResults && terminserviceMessage)
	);
</script>

<div class="flex h-[100dvh] flex-col">
	<!-- header -->
	<header class="border-b-2 border-pencil bg-paper">
		<div class="mx-auto max-w-2xl px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<KarlAvatar size="md" href="/" />
					<div>
						<h1 class="font-heading text-xl font-bold">{m.app_name()}</h1>
						<p class="text-sm text-pencil/60">{m.chat_header()}</p>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<LangToggle />
					<button
						onclick={() => theme.toggle()}
						class="text-pencil/50 hover:text-blue-pen"
						title={m.chat_toggle_theme()}
					>
						{#if $theme === 'dark'}
							<Sun size={18} strokeWidth={2.5} />
						{:else}
							<Moon size={18} strokeWidth={2.5} />
						{/if}
					</button>
					{#if canUndo}
						<button
							onclick={handleUndo}
							class="text-pencil/50 hover:text-blue-pen"
							title={m.chat_undo()}
						>
							<Undo2 size={18} strokeWidth={2.5} />
						</button>
					{/if}
					<button
						onclick={handleReset}
						class="text-pencil/50 hover:text-red-marker"
						title={m.chat_new_start()}
					>
						<RotateCcw size={18} strokeWidth={2.5} />
					</button>
					<a
						href="https://www.patreon.com/karlhelps"
						target="_blank"
						rel="noopener noreferrer"
						class="text-pencil/50 hover:text-red-marker"
						title={m.support_patreon()}
					>
						<PatreonIcon size={16} />
					</a>
					<a href="/contacts" class="flex items-center gap-1 text-sm text-pencil/70 hover:text-blue-pen" title={m.contacts_title()}>
						<ClipboardList size={20} strokeWidth={2.5} />
						<span class="hidden md:inline">{m.contacts_title()}</span>
						{#if $contacts.length > 0}
							<span class="flex h-5 w-5 items-center justify-center rounded-full bg-red-marker text-xs text-white">{$contacts.length}</span>
						{/if}
					</a>
				</div>
			</div>
			<!-- progress bar -->
			<div class="mt-2 flex items-center gap-2">
				<div class="progress-bar">
					<div class="progress-fill" style:width="{progress}%"></div>
				</div>
				<span class="text-xs text-pencil/50 tabular-nums">{progress}%</span>
			</div>
		</div>
	</header>

	<!-- messages area -->
	<div
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto px-4 py-6"
	>
		<div class="mx-auto max-w-2xl">
			<!-- Onboarding section (collapsible when in results) -->
			{#if onboardingMessages.length > 0}
				<ChatSection
					title={m.chat_section_your_info()}
					collapsible={isInResults || $chatState === 'terminservice'}
					defaultOpen={!isInResults && $chatState !== 'terminservice'}
				>
					<div class="space-y-4">
						{#each onboardingMessages as message, i (message.id)}
							{#if message.role === 'user' && message.field === 'forSelf'}
								<div class="flex items-center justify-end gap-1">
									<button
										onclick={() => (showProcessExplanation = !showProcessExplanation)}
										class="info-btn-inline"
										style:border-radius={wobbly.bubbleAlt}
									>
										<HelpCircle size={16} class="shrink-0" />
										<span>{m.karl_how_it_works()}</span>
									</button>
									<MessageBubble
										role={message.role}
										content={message.content}
										contentKey={message.contentKey}
										contentParams={message.contentParams}
										onEdit={() => handleEdit(i)}
									/>
								</div>
								{#if showProcessExplanation}
									<MessageBubble role="karl" content={m.karl_process_explanation()} />
								{/if}
							{:else}
								<MessageBubble
									role={message.role}
									content={message.content}
									contentKey={message.contentKey}
									contentParams={message.contentParams}
									onEdit={message.role === 'user' ? () => handleEdit(i) : undefined}
								/>
							{/if}

							{#if message.options?.length && message === onboardingMessages.at(-1) && !isInResults}
								<div class="mt-4">
									{#if isGettingLocation}
										<div class="flex items-center gap-2 text-sm text-pencil/70">
											<span class="animate-pulse">📍</span>
											{m.chat_detecting_location()}
										</div>
									{:else}
										<OptionButtons
											options={message.options}
											multiSelect={message.multiSelect}
											inputType={message.inputType}
											inputPlaceholder={message.inputType === 'plz' ? m.chat_plz_placeholder() : m.chat_placeholder()}
											onSelect={handleOptionSelect}
											onMultiSubmit={handleMultiSelect}
											onTextSubmit={message.inputType ? handleTextSubmit : undefined}
										/>
										{#if $chatState === 'greeting'}
											<div class="flex justify-center mt-3">
												<button
													onclick={() => (showProcessExplanation = !showProcessExplanation)}
													class="info-btn"
												>
													<HelpCircle size={16} />
													{m.karl_how_it_works()}
												</button>
											</div>
											{#if showProcessExplanation}
												<div class="mt-4">
													<MessageBubble role="karl" content={m.karl_process_explanation()} />
												</div>
											{/if}
										{/if}
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				</ChatSection>
			{/if}

			<!-- Terminservice step -->
			{#if showTerminserviceSection && terminserviceMessage?.options?.length}
				<ChatSection
					title={$campaignDraft.terminserviceStatus
						? `${m.chat_section_terminservice()} · ${$campaignDraft.terminserviceStatus === 'done' ? m.terminservice_status_done() : m.terminservice_status_skipped()}`
						: m.chat_section_terminservice()}
					collapsible={true}
					defaultOpen={$chatState === 'terminservice'}
				>
					<EterminserviceStep
						options={terminserviceMessage.options}
						onSelect={handleOptionSelect}
						lateCompletion={$chatState !== 'terminservice'}
					/>
				</ChatSection>
			{/if}

			<!-- Results section -->
			{#if $chatState === 'searching' || allTherapists.length > 0}
				<div data-section="results">
				<ChatSection
					title={m.chat_section_results()}
					collapsible={false}
				>
					<div class="results-container" class:loading={$chatState === 'searching'}>
						{#if $chatState === 'searching'}
							<div class="loading-overlay">
								<TypingIndicator />
							</div>
						{/if}
						{#if allTherapists.length > 0}
							{#if allTherapists.length > 5}
								<div class="mb-8">
									<MessageBubble
										role="karl"
										contentKey="karl_results_encouragement"
									/>
								</div>
							{/if}
							<TherapistList therapists={allTherapists} />
						{/if}
					</div>
				</ChatSection>
				</div>
			{/if}

			<!-- Current interaction (non-therapist results messages) -->
			{#if resultsMessages.length > 0}
				<div class="space-y-4 mt-4">
					{#each resultsMessages.filter((m) => !m.therapists?.length) as message (message.id)}
						<MessageBubble
							role={message.role}
							content={message.content}
							contentKey={message.contentKey}
							contentParams={message.contentParams}
						/>

						{#if message.options?.length && message === lastMessage}
							<div class="mt-4">
								<OptionButtons
									options={message.options}
									multiSelect={message.multiSelect}
									onSelect={handleOptionSelect}
									onMultiSubmit={handleMultiSelect}
								/>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			{#if $isTyping}
				<TypingIndicator />
			{/if}
		</div>
	</div>

	<!-- input area -->
	{#if showTextInput && !$isTyping}
		<div class="border-t-2 border-pencil bg-paper px-4 py-4">
			<div class="mx-auto max-w-2xl">
				<ChatInput
					placeholder={lastMessage?.inputType === 'plz' ? m.chat_plz_placeholder() : m.chat_placeholder()}
					onSubmit={handleTextSubmit}
				/>
			</div>
		</div>
	{/if}
</div>

{#if editingMessageIndex !== null && editingKarlMessage}
	<EditDialog
		karlMessage={editingKarlMessage}
		currentValue={editingCurrentValue}
		currentContentKey={editingCurrentContentKey}
		onSubmit={handleEditSubmit}
		onMultiSubmit={handleEditMultiSubmit}
		onClose={() => (editingMessageIndex = null)}
	/>
{/if}

{#if showReSearchModal}
	<div class="modal-overlay" onclick={() => (showReSearchModal = false)}>
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			style:border-radius={wobbly.md}
		>
			<p class="modal-text">{m.karl_research_prompt()}</p>
			<div class="modal-buttons">
				<button
					onclick={() => { showReSearchModal = false; chat.triggerReSearch(false); }}
					class="modal-btn primary"
					style:border-radius={wobbly.button}
				>
					{m.option_replace_results()}
				</button>
				<button
					onclick={() => { showReSearchModal = false; chat.triggerReSearch(true); }}
					class="modal-btn"
					style:border-radius={wobbly.button}
				>
					{m.option_merge_results()}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.progress-bar {
		flex: 1;
		height: 4px;
		background-color: var(--color-erased);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: var(--color-blue-pen);
		transition: width 300ms ease-out;
	}

	.info-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 2px dashed var(--color-pencil);
		padding: 0.5rem 1rem;
		font-family: var(--font-body);
		font-size: 0.875rem;
		background-color: var(--color-paper);
		color: var(--color-pencil);
		opacity: 0.6;
		border-radius: 0.5rem;
		transition: all 100ms;
	}

	.info-btn:hover {
		opacity: 1;
		border-style: solid;
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.info-btn-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 2px dashed var(--color-pencil);
		padding: 0.5rem 0.75rem;
		background-color: var(--color-paper);
		color: var(--color-pencil);
		opacity: 0.5;
		font-size: 0.875rem;
		transition: all 100ms;
		max-width: 9.5rem;
	}

	.info-btn-inline:hover {
		opacity: 1;
		border-style: solid;
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--color-paper);
		border: 2px solid var(--color-pencil);
		padding: 1.5rem;
		max-width: 400px;
		width: 100%;
		box-shadow: var(--shadow-hard);
	}

	.modal-text {
		font-family: var(--font-body);
		font-size: 1.125rem;
		color: var(--color-pencil);
		margin-bottom: 1.5rem;
		line-height: 1.4;
	}

	.modal-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.modal-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		font-family: var(--font-body);
		font-size: 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		color: var(--color-pencil);
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.modal-btn:hover {
		background-color: var(--color-erased);
	}

	.modal-btn.primary {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.modal-btn.primary:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.results-container {
		position: relative;
		min-height: 100px;
	}

	.results-container.loading > *:not(.loading-overlay) {
		opacity: 0.3;
		pointer-events: none;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}
</style>
