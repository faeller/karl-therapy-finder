<script lang="ts">
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		icon?: string;
		collapsible?: boolean;
		defaultOpen?: boolean;
		children: Snippet;
	}

	let {
		title,
		icon,
		collapsible = true,
		defaultOpen = true,
		children
	}: Props = $props();

	let isOpen = $state(false);

	$effect(() => {
		isOpen = defaultOpen;
	});
</script>

<div class="chat-section" class:expanded={isOpen || !collapsible}>
	{#if collapsible}
		<button
			onclick={() => (isOpen = !isOpen)}
			class="section-header"
		>
			<span class="flex items-center gap-2">
				{#if icon}<span>{icon}</span>{/if}
				<span class="font-heading font-bold">{title}</span>
			</span>
			{#if isOpen}
				<ChevronDown size={18} />
			{:else}
				<ChevronRight size={18} />
			{/if}
		</button>
	{:else}
		<div class="section-header-static">
			{#if icon}<span>{icon}</span>{/if}
			<span class="font-heading font-bold">{title}</span>
		</div>
	{/if}

	{#if isOpen || !collapsible}
		<div class="section-content">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.chat-section {
		margin-bottom: 0.75rem;
	}

	.chat-section.expanded {
		margin-bottom: 4rem;
	}

	.section-header {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background-color: var(--color-erased);
		color: var(--color-pencil);
		font-size: 0.875rem;
		transition: background-color 150ms;
	}

	.section-header:hover {
		background-color: var(--color-pencil);
		color: var(--color-paper);
	}

	.section-header-static {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 2px dashed var(--color-pencil);
		opacity: 0.5;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.section-content {
		padding-top: 1rem;
	}
</style>
