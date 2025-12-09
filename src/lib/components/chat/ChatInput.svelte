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
		border: 3px solid var(--color-blue-pen);
		background-color: var(--color-paper);
		padding: 0.875rem 1rem;
		font-family: var(--font-body);
		font-size: 1.125rem;
		color: var(--color-pencil);
		box-shadow: var(--shadow-hard-sm);
	}
	.chat-input::placeholder {
		color: var(--color-pencil);
		opacity: 0.5;
	}
	.chat-input:focus {
		border-color: var(--color-red-marker);
		outline: none;
		box-shadow: var(--shadow-hard);
	}

	.chat-submit {
		border: 3px solid var(--color-blue-pen);
		background-color: var(--color-blue-pen);
		padding: 0.875rem;
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
		color: white;
	}
	.chat-submit:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}
	.chat-submit:disabled {
		cursor: not-allowed;
		opacity: 0.4;
		background-color: var(--color-paper);
		color: var(--color-pencil);
	}
</style>
