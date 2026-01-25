<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit';
		onclick?: () => void;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		onclick,
		class: className = '',
		children
	}: Props = $props();

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-base',
		md: 'px-5 py-2.5 text-lg',
		lg: 'px-7 py-3 text-xl'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="
		wobbly-btn font-body cursor-pointer
		transition-all duration-100 ease-out
		disabled:cursor-not-allowed disabled:opacity-50
		{sizeClasses[size]}
		{className}
	"
	class:primary={variant === 'primary'}
	class:secondary={variant === 'secondary'}
	style:border-radius={wobbly.button}
>
	{@render children()}
</button>

<style>
	/* imessage theme (default) */
	.wobbly-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 1px solid var(--color-card-border);
	}

	.primary {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}
	.primary:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.secondary {
		background-color: var(--color-erased);
		border-color: var(--color-card-border);
		color: var(--color-pencil);
	}
	.secondary:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	/* handdrawn theme */
	:global(:root.theme-handdrawn) .wobbly-btn {
		border-width: 3px;
		border-style: solid;
	}

	:global(:root.theme-handdrawn) .primary {
		background-color: var(--color-paper);
		border-color: var(--color-pencil);
		color: var(--color-pencil);
		box-shadow: var(--shadow-hard);
	}
	:global(:root.theme-handdrawn) .primary:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
		box-shadow: var(--shadow-hard-sm);
		transform: translate(2px, 2px);
	}
	:global(:root.theme-handdrawn) .primary:active:not(:disabled) {
		box-shadow: none;
		transform: translate(4px, 4px);
	}

	:global(:root.theme-handdrawn) .secondary {
		background-color: var(--color-erased);
		border-color: var(--color-pencil);
		color: var(--color-pencil);
		box-shadow: var(--shadow-hard);
	}
	:global(:root.theme-handdrawn) .secondary:hover:not(:disabled) {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
		box-shadow: var(--shadow-hard-sm);
		transform: translate(2px, 2px);
	}
	:global(:root.theme-handdrawn) .secondary:active:not(:disabled) {
		box-shadow: none;
		transform: translate(4px, 4px);
	}
</style>
