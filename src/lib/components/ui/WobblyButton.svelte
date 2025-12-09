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
	.wobbly-btn {
		border-width: 3px;
		border-style: solid;
	}

	.primary {
		background-color: var(--color-paper);
		border-color: var(--color-pencil);
		color: var(--color-pencil);
		box-shadow: var(--shadow-hard);
	}
	.primary:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
		box-shadow: var(--shadow-hard-sm);
		transform: translate(2px, 2px);
	}
	.primary:active:not(:disabled) {
		box-shadow: none;
		transform: translate(4px, 4px);
	}

	.secondary {
		background-color: var(--color-erased);
		border-color: var(--color-pencil);
		color: var(--color-pencil);
		box-shadow: var(--shadow-hard);
	}
	.secondary:hover:not(:disabled) {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
		box-shadow: var(--shadow-hard-sm);
		transform: translate(2px, 2px);
	}
	.secondary:active:not(:disabled) {
		box-shadow: none;
		transform: translate(4px, 4px);
	}
</style>
