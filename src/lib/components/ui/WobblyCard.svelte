<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'postit';
		decoration?: 'none' | 'tape' | 'tack';
		rotation?: number;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'default',
		decoration = 'none',
		rotation = 0,
		class: className = '',
		children
	}: Props = $props();
</script>

<div
	class="card relative p-4 md:p-6 {className}"
	class:postit={variant === 'postit'}
	style:--wobbly-radius={wobbly.md}
	style:transform={rotation ? `rotate(${rotation}deg)` : undefined}
>
	{#if decoration === 'tape'}
		<div class="tape absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-[-2deg]"></div>
	{/if}

	{#if decoration === 'tack'}
		<div class="tack absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-red-marker shadow-sm"></div>
	{/if}

	{@render children()}
</div>

<style>
	/* modern theme (default) */
	.card {
		background-color: var(--color-erased);
		border: 1px solid var(--color-card-border);
		border-radius: 14px;
	}
	.card.postit {
		background-color: var(--color-postit);
	}

	/* handdrawn theme */
	:global(.theme-handdrawn) .card {
		background-color: var(--color-paper);
		border: 2px solid var(--color-pencil);
		border-radius: var(--radius-wobbly);
		box-shadow: var(--shadow-hard);
	}
	:global(.theme-handdrawn) .card.postit {
		background-color: var(--color-postit);
		box-shadow: var(--shadow-hard);
	}

	/* decorations only visible in handdrawn theme */
	.tape,
	.tack {
		display: none;
	}
	:global(.theme-handdrawn) .tape {
		display: block;
		background-color: var(--color-pencil);
		opacity: 0.2;
	}
	:global(.theme-handdrawn) .tack {
		display: block;
	}
</style>
