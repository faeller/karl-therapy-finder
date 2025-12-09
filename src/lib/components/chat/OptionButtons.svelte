<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { Send } from 'lucide-svelte';
	import type { ChatOption } from '$lib/types';
	import { m } from '$lib/paraglide/messages';
	import { t } from '$lib/i18n';
	import { isGenderOption } from '$lib/data/optionMapping';

	interface Props {
		options: ChatOption[];
		multiSelect?: boolean;
		inputType?: 'text' | 'plz';
		inputPlaceholder?: string;
		onSelect: (option: ChatOption) => void;
		onMultiSubmit?: (options: ChatOption[]) => void;
		onTextSubmit?: (text: string) => void;
	}

	let { options, multiSelect = false, inputType, inputPlaceholder, onSelect, onMultiSubmit, onTextSubmit }: Props = $props();

	let selected = $state<Set<string>>(new Set());
	let textValue = $state('');

	function toggleOption(option: ChatOption) {
		if (multiSelect) {
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
			onSelect(option);
		}
	}

	function submitMulti() {
		const selectedOptions = options.filter((o) => selected.has(o.id));
		onMultiSubmit?.(selectedOptions);
	}

	function submitText() {
		if (textValue.trim() && onTextSubmit) {
			onTextSubmit(textValue.trim());
			textValue = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submitText();
		}
	}
</script>

<div class="flex flex-wrap justify-center gap-3 px-2">
	{#each options as option}
		<button
			onclick={() => toggleOption(option)}
			class="option-btn"
			class:selected={multiSelect && selected.has(option.id)}
			class:single={!multiSelect}
			class:secondary={option.style === 'secondary'}
			style:border-radius={wobbly.button}
		>
			{#if option.emoji}
				<span class="mr-1">{option.emoji}</span>
			{/if}
			{t(`option_${option.id}`, option.labelDe)}
		</button>
	{/each}

	{#if multiSelect}
		<button
			onclick={submitMulti}
			class="option-btn single"
			style:border-radius={wobbly.button}
		>
			{m.chat_continue()} →
		</button>
	{/if}

	{#if inputType && onTextSubmit}
		<div class="inline-input-wrapper">
			<span class="input-or">{m.chat_or()}</span>
			<div class="inline-input">
				<input
					type="text"
					bind:value={textValue}
					placeholder={inputPlaceholder ?? m.chat_placeholder()}
					onkeydown={handleKeydown}
					style:border-radius={wobbly.sm}
				/>
				<button
					onclick={submitText}
					disabled={!textValue.trim()}
					class="inline-submit"
					style:border-radius={wobbly.button}
				>
					<Send size={16} />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* option-btn base styles in app.css */

	/* inline input */
	.inline-input-wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.input-or {
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.5;
	}

	.inline-input {
		display: flex;
		gap: 0.5rem;
		width: 100%;
		max-width: 20rem;
	}

	.inline-input input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 1rem;
		color: var(--color-pencil);
	}

	.inline-input input::placeholder {
		color: var(--color-pencil);
		opacity: 0.4;
	}

	.inline-input input:focus {
		border-color: var(--color-blue-pen);
		outline: none;
	}

	.inline-submit {
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--color-blue-pen);
		background-color: var(--color-blue-pen);
		color: white;
		transition: all 100ms;
	}

	.inline-submit:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.inline-submit:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background-color: var(--color-paper);
		color: var(--color-pencil);
	}
</style>
