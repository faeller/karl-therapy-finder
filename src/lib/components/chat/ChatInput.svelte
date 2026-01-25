<script lang="ts">
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
	/>
	<button
		type="submit"
		disabled={!value.trim()}
		class="chat-submit"
	>
		<Send size={20} strokeWidth={2} />
	</button>
</form>

<style>
	.chat-input {
		flex: 1;
		border: none;
		background-color: var(--color-erased);
		padding: 0.75rem 1rem;
		font-family: var(--font-body);
		font-size: 1rem;
		color: var(--color-pencil);
		border-radius: 20px;
	}
	.chat-input::placeholder {
		color: var(--color-pencil);
		opacity: 0.5;
	}
	.chat-input:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-blue-pen);
	}

	.chat-submit {
		border: none;
		background-color: var(--color-blue-pen);
		padding: 0.75rem;
		transition: all 150ms;
		color: white;
		border-radius: 50%;
	}
	.chat-submit:hover:not(:disabled) {
		background-color: #0066d6;
	}
	.chat-submit:disabled {
		cursor: not-allowed;
		opacity: 0.4;
		background-color: var(--color-erased);
		color: var(--color-pencil);
	}
</style>
