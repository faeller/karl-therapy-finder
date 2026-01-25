<script lang="ts">
	interface Props {
		text: string;
		children: import('svelte').Snippet;
	}

	let { text, children }: Props = $props();
	let showTooltip = $state(false);
</script>

<span
	class="tooltip-wrapper"
	onclick={() => showTooltip = !showTooltip}
	title={text}
	role="button"
	tabindex="0"
>
	{@render children()}
</span>

{#if showTooltip}
	<div class="tooltip-popup">
		{text}
	</div>
{/if}

<style>
	.tooltip-wrapper {
		cursor: help;
		display: inline-flex;
		align-items: center;
	}

	.tooltip-popup {
		margin-top: 0.5rem;
		padding: 0.5rem;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-pencil);
		background: var(--color-erased);
		border-radius: 0.25rem;
		opacity: 0.8;
	}
</style>
