<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import type { ChatOption } from '$lib/types';

	interface Props {
		options: ChatOption[];
		multiSelect?: boolean;
		onSelect: (option: ChatOption) => void;
		onMultiSubmit?: (options: ChatOption[]) => void;
	}

	let { options, multiSelect = false, onSelect, onMultiSubmit }: Props = $props();

	let selected = $state<Set<string>>(new Set());

	function toggleOption(option: ChatOption) {
		if (multiSelect) {
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
			onSelect(option);
		}
	}

	function submitMulti() {
		const selectedOptions = options.filter((o) => selected.has(o.id));
		onMultiSubmit?.(selectedOptions);
	}
</script>

<div class="flex flex-wrap justify-center gap-3 px-2">
	{#each options as option}
		<button
			onclick={() => toggleOption(option)}
			class="option-btn"
			class:selected={multiSelect && selected.has(option.id)}
			class:single={!multiSelect}
			style:border-radius={wobbly.button}
		>
			{#if option.emoji}
				<span class="mr-1">{option.emoji}</span>
			{/if}
			{option.labelDe}
		</button>
	{/each}

	{#if multiSelect}
		<button
			onclick={submitMulti}
			class="option-btn single"
			style:border-radius={wobbly.button}
		>
			Weiter →
		</button>
	{/if}
</div>

<style>
	.option-btn {
		border-width: 2px;
		border-style: solid;
		padding: 0.5rem 1rem;
		font-family: var(--font-body);
		font-size: 1rem;
		transition: all 100ms;
		background-color: var(--color-paper);
		border-color: var(--color-pencil);
		color: var(--color-pencil);
		box-shadow: var(--shadow-hard-sm);
	}

	@media (min-width: 768px) {
		.option-btn {
			font-size: 1.125rem;
		}
	}

	/* single select - hover turns red */
	.option-btn.single:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	/* multi select - selected turns blue */
	.option-btn.selected {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}
</style>
