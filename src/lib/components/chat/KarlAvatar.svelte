<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'xl';
		href?: string;
		shadow?: 'sm' | 'md';
	}

	let { size = 'md', href, shadow = 'sm' }: Props = $props();
</script>

{#if href}
	<a {href} class="karl-avatar {size}" class:shadow-md={shadow === 'md'}>K</a>
{:else}
	<div class="karl-avatar {size}" class:shadow-md={shadow === 'md'}>K</div>
{/if}

<style>
	.karl-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-erased);
		font-family: var(--font-brand);
		font-weight: 700;
	}
	.karl-avatar.shadow-md {
		border-width: 3px;
		box-shadow: var(--shadow-hard);
	}
	.karl-avatar.sm {
		width: 2rem;
		height: 2rem;
		font-size: 0.875rem;
	}
	.karl-avatar.md {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1rem;
	}
	.karl-avatar.lg {
		width: 3.5rem;
		height: 3.5rem;
		font-size: 1.25rem;
	}
	.karl-avatar.xl {
		width: 5rem;
		height: 5rem;
		font-size: 2.25rem;
	}
</style>
