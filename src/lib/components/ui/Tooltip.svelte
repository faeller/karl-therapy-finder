<script lang="ts">
	import { X } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { untrack } from 'svelte';

	interface Props {
		text: string;
		children: import('svelte').Snippet;
	}

	let { text, children }: Props = $props();
	let showTooltip = $state(false);
	let modalElement: HTMLDivElement | null = $state(null);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		return () => {
			// cleanup: remove modal from body if still there
			if (modalElement?.parentNode === document.body) {
				document.body.removeChild(modalElement);
			}
		};
	});

	// portal modal to body to escape parent opacity
	$effect(() => {
		if (mounted && showTooltip && modalElement) {
			document.body.appendChild(modalElement);
		} else if (mounted && !showTooltip && modalElement?.parentNode === document.body) {
			document.body.removeChild(modalElement);
		}
	});
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

<!-- modal rendered but portaled to body via $effect -->
{#if mounted}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		bind:this={modalElement}
		class="tooltip-overlay"
		class:visible={showTooltip}
		onclick={() => showTooltip = false}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="tooltip-modal" onclick={(e) => e.stopPropagation()}>
			<button class="close-btn" onclick={() => showTooltip = false} aria-label="Close">
				<X size={16} />
			</button>
			<p class="tooltip-text">{text}</p>
		</div>
	</div>
{/if}

<style>
	.tooltip-wrapper {
		cursor: help;
		display: inline-flex;
		align-items: center;
	}

	.tooltip-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: none;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
	}

	.tooltip-overlay.visible {
		display: flex;
	}

	.tooltip-modal {
		position: relative;
		max-width: 24rem;
		width: 100%;
		padding: 1rem;
		background: var(--color-paper);
		border: 3px solid var(--color-pencil);
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.close-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-pencil);
		opacity: 0.5;
		transition: opacity 100ms;
	}

	.close-btn:hover {
		opacity: 1;
	}

	.tooltip-text {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-pencil);
		margin: 0;
		padding-right: 1.5rem;
	}
</style>
