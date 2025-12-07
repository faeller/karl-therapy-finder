<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { Send } from 'lucide-svelte';

	interface Props {
		placeholder?: string;
		onSubmit: (value: string) => void;
	}

	let { placeholder = 'Schreib mir...', onSubmit }: Props = $props();
	let value = $state('');

	function handleSubmit() {
		if (value.trim()) {
			onSubmit(value.trim());
			value = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex gap-2">
	<input
		type="text"
		bind:value
		{placeholder}
		onkeydown={handleKeydown}
		class="chat-input"
		style:border-radius={wobbly.sm}
	/>
	<button
		type="submit"
		disabled={!value.trim()}
		class="chat-submit"
		style:border-radius={wobbly.button}
	>
		<Send size={24} strokeWidth={2.5} />
	</button>
</form>

<style>
	.chat-input {
		flex: 1;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		padding: 0.75rem 1rem;
		font-family: var(--font-body);
		font-size: 1.125rem;
		color: var(--color-pencil);
	}
	.chat-input::placeholder {
		color: var(--color-pencil);
		opacity: 0.4;
	}
	.chat-input:focus {
		border-color: var(--color-blue-pen);
		box-shadow: 0 0 0 2px rgba(45, 93, 161, 0.2);
	}

	.chat-submit {
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		padding: 0.75rem;
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
		color: var(--color-pencil);
	}
	.chat-submit:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}
	.chat-submit:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
