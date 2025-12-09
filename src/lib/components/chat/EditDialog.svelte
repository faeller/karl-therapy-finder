<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { X } from 'lucide-svelte';
	import type { ChatMessage, ChatOption } from '$lib/types';
	import { m } from '$lib/paraglide/messages';
	import { t } from '$lib/i18n';

	interface Props {
		/** The Karl message that prompted this answer (has options or inputType) */
		karlMessage: ChatMessage;
		/** Current value of the user's answer */
		currentValue: string;
		/** Current contentKey (for multi-select) */
		currentContentKey?: string;
		/** Called when user selects a new value */
		onSubmit: (newValue: string, option?: ChatOption, contentKey?: string) => void;
		/** Called for multi-select submit */
		onMultiSubmit?: (options: ChatOption[]) => void;
		onClose: () => void;
	}

	let { karlMessage, currentValue, currentContentKey, onSubmit, onMultiSubmit, onClose }: Props = $props();

	let textValue = $state(currentValue);

	// for multi-select, parse current selections from contentKey
	const initialSelected = $derived.by(() => {
		if (!karlMessage.multiSelect || !currentContentKey) return new Set<string>();
		const keys = currentContentKey.split(',').map((k) => k.trim().replace('option_', ''));
		return new Set(keys);
	});

	let selected = $state<Set<string>>(new Set());

	// initialize selected from current value on mount
	$effect(() => {
		selected = new Set(initialSelected);
	});

	// render karl's question with i18n
	const questionText = $derived.by(() => {
		if (!karlMessage.contentKey) return karlMessage.content;
		const fn = (m as Record<string, (p?: Record<string, unknown>) => string>)[karlMessage.contentKey];
		return fn ? fn(karlMessage.contentParams) : karlMessage.content;
	});

	// get translated label for an option
	function getOptionLabel(option: ChatOption): string {
		return t(`option_${option.id}`, option.labelDe);
	}

	function handleOptionClick(option: ChatOption) {
		if (karlMessage.multiSelect) {
			// toggle selection
			const newSelected = new Set(selected);
			if (newSelected.has(option.id)) {
				newSelected.delete(option.id);
			} else {
				// gender is exclusive
				if (option.id === 'female' || option.id === 'male') {
					newSelected.delete('female');
					newSelected.delete('male');
				}
				newSelected.add(option.id);
			}
			selected = newSelected;
		} else {
			onSubmit(option.labelDe, option);
			// don't auto-close - let parent handle it (allows async operations like geolocation)
		}
	}

	function handleMultiApply() {
		const selectedOptions = karlMessage.options?.filter((o) => selected.has(o.id)) ?? [];
		const contentKey = selectedOptions.length > 0
			? selectedOptions.map((o) => `option_${o.id}`).join(',')
			: 'option_no_preferences';
		const displayValue = selectedOptions.map((o) => o.labelDe).join(', ') || 'Keine besonderen Wünsche';
		onSubmit(displayValue, undefined, contentKey);
		if (onMultiSubmit) {
			onMultiSubmit(selectedOptions);
		}
		onClose();
	}

	function handleTextSubmit() {
		if (textValue.trim() && textValue.trim() !== currentValue) {
			onSubmit(textValue.trim());
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter' && karlMessage.inputType) {
			handleTextSubmit();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose}>
	<div
		class="dialog"
		onclick={(e) => e.stopPropagation()}
		style:border-radius={wobbly.md}
	>
		<div class="header">
			<button onclick={onClose} class="close-btn">
				<X size={20} />
			</button>
		</div>

		<!-- Show Karl's original question -->
		<p class="question">{questionText}</p>

		<!-- Show options if this was an option-based question -->
		{#if karlMessage.options?.length}
			<div class="options">
				{#each karlMessage.options as option}
					<button
						onclick={() => handleOptionClick(option)}
						class="option-btn"
						class:selected={karlMessage.multiSelect ? selected.has(option.id) : option.labelDe === currentValue}
						style:border-radius={wobbly.button}
					>
						{#if option.emoji}
							<span class="mr-1">{option.emoji}</span>
						{/if}
						{getOptionLabel(option)}
					</button>
				{/each}
			</div>
			{#if karlMessage.multiSelect}
				<button
					onclick={handleMultiApply}
					class="apply-btn"
					style:border-radius={wobbly.button}
				>
					{m.chat_change()} →
				</button>
			{/if}
		{/if}

		<!-- Show text input if this was a text-based question -->
		{#if karlMessage.inputType}
			<div class="input-group">
				<input
					type="text"
					bind:value={textValue}
					placeholder={karlMessage.inputType === 'plz' ? m.chat_plz_placeholder() : m.chat_placeholder()}
					class="input"
					style:border-radius={wobbly.sm}
					autofocus
				/>
				<button
					onclick={handleTextSubmit}
					class="submit-btn"
					style:border-radius={wobbly.button}
					disabled={!textValue.trim() || textValue.trim() === currentValue}
				>
					{m.chat_change()}
				</button>
			</div>
		{/if}
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
		max-width: 500px;
		width: 100%;
		box-shadow: var(--shadow-hard);
	}

	.header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.5rem;
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

	.question {
		font-family: var(--font-body);
		font-size: 1.125rem;
		color: var(--color-pencil);
		margin-bottom: 1.5rem;
		line-height: 1.4;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.option-btn {
		padding: 0.5rem 1rem;
		font-family: var(--font-body);
		font-size: 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		color: var(--color-pencil);
		transition: all 150ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.option-btn:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	.option-btn.selected {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.input-group {
		display: flex;
		gap: 0.75rem;
	}

	.input {
		flex: 1;
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

	.submit-btn {
		padding: 0.75rem 1.5rem;
		font-family: var(--font-body);
		font-size: 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		color: var(--color-pencil);
		transition: all 150ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.submit-btn:hover:not(:disabled) {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.apply-btn {
		margin-top: 1rem;
		width: 100%;
		padding: 0.75rem 1.5rem;
		font-family: var(--font-body);
		font-size: 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-blue-pen);
		color: white;
		transition: all 150ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.apply-btn:hover {
		background-color: var(--color-pencil);
	}
</style>
