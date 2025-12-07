<script lang="ts">
	import { onMount } from 'svelte';
	import { chat } from '$lib/stores/chat';
	import { contacts } from '$lib/stores/contacts';
	import MessageBubble from '$lib/components/chat/MessageBubble.svelte';
	import OptionButtons from '$lib/components/chat/OptionButtons.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import TypingIndicator from '$lib/components/chat/TypingIndicator.svelte';
	import TherapistCard from '$lib/components/chat/TherapistCard.svelte';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import { ClipboardList, RotateCcw, Sun, Moon } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme';
	import type { ChatOption, Therapist } from '$lib/types';

	const { messages, isTyping, state } = chat;

	let messagesContainer: HTMLDivElement;

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
		// log contact attempt
		contacts.add({
			therapistId: therapist.id,
			therapistName: therapist.name,
			therapistEmail: therapist.email,
			therapistPhone: therapist.phone,
			therapistAddress: therapist.address,
			method: 'email',
			status: 'pending'
		});

		// prompt confirmation after a delay
		setTimeout(() => {
			chat.promptEmailConfirm(therapist);
		}, 500);
	}

	// get last message for input type
	const lastMessage = $derived($messages[$messages.length - 1]);
	const showTextInput = $derived(lastMessage?.inputType === 'text' || lastMessage?.inputType === 'plz');
	const showOptions = $derived(lastMessage?.options && lastMessage.options.length > 0);
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
		<div class="mx-auto max-w-2xl space-y-4">
			{#each $messages as message (message.id)}
				<MessageBubble role={message.role} content={message.content} />

				{#if message.therapists?.length}
					<div class="ml-12 space-y-3">
						{#each message.therapists as therapist (therapist.id)}
							<TherapistCard
								{therapist}
								onEmailClick={() => handleEmailClick(therapist)}
							/>
						{/each}
					</div>
				{/if}

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

