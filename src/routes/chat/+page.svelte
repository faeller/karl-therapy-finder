<script lang="ts">
	import { onMount } from 'svelte';
	import { chat } from '$lib/stores/chat';
	import { contacts } from '$lib/stores/contacts';
	import MessageBubble from '$lib/components/chat/MessageBubble.svelte';
	import OptionButtons from '$lib/components/chat/OptionButtons.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import TypingIndicator from '$lib/components/chat/TypingIndicator.svelte';
	import TherapistList from '$lib/components/chat/TherapistList.svelte';
	import ChatSection from '$lib/components/chat/ChatSection.svelte';
	import EditDialog from '$lib/components/chat/EditDialog.svelte';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import LangToggle from '$lib/components/ui/LangToggle.svelte';
	import { ClipboardList, RotateCcw, Sun, Moon } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme';
	import { m } from '$lib/paraglide/messages';
	import type { ChatOption, Therapist, ChatMessage } from '$lib/types';

	const { messages, isTyping, state: chatState } = chat;

	let messagesContainer: HTMLDivElement;

	// Edit dialog state
	let editingMessageIndex = $state<number | null>(null);

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

	onMount(() => {
		chat.start();
	});

	// auto-scroll on new messages
	$effect(() => {
		if ($messages.length && messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 100);
		}
	});

	function handleOptionSelect(option: ChatOption) {
		chat.handleOption(option);
	}

	function handleMultiSelect(options: ChatOption[]) {
		chat.handleMultiSelect(options);
	}

	function handleTextSubmit(text: string) {
		chat.handleInput(text);
	}

	function handleEmailClick(therapist: Therapist) {
		contacts.add({
			therapistId: therapist.id,
			therapistName: therapist.name,
			therapistEmail: therapist.email,
			therapistPhone: therapist.phone,
			therapistAddress: therapist.address,
			method: 'email',
			status: 'pending'
		});

		setTimeout(() => {
			chat.promptEmailConfirm(therapist);
		}, 500);
	}

	function handleEdit(messageIndex: number) {
		editingMessageIndex = messageIndex;
	}

	function handleReset() {
		if (confirm(m.chat_reset_confirm())) {
			chat.reset();
		}
	}

	function handleEditSubmit(newValue: string, option?: ChatOption) {
		if (editingMessageIndex === null) return;
		chat.updateMessage(editingMessageIndex, newValue, option);
		editingMessageIndex = null;
	}

	// Determine chat phases
	const isInResults = $derived(['searching', 'results', 'email_sent_confirm'].includes($chatState));

	// Find index where results phase starts (first message with therapists)
	const resultsStartIndex = $derived(
		$messages.findIndex((m) => m.therapists?.length)
	);

	// Split messages into onboarding and results
	const onboardingMessages = $derived(
		resultsStartIndex > 0 ? $messages.slice(0, resultsStartIndex) : (isInResults ? $messages : $messages)
	);

	const resultsMessages = $derived(
		resultsStartIndex > 0 ? $messages.slice(resultsStartIndex) : []
	);

	// Get all therapists from the latest results message
	const allTherapists = $derived(
		$messages.filter((m) => m.therapists?.length).at(-1)?.therapists ?? []
	);

	const lastMessage = $derived($messages[$messages.length - 1]);
	const showTextInput = $derived(lastMessage?.inputType === 'text' || lastMessage?.inputType === 'plz');
</script>

<div class="flex h-[100dvh] flex-col">
	<!-- header -->
	<header class="border-b-2 border-pencil bg-paper px-4 py-3">
		<div class="mx-auto flex max-w-2xl items-center justify-between">
			<div class="flex items-center gap-3">
				<KarlAvatar size="md" href="/" />
				<div>
					<h1 class="font-heading text-xl font-bold">{m.app_name()}</h1>
					<p class="text-sm text-pencil/60">{m.chat_header()}</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
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
				<button
					onclick={handleReset}
					class="text-pencil/50 hover:text-red-marker"
					title={m.chat_new_start()}
				>
					<RotateCcw size={18} strokeWidth={2.5} />
				</button>
				<a href="/contacts" class="flex items-center gap-1 text-sm text-pencil/70 hover:text-blue-pen" title={m.contacts_title()}>
					<ClipboardList size={20} strokeWidth={2.5} />
					<span class="hidden md:inline">{m.contacts_title()}</span>
					{#if $contacts.length > 0}
						<span class="flex h-5 w-5 items-center justify-center rounded-full bg-red-marker text-xs text-white">{$contacts.length}</span>
					{/if}
				</a>
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
					collapsible={isInResults}
					defaultOpen={!isInResults}
				>
					<div class="space-y-4">
						{#each onboardingMessages as message, i (message.id)}
							<MessageBubble
								role={message.role}
								content={message.content}
								contentKey={message.contentKey}
								contentParams={message.contentParams}
								onEdit={message.role === 'user' ? () => handleEdit(i) : undefined}
							/>

							{#if message.options?.length && message === lastMessage && !isInResults}
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
				</ChatSection>
			{/if}

			<!-- Results section -->
			{#if allTherapists.length > 0}
				<ChatSection
					title={m.chat_section_results()}
					collapsible={false}
				>
					<TherapistList
						therapists={allTherapists}
						onEmailClick={handleEmailClick}
					/>
				</ChatSection>
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
		onSubmit={handleEditSubmit}
		onClose={() => (editingMessageIndex = null)}
	/>
{/if}

