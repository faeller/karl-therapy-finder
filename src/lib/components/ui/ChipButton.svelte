<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import type { Snippet } from 'svelte';

	interface Props {
		selected?: boolean;
		variant?: 'default' | 'blue';
		onclick?: () => void;
		children: Snippet;
	}

	let {
		selected = false,
		variant = 'default',
		onclick,
		children
	}: Props = $props();
</script>

<button
	{onclick}
	class="chip"
	class:selected
	class:blue={variant === 'blue'}
	style:border-radius={wobbly.sm}
>
	{@render children()}
</button>

<style>
	.chip {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		border-width: 2px;
		border-style: solid;
		transition: all 150ms;
		font-family: var(--font-body);
	}

	/* unselected state */
	.chip:not(.selected) {
		background-color: transparent;
		border-color: var(--color-pencil);
		opacity: 0.4;
		color: var(--color-pencil);
	}

	.chip:not(.selected):hover {
		opacity: 0.7;
	}

	/* selected default (red) */
	.chip.selected:not(.blue) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	/* selected blue */
	.chip.selected.blue {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}
</style>
