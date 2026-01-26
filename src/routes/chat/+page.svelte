<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { chat } from '$lib/stores/chat';
	import { campaignDraft } from '$lib/stores/campaign';
	import { contacts } from '$lib/stores/contacts';
	import { OptionId } from '$lib/data/optionIds';
	import { resultsActionOptions, kostenerstattungGrantedOptions, themeNextOption } from '$lib/data/chatOptions';
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
	import UserMenu from '$lib/components/ui/UserMenu.svelte';
	import PatreonIcon from '$lib/components/ui/PatreonIcon.svelte';
	import GithubIcon from '$lib/components/ui/GithubIcon.svelte';
	import { ClipboardList, RotateCcw, Sun, Moon, Undo2, HelpCircle, Menu, X, FileCheck, ExternalLink, PartyPopper, Pencil, Palette, Leaf } from 'lucide-svelte';
	import FoundTherapistButton from '$lib/components/ui/FoundTherapistButton.svelte';
	import { wobbly } from '$lib/utils/wobbly';
	import { track } from '$lib/utils/analytics';
	import { theme, style } from '$lib/stores/theme';
	import { m } from '$lib/paraglide/messages';
	import type { ChatOption, Therapist, ChatMessage, ChatState } from '$lib/types';
	import { SEPARATELY_RENDERED_KEYS } from '$lib/constants';

	const { messages, isTyping, state: chatState } = chat;

	// progress calculation
	// finding therapists is ~40%, contacting them and getting responses is the rest
	const progress = $derived.by(() => {
		// success = 100%
		if ($chatState === 'success') return 100;

		// onboarding: 5-25%
		const onboardingStates = ['greeting', 'theme_choice', 'for_whom', 'for_other_name', 'location', 'insurance_type', 'insurance_details', 'therapy_type', 'preferences'];
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
		if (!confirm('Wirklich einen Schritt zurück gehen? Daten können verloren gehen und das Feature ist noch experimentell und buggy.')) {
			return;
		}
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
	const RESEARCH_PROMPT_KEY = 'karl_research_pending';
	let showReSearchModal = $state(false);
	let showMobileMenu = $state(false);

	function setReSearchModal(show: boolean) {
		showReSearchModal = show;
		if (show) {
			localStorage.setItem(RESEARCH_PROMPT_KEY, '1');
		} else {
			localStorage.removeItem(RESEARCH_PROMPT_KEY);
		}
	}

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

	// track if initial load is done (to skip auto-scroll on page open)
	let initialLoadDone = false;

	// account deleted toast
	let showDeletedToast = $state(false);

	// theme change toast
	let themeToastMessage = $state('');
	let themeToastTimeout: ReturnType<typeof setTimeout> | null = null;

	const styleNames: Record<string, string> = {
		modern: 'Modern',
		apfel: 'Apfel',
		handdrawn: 'Handdrawn'
	};

	function handleToggleStyle() {
		theme.toggleStyle();
		// $style is already updated after toggleStyle()
		themeToastMessage = `Theme: ${styleNames[$style]}`;
		if (themeToastTimeout) clearTimeout(themeToastTimeout);
		themeToastTimeout = setTimeout(() => themeToastMessage = '', 3000);
	}

	onMount(() => {
		chat.start();
		// check for account deleted param
		if ($page.url.searchParams.get('deleted') === '1') {
			showDeletedToast = true;
			// clear the param from URL
			goto('/chat', { replaceState: true });
			// auto-hide after 4s
			setTimeout(() => showDeletedToast = false, 4000);
		}
		// restore pending re-search modal
		if (localStorage.getItem(RESEARCH_PROMPT_KEY)) {
			showReSearchModal = true;
		}
		// mark initial load complete after messages are restored
		setTimeout(() => {
			initialLoadDone = true;
		}, 150);
	});

	// auto-scroll on new messages (skip on initial page load)
	let prevMessageCount = 0;
	$effect(() => {
		const count = $messages.length;
		if (count && messagesContainer && count !== prevMessageCount) {
			prevMessageCount = count;
			if (!initialLoadDone) return;
			setTimeout(() => {
				if (isInSuccess) {
					// scroll to success section
					const successSection = messagesContainer.querySelector('[data-section="success"]');
					if (successSection) {
						successSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
					} else {
						messagesContainer.scrollTop = messagesContainer.scrollHeight;
					}
				} else if (isInKostenerstattung) {
					// scroll to bottom to show latest message
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				} else if (isInResults) {
					// in results, scroll to show the results section
					const resultsSection = messagesContainer.querySelector('[data-section="results"]');
					if (resultsSection) {
						resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
					} else {
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
		if (option.id === OptionId.findPrivateTherapist) {
			const plz = $campaignDraft.plz || '';
			const url = `https://www.therapie.de/therapeutensuche/ergebnisse/?abrechnungsverfahren=6&ort=${plz}`;
			window.open(url, '_blank');
			return;
		}
		// handle theme selection
		if (option.id === OptionId.themeCool) {
			theme.setStyle('handdrawn');
			return;
		}
		if (option.id === OptionId.themeModern) {
			theme.setStyle('modern');
			return;
		}
		if (option.id === OptionId.themeApfel) {
			theme.setStyle('apfel');
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

	function triggerConfetti() {
		const container = document.createElement('div');
		container.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999;';
		document.body.appendChild(container);

		const colors = ['#2d5da1', '#d14b4b', '#d99e3d', '#4a9d4a', '#9b59b6', '#e91e63', '#00bcd4', '#ff9800'];
		const fragment = document.createDocumentFragment();

		for (let i = 0; i < 150; i++) {
			const p = document.createElement('div');
			const duration = 4 + Math.random() * 4;
			p.style.cssText = `
				position:absolute;top:-20px;
				left:${Math.random() * 100}%;
				width:${6 + Math.random() * 8}px;
				height:${6 + Math.random() * 12}px;
				border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
				background:${colors[Math.floor(Math.random() * colors.length)]};
				animation:konfetti-fall ${duration}s ease-out forwards;
				animation-delay:${Math.random() * 1}s;
				--drift:${(Math.random() - 0.5) * 300}px;
				--spin:${Math.random() * 1080 - 540}deg;
			`;
			fragment.appendChild(p);
		}
		container.appendChild(fragment);
		setTimeout(() => container.remove(), 9000);
	}

	async function handleEditSubmit(newValue: string, option?: ChatOption, contentKey?: string) {
		if (editingMessageIndex === null) return;

		// handle geolocation option in edit mode
		if (option?.id === OptionId.useLocation) {
			const plz = await handleGetLocation();
			if (plz) {
				const needsReSearch = await chat.updateMessage(editingMessageIndex, plz, undefined, undefined);
				campaignDraft.update((d) => ({ ...d, plz }));
				if (needsReSearch) setReSearchModal(true);
			}
			editingMessageIndex = null;
			return;
		}

		// check if editing location field - update campaignDraft.plz
		const editedMessage = $messages[editingMessageIndex];
		if (editedMessage?.field === 'location' && !option) {
			const plz = newValue.match(/\d{5}/)?.[0];
			if (plz) {
				campaignDraft.update((d) => ({ ...d, plz }));
			}
		}

		const needsReSearch = await chat.updateMessage(editingMessageIndex, newValue, option, contentKey);
		editingMessageIndex = null;
		if (needsReSearch) setReSearchModal(true);
	}

	function handleEditMultiSubmit(options: ChatOption[]) {
		// use centralized mapping from optionMapping.ts - handled by chat.updateMessage already
	}

	// Geolocation
	let isGettingLocation = $state(false);

	async function handleGetLocation(): Promise<string | null> {
		if (isGettingLocation) return null;

		if (!navigator.geolocation) {
			alert(m.geo_not_supported());
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
				`/api/geo/reverse?lat=${latitude}&lon=${longitude}`
			);

			if (!response.ok) throw new Error(m.geo_failed());
			const data: { plz?: string } = await response.json();

			if (data.plz && /^\d{5}$/.test(data.plz)) {
				return data.plz;
			} else {
				alert(m.geo_no_plz());
				return null;
			}
		} catch (error: unknown) {
			const geoError = error as GeolocationPositionError;
			let msg = m.geo_error_default();
			if (geoError.code === 1) msg = m.geo_error_denied();
			else if (geoError.code === 2) msg = m.geo_error_unavailable();
			else if (geoError.code === 3) msg = m.geo_error_timeout();
			alert(msg + ' ' + m.geo_error_suffix());
			return null;
		} finally {
			isGettingLocation = false;
		}
	}

	// Determine chat phases
	const kostenerstattungStates = ['erstgespraech_done', 'ptv11_dringend', 'probatorik', 'hausarzt', 'antrag_einreichen', 'antrag_sent', 'widerspruch', 'kostenerstattung_granted'] as const;
	const kostenerstattungMessageKeys = ['karl_erstgespraech_done', 'karl_ptv11_dringend', 'karl_probatorik', 'karl_hausarzt', 'karl_antrag_einreichen', 'karl_antrag_sent', 'karl_widerspruch', 'karl_kostenerstattung_granted'] as const;
	const isInSuccess = $derived($chatState === 'success');
	const isInKostenerstattung = $derived(kostenerstattungStates.includes($chatState as typeof kostenerstattungStates[number]));
	const isInResults = $derived(['terminservice', 'searching', 'results'].includes($chatState) || isInKostenerstattung || isInSuccess);

	// find where kostenerstattung flow starts
	const kostenerstattungStartIndex = $derived(
		$messages.findIndex((msg) => kostenerstattungMessageKeys.includes(msg.contentKey as typeof kostenerstattungMessageKeys[number]))
	);
	// all messages from that point belong to kostenerstattung section
	const kostenerstattungMessages = $derived(
		kostenerstattungStartIndex >= 0 ? $messages.slice(kostenerstattungStartIndex) : []
	);

	// Find index where results phase starts (first message with therapists)
	const resultsStartIndex = $derived(
		$messages.findIndex((m) => m.therapists?.length)
	);

	// Split messages into onboarding and results
	// These karl messages are rendered in dedicated sections, not in the main flow
	const onboardingMessages = $derived(
		(resultsStartIndex > 0 ? $messages.slice(0, resultsStartIndex) : (isInResults ? $messages : $messages))
			.filter((msg) => !(SEPARATELY_RENDERED_KEYS as readonly string[]).includes(msg.contentKey ?? ''))
	);

	const resultsMessages = $derived(
		resultsStartIndex > 0
			? $messages.slice(resultsStartIndex, kostenerstattungStartIndex > 0 ? kostenerstattungStartIndex : undefined).filter(
					(msg) => !(SEPARATELY_RENDERED_KEYS as readonly string[]).includes(msg.contentKey ?? '')
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
	<header class="navbar-glass">
		<div class="mx-auto max-w-2xl px-3 py-2">
			<div class="flex items-center justify-between gap-2">
				<a href="/" class="flex items-center gap-2 min-w-0">
					<KarlAvatar size="sm" />
					<h1 class="brand-title">{m.app_name()}</h1>
					<span class="beta-badge">beta</span>
				</a>
				<div class="flex items-center gap-3 sm:gap-4 shrink-0">
					<!-- desktop icons -->
					<div class="hidden min-[610px]:flex items-center gap-3">
						<LangToggle />
						<span class="nav-separator"></span>
						<button
							onclick={handleToggleStyle}
							class="text-pencil/50 hover:text-blue-pen"
							title="Toggle theme style"
						>
							{#if $style === 'modern'}
								<Leaf size={18} strokeWidth={2.5} />
							{:else if $style === 'apfel'}
								<Pencil size={18} strokeWidth={2.5} />
							{:else}
								<Palette size={18} strokeWidth={2.5} />
							{/if}
						</button>
						<button
							onclick={() => theme.toggle()}
							class="text-pencil/50 hover:text-blue-pen"
							title={m.chat_toggle_theme()}
						>
							{#if $theme.colorMode === 'dark'}
								<Sun size={18} strokeWidth={2.5} />
							{:else}
								<Moon size={18} strokeWidth={2.5} />
							{/if}
						</button>
						<span class="nav-separator"></span>
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
						<span class="nav-separator"></span>
						<a
							href="https://www.patreon.com/karlhelps"
							target="_blank"
							rel="noopener noreferrer"
							class="text-pencil/50 hover:text-red-marker"
							title={m.support_patreon()}
						>
							<PatreonIcon size={16} />
						</a>
						<a
							href="https://github.com/faeller/karl-therapy-finder"
							target="_blank"
							rel="noopener noreferrer"
							class="text-pencil/50 hover:text-pencil"
							title="GitHub"
						>
							<GithubIcon size={16} />
						</a>
						<span class="nav-separator"></span>
					</div>
					<a href="/contacts" class="flex items-center gap-1 text-pencil/50 hover:text-blue-pen" title={m.contacts_title()}>
						<ClipboardList size={18} strokeWidth={2.5} />
						<span class="hidden min-[195px]:inline text-xs">{m.contacts_title()}</span>
						{#if $contacts.length > 0}
							<span class="flex h-4 w-4 items-center justify-center rounded-full bg-red-marker text-[10px] text-white">{$contacts.length}</span>
						{/if}
					</a>
					<div class="hidden min-[195px]:block">
						<UserMenu />
					</div>
					<!-- mobile hamburger -->
					<button
						onclick={() => showMobileMenu = !showMobileMenu}
						class="min-[610px]:hidden text-pencil/50 hover:text-blue-pen"
					>
						{#if showMobileMenu}
							<X size={20} strokeWidth={2.5} />
						{:else}
							<Menu size={20} strokeWidth={2.5} />
						{/if}
					</button>
				</div>
			</div>
			<!-- mobile menu dropdown -->
			{#if showMobileMenu}
				<div class="min-[610px]:hidden flex items-center justify-end gap-4 mt-2 pt-2 border-t border-pencil/20">
					<LangToggle />
					<button
						onclick={handleToggleStyle}
						class="text-pencil/50 hover:text-blue-pen"
						title="Toggle theme style"
					>
						{#if $style === 'modern'}
							<Leaf size={18} strokeWidth={2.5} />
						{:else if $style === 'apfel'}
							<Pencil size={18} strokeWidth={2.5} />
						{:else}
							<Palette size={18} strokeWidth={2.5} />
						{/if}
					</button>
					<button
						onclick={() => theme.toggle()}
						class="text-pencil/50 hover:text-blue-pen"
						title={m.chat_toggle_theme()}
					>
						{#if $theme.colorMode === 'dark'}
							<Sun size={18} strokeWidth={2.5} />
						{:else}
							<Moon size={18} strokeWidth={2.5} />
						{/if}
					</button>
					{#if canUndo}
						<button
							onclick={() => { handleUndo(); showMobileMenu = false; }}
							class="min-[195px]:hidden text-pencil/50 hover:text-blue-pen"
							title={m.chat_undo()}
						>
							<Undo2 size={18} strokeWidth={2.5} />
						</button>
					{/if}
					<button
						onclick={() => { handleReset(); showMobileMenu = false; }}
						class="text-pencil/50 hover:text-red-marker"
						title={m.chat_new_start()}
					>
						<RotateCcw size={18} strokeWidth={2.5} />
					</button>
					<div class="min-[195px]:hidden">
						<UserMenu />
					</div>
					<a
						href="https://www.patreon.com/karlhelps"
						target="_blank"
						rel="noopener noreferrer"
						class="min-[195px]:hidden text-pencil/50 hover:text-red-marker"
						title={m.support_patreon()}
					>
						<PatreonIcon size={16} />
					</a>
					<a
						href="https://github.com/faeller/karl-therapy-finder"
						target="_blank"
						rel="noopener noreferrer"
						class="min-[195px]:hidden text-pencil/50 hover:text-pencil"
						title="GitHub"
					>
						<GithubIcon size={16} />
					</a>
				</div>
			{/if}
			<!-- progress bar -->
			<div class="mt-1.5 flex items-center gap-2">
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
								<div class="flex items-stretch justify-end gap-0">
									<button
										onclick={() => (showProcessExplanation = !showProcessExplanation)}
										class="info-btn-inline"
										style:border-radius={wobbly.bubbleAlt}
									>
										<HelpCircle size={20} class="shrink-0" />
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
							{:else if message.contentKey === 'karl_theme_choice'}
								<!-- theme choice with persistent buttons -->
								<MessageBubble
									role={message.role}
									content={message.content}
									contentKey={message.contentKey}
									contentParams={message.contentParams}
								/>
								<!-- theme style buttons -->
								<div class="theme-choice-buttons mt-3">
									<button
										onclick={() => theme.setStyle('handdrawn')}
										class="theme-btn"
										class:selected={$style === 'handdrawn'}
										style:border-radius={wobbly.button}
									>
										{m.option_theme_cool()}
									</button>
									<button
										onclick={() => theme.setStyle('modern')}
										class="theme-btn"
										class:selected={$style === 'modern'}
										style:border-radius={wobbly.button}
									>
										{m.option_theme_modern()}
									</button>
									<button
										onclick={() => theme.setStyle('apfel')}
										class="theme-btn"
										class:selected={$style === 'apfel'}
										style:border-radius={wobbly.button}
									>
										{m.option_theme_apfel()}
									</button>
								</div>
								<!-- dark/light mode buttons -->
								<div class="theme-choice-buttons mt-3">
									<button
										onclick={() => theme.set({ ...$theme, colorMode: 'light' })}
										class="theme-btn color-mode-btn"
										class:selected={$theme.colorMode === 'light'}
										style:border-radius={wobbly.button}
									>
										<Sun size={16} class="mr-1" />
										Hell
									</button>
									<button
										onclick={() => theme.set({ ...$theme, colorMode: 'dark' })}
										class="theme-btn color-mode-btn"
										class:selected={$theme.colorMode === 'dark'}
										style:border-radius={wobbly.button}
									>
										<Moon size={16} class="mr-1" />
										Dunkel
									</button>
								</div>
								{#if $chatState === 'theme_choice'}
									<div class="flex justify-end mt-4">
										<button
											onclick={() => { track('theme_selected', { theme: $style }); chat.handleOption(themeNextOption); }}
											class="option-btn primary"
											style:border-radius={wobbly.button}
										>
											{m.chat_continue()}
										</button>
									</div>
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

							{#if message.options?.length && message === onboardingMessages.at(-1) && !isInResults && message.contentKey !== 'karl_theme_choice'}
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
												{m.karl_how_it_works_long()}
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
					collapsible={true}
				>
					<div class="results-container" class:loading={$chatState === 'searching'}>
						{#if $chatState === 'searching'}
							<div class="loading-overlay">
								<MessageBubble role="karl" contentKey="karl_searching" />
								<TypingIndicator />
							</div>
						{/if}
						{#if allTherapists.length > 0}
							{#if allTherapists.length > 5}
								<div class="mb-14">
									<MessageBubble
										role="karl"
										contentKey="karl_results_encouragement"
									/>
									<!-- action buttons right after encouragement -->
									{#if $chatState === 'results'}
										<div class="results-actions mt-3">
											<button
												onclick={() => handleOptionSelect(resultsActionOptions[0])}
												class="action-chip"
												style:border-radius={wobbly.button}
											>
												<FileCheck size={16} />
												{m.option_had_erstgespraech()}
											</button>
											<FoundTherapistButton onclick={() => handleOptionSelect(resultsActionOptions[1])} />
										</div>
									{/if}
								</div>
							{/if}

							<!-- contact progress for kostenerstattung -->
							{#if $contacts.length > 0}
								<div class="contact-progress mb-4">
									<span class="progress-text">{m.karl_results_progress({ count: $contacts.length })}</span>
									<div class="progress-dots">
										{#each Array(10) as _, i}
											<span class="dot" class:filled={i < $contacts.length} class:target={i >= 5 && i < 10}></span>
										{/each}
									</div>
								</div>
							{/if}

							<TherapistList therapists={allTherapists} />
						{/if}
					</div>
				</ChatSection>
				</div>
			{/if}

			<!-- Kostenerstattung section -->
			{#if (isInKostenerstattung || isInSuccess) && kostenerstattungMessages.length > 0}
				<div data-section="kostenerstattung">
				<ChatSection
					title={m.chat_section_kostenerstattung()}
					collapsible={true}
					defaultOpen={!isInSuccess}
				>
					<div class="space-y-4">
						{#each kostenerstattungMessages as message (message.id)}
							<MessageBubble
								role={message.role}
								content={message.content}
								contentKey={message.contentKey}
								contentParams={message.contentParams}
							/>
							{#if $chatState === 'kostenerstattung_granted' && message.contentKey === 'karl_kostenerstattung_granted'}
								<div class="flex flex-wrap justify-center gap-3">
									<button
										onclick={() => handleOptionSelect(kostenerstattungGrantedOptions[0])}
										class="action-chip"
										style:border-radius={wobbly.button}
									>
										<ExternalLink size={16} />
										{m.chat_private_therapists({ plz: $campaignDraft.plz || 'PLZ' })}
									</button>
									<FoundTherapistButton onclick={() => handleOptionSelect(resultsActionOptions[1])} />
								</div>
							{:else if message.options?.length && message === lastMessage}
								<OptionButtons
									options={message.options}
									multiSelect={message.multiSelect}
									onSelect={handleOptionSelect}
									onMultiSubmit={handleMultiSelect}
								/>
							{/if}
						{/each}
					</div>
				</ChatSection>
				</div>
			{/if}

			<!-- Success section -->
			{#if isInSuccess}
				<div data-section="success">
				<ChatSection
					title={m.chat_section_success()}
					collapsible={false}
				>
					{#if $isTyping}
						<TypingIndicator />
					{:else}
						<MessageBubble role="karl" contentKey="karl_success" />
						<div class="flex justify-center mt-4">
							<button
								onclick={triggerConfetti}
								class="option-btn mehr-konfetti"
								style:border-radius={wobbly.button}
							>
								<PartyPopper size={16} class="mr-1" />
								{m.chat_more_confetti()}
							</button>
						</div>
					{/if}
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
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-overlay" role="button" tabindex="-1" onclick={() => setReSearchModal(false)}>
		<div
			class="modal-content small"
			role="button"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<p class="modal-text">{m.karl_research_prompt()}</p>
			<div class="modal-buttons">
				<button
					onclick={() => { setReSearchModal(false); chat.triggerReSearch(false); }}
					class="modal-btn primary"
					style:border-radius={wobbly.button}
				>
					{m.option_replace_results()}
				</button>
				<button
					onclick={() => { setReSearchModal(false); chat.triggerReSearch(true); }}
					class="modal-btn"
					style:border-radius={wobbly.button}
				>
					{m.option_merge_results()}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- account deleted toast -->
{#if showDeletedToast}
	<div class="toast">
		Dein Account wurde unwiderruflich gelöscht.
	</div>
{/if}

{#if themeToastMessage}
	<div class="toast">
		{themeToastMessage}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-pencil);
		color: var(--color-paper);
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		z-index: 9999;
		animation: toast-in 300ms ease-out;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(1rem);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	.navbar-glass {
		background: rgba(242, 242, 247, 0.8);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--color-card-border);
	}

	:global(:root.dark) .navbar-glass {
		background: rgba(20, 20, 22, 0.6);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(:root.theme-handdrawn) .navbar-glass {
		background: var(--color-paper);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border-bottom: 2px solid var(--color-pencil);
	}

	.brand-title {
		font-family: var(--font-brand);
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1;
		display: none;
	}

	@media (min-width: 360px) {
		.brand-title {
			display: block;
		}
	}

	.beta-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--color-blue-pen);
		color: white;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		line-height: 1;
		display: none;
	}

	@media (min-width: 280px) {
		.beta-badge {
			display: block;
		}
	}

	.nav-separator {
		width: 1px;
		height: 16px;
		background: var(--color-pencil);
		opacity: 0.2;
	}

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
		display: flex;
		align-items: center;
		gap: 0.35rem;
		border: 2px dashed var(--color-pencil);
		padding: 0.4rem 0.75rem 0.4rem 0.5rem;
		background-color: var(--color-paper);
		color: var(--color-pencil);
		opacity: 0.5;
		font-size: 0.8rem;
		transition: all 100ms;
		max-width: 6.5rem;
		text-align: left;
		line-height: 1.15;
	}

	.info-btn-inline:hover {
		opacity: 1;
		border-style: solid;
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	/* modal styles in app.css */

	.results-container {
		position: relative;
		min-height: 100px;
	}

	.results-container.loading > *:not(.loading-overlay) {
		opacity: 0.3;
		pointer-events: none;
	}

	.loading-overlay {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.contact-progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--color-postit);
		border: 1px solid var(--color-pencil);
		border-radius: 0.5rem;
	}

	.progress-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-pencil);
	}

	.progress-dots {
		display: flex;
		gap: 0.375rem;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--color-erased);
		border: 1px solid var(--color-pencil);
		opacity: 0.4;
	}

	.dot.filled {
		background-color: var(--color-blue-pen);
		opacity: 1;
	}

	.dot.target:not(.filled) {
		border-style: dashed;
		opacity: 0.6;
	}

	.results-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}

	.action-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		color: var(--color-pencil);
		font-family: var(--font-body);
		font-size: 0.875rem;
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.action-chip:hover {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.theme-choice-buttons {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.theme-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		color: var(--color-pencil);
		font-family: var(--font-body);
		font-size: 0.875rem;
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.theme-btn:hover {
		background-color: var(--color-pencil);
		color: var(--color-paper);
		transform: translateY(-1px);
	}

	.theme-btn.selected {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.theme-btn.selected:hover {
		background-color: var(--color-blue-pen);
		filter: brightness(1.1);
	}

	.mehr-konfetti {
		opacity: 0.6;
	}

	.mehr-konfetti:hover {
		opacity: 1;
	}
</style>
