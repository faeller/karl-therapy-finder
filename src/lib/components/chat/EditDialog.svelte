<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { X } from 'lucide-svelte';
	import type { ChatMessage, ChatOption } from '$lib/types';
	import { m } from '$lib/paraglide/messages';
	import { t } from '$lib/i18n';
	import { isGenderOption } from '$lib/data/optionMapping';
	import { OptionId } from '$lib/data/optionIds';

	interface Props {
		karlMessage: ChatMessage;
		currentValue: string;
		currentContentKey?: string;
		onSubmit: (newValue: string, option?: ChatOption, contentKey?: string) => void;
		onMultiSubmit?: (options: ChatOption[]) => void;
		onClose: () => void;
	}

	let { karlMessage, currentValue, currentContentKey, onSubmit, onMultiSubmit, onClose }: Props = $props();

	let textValue = $state('');

	$effect(() => {
		textValue = currentValue;
	});

	const initialSelected = $derived.by(() => {
		if (!karlMessage.multiSelect || !currentContentKey) return new Set<string>();
		const keys = currentContentKey.split(',').map((k) => k.trim().replace('option_', ''));
		return new Set(keys);
	});

	let selected = $state<Set<string>>(new Set());

	$effect(() => {
		selected = new Set(initialSelected);
	});

	const questionText = $derived.by(() => {
		if (!karlMessage.contentKey) return karlMessage.content;
		type MessageFn = (p?: Record<string, unknown>) => string;
		const msgMap = m as unknown as Record<string, MessageFn>;
		const fn = msgMap[karlMessage.contentKey];
		return fn ? fn(karlMessage.contentParams) : karlMessage.content;
	});

	function getOptionLabel(option: ChatOption): string {
		return t(`option_${option.id}`, option.labelDe);
	}

	function handleOptionClick(option: ChatOption) {
		if (karlMessage.multiSelect) {
			const newSelected = new Set(selected);
			if (newSelected.has(option.id)) {
				newSelected.delete(option.id);
			} else {
				// gender options are mutually exclusive
				if (isGenderOption(option.id)) {
					for (const id of newSelected) {
						if (isGenderOption(id)) newSelected.delete(id);
					}
				}
				newSelected.add(option.id);
			}
			selected = newSelected;
		} else {
			onSubmit(option.labelDe, option);
		}
	}

	function handleMultiApply() {
		const selectedOptions = karlMessage.options?.filter((o) => selected.has(o.id)) ?? [];
		const contentKey = selectedOptions.length > 0
			? selectedOptions.map((o) => `option_${o.id}`).join(',')
			: `option_${OptionId.noPreferences}`;
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
<div class="modal-overlay" onclick={onClose} role="button" tabindex="-1">
	<div
		class="modal-content"
		onclick={(e) => e.stopPropagation()}
		style:border-radius={wobbly.md}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
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
				<!-- svelte-ignore a11y_autofocus -->
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
	/* modal-overlay, modal-content, option-btn styles in app.css */

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
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	@media (min-width: 400px) {
		.input-group {
			flex-direction: row;
		}
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
