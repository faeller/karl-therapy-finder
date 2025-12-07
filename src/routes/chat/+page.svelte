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
	import { ClipboardList, RotateCcw, Sun, Moon } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme';
	import type { ChatOption, Therapist, ChatMessage, EditableField } from '$lib/types';

	const { messages, isTyping, state: chatState } = chat;

	let messagesContainer: HTMLDivElement;

	// Edit dialog state
	let editingMessage = $state<{ index: number; field: EditableField; content: string } | null>(null);

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

	function handleEdit(messageIndex: number, message: ChatMessage) {
		if (!message.field) return;
		editingMessage = {
			index: messageIndex,
			field: message.field,
			content: message.content
		};
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
					<h1 class="font-heading text-xl font-bold">KARL</h1>
					<p class="text-sm text-pencil/60">Therapieplatz-Finder</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={() => theme.toggle()}
					class="text-pencil/50 hover:text-blue-pen"
					title="Design wechseln"
				>
					{#if $theme === 'dark'}
						<Sun size={18} strokeWidth={2.5} />
					{:else}
						<Moon size={18} strokeWidth={2.5} />
					{/if}
				</button>
				<button
					onclick={() => chat.reset()}
					class="text-pencil/50 hover:text-red-marker"
					title="Neu starten"
				>
					<RotateCcw size={18} strokeWidth={2.5} />
				</button>
				<a href="/contacts" class="flex items-center gap-1 text-sm text-pencil/70 hover:text-blue-pen" title="Kontakte">
					<ClipboardList size={20} strokeWidth={2.5} />
					<span class="hidden md:inline">Kontakte</span>
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
					title="Deine Angaben"
					collapsible={isInResults}
					defaultOpen={!isInResults}
				>
					<div class="space-y-4">
						{#each onboardingMessages as message, i (message.id)}
							<MessageBubble
								role={message.role}
								content={message.content}
								onEdit={message.role === 'user' && message.field && isInResults ? () => handleEdit(i, message) : undefined}
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
					title="Gefundene Therapeut:innen"
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
						<MessageBubble role={message.role} content={message.content} />

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
					placeholder={lastMessage?.inputType === 'plz' ? 'PLZ oder Ort eingeben...' : 'Schreib mir...'}
					onSubmit={handleTextSubmit}
				/>
			</div>
		</div>
	{/if}
</div>

{#if editingMessage}
	<EditDialog
		field={editingMessage.field}
		currentValue={editingMessage.content}
		messageIndex={editingMessage.index}
		onClose={() => (editingMessage = null)}
	/>
{/if}

