<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { X, AlertTriangle } from 'lucide-svelte';
	import { chat, fieldLabels } from '$lib/stores/chat';
	import type { EditableField } from '$lib/types';

	interface Props {
		field: EditableField;
		currentValue: string;
		messageIndex: number;
		onClose: () => void;
	}

	let { field, currentValue, messageIndex, onClose }: Props = $props();

	let newValue = $state(currentValue);
	const needsReset = chat.needsFullReset(field);
	const label = fieldLabels[field];

	async function handleSubmit() {
		if (newValue.trim()) {
			await chat.editField(field, newValue.trim(), messageIndex);
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose}>
	<div
		class="dialog"
		onclick={(e) => e.stopPropagation()}
		style:border-radius={wobbly.md}
	>
		<div class="header">
			<h3 class="font-heading font-bold">{label} ändern</h3>
			<button onclick={onClose} class="close-btn">
				<X size={20} />
			</button>
		</div>

		{#if needsReset}
			<div class="warning">
				<AlertTriangle size={18} />
				<span>Diese Änderung setzt alle folgenden Angaben zurück.</span>
			</div>
		{:else}
			<p class="hint">Die Therapeut:innen-Suche wird mit dem neuen Wert wiederholt.</p>
		{/if}

		<div class="input-group">
			<label for="edit-input">Neuer Wert:</label>
			<input
				id="edit-input"
				type="text"
				bind:value={newValue}
				onkeydown={handleKeydown}
				class="input"
				style:border-radius={wobbly.sm}
				autofocus
			/>
		</div>

		<div class="actions">
			<button onclick={onClose} class="btn secondary" style:border-radius={wobbly.button}>
				Abbrechen
			</button>
			<button
				onclick={handleSubmit}
				class="btn primary"
				class:warning={needsReset}
				style:border-radius={wobbly.button}
				disabled={!newValue.trim() || newValue === currentValue}
			>
				{needsReset ? 'Zurücksetzen' : 'Ändern & neu suchen'}
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.dialog {
		background-color: var(--color-paper);
		border: 2px solid var(--color-pencil);
		padding: 1.5rem;
		max-width: 400px;
		width: 100%;
		box-shadow: var(--shadow-hard);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.close-btn {
		padding: 0.25rem;
		color: var(--color-pencil);
		opacity: 0.5;
		transition: opacity 150ms;
	}

	.close-btn:hover {
		opacity: 1;
	}

	.warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--color-red-marker);
		color: white;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.hint {
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.7;
		margin-bottom: 1rem;
	}

	.input-group {
		margin-bottom: 1.5rem;
	}

	.input-group label {
		display: block;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		color: var(--color-pencil);
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 1rem;
		color: var(--color-pencil);
	}

	.input:focus {
		border-color: var(--color-blue-pen);
		outline: none;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.5rem 1rem;
		font-family: var(--font-body);
		font-size: 1rem;
		border: 2px solid var(--color-pencil);
		transition: all 150ms;
	}

	.btn.secondary {
		background-color: transparent;
		color: var(--color-pencil);
	}

	.btn.secondary:hover {
		background-color: var(--color-erased);
	}

	.btn.primary {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.btn.primary:hover:not(:disabled) {
		background-color: var(--color-pencil);
		border-color: var(--color-pencil);
	}

	.btn.primary.warning {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
