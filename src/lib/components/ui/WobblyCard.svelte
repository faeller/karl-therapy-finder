<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';

	interface Props {
		decoration?: 'none' | 'tape' | 'tack' | 'postit';
		rotation?: number;
		class?: string;
	}

	let {
		decoration = 'none',
		rotation = 0,
		class: className = '',
		children
	}: Props & { children: any } = $props();
</script>

<div
	class="wobbly-card relative border-2 border-pencil p-4 md:p-6 {className}"
	class:postit={decoration === 'postit'}
	style:border-radius={wobbly.md}
	style:box-shadow="var(--shadow-hard-subtle)"
	style:transform={rotation ? `rotate(${rotation}deg)` : undefined}
>
	{#if decoration === 'tape'}
		<div
			class="tape absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2"
			style:transform="rotate(-2deg)"
		></div>
	{/if}

	{#if decoration === 'tack'}
		<div
			class="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-red-marker shadow-sm"
		></div>
	{/if}

	{@render children()}
</div>

<style>
	.wobbly-card {
		background-color: var(--color-paper);
	}
	.wobbly-card.postit {
		background-color: var(--color-postit);
	}
	.tape {
		background-color: var(--color-pencil);
		opacity: 0.2;
	}
</style>
