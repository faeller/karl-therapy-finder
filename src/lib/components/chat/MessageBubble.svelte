<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { m } from '$lib/paraglide/messages';
	import KarlAvatar from './KarlAvatar.svelte';
	import { Pencil } from 'lucide-svelte';

	interface Props {
		role: 'karl' | 'user';
		content: string;
		contentKey?: string;
		contentParams?: Record<string, unknown>;
		onEdit?: () => void;
	}

	let { role, content, contentKey, contentParams, onEdit }: Props = $props();

	const displayText = $derived.by(() => {
		if (!contentKey) return content;
		const fn = (m as Record<string, (p?: Record<string, unknown>) => string>)[contentKey];
		return fn ? fn(contentParams) : content;
	});
</script>

<div class="flex items-end gap-2" class:flex-row-reverse={role === 'user'}>
	{#if role === 'karl'}
		<KarlAvatar size="sm" />
	{/if}

	<div class="bubble-wrapper" class:user={role === 'user'}>
		<div
			class="bubble"
			class:karl={role === 'karl'}
			class:user={role === 'user'}
			style:border-radius={role === 'karl' ? wobbly.bubble : wobbly.bubbleAlt}
		>
			{displayText}
		</div>

		{#if onEdit}
			<button onclick={onEdit} class="edit-btn" title="Ändern">
				<Pencil size={12} />
			</button>
		{/if}
	</div>
</div>

<style>
	.bubble-wrapper {
		position: relative;
		max-width: 85%;
	}

	@media (min-width: 768px) {
		.bubble-wrapper {
			max-width: 70%;
		}
	}

	.bubble {
		border: 2px solid var(--color-pencil);
		padding: 0.75rem 1rem;
		white-space: pre-line;
	}

	.bubble.karl {
		background-color: var(--color-paper);
		color: var(--color-pencil);
	}

	.bubble.user {
		background-color: var(--color-blue-pen);
		color: white;
	}

	.edit-btn {
		position: absolute;
		top: -0.5rem;
		right: -0.5rem;
		padding: 0.25rem;
		border-radius: 9999px;
		background-color: var(--color-paper);
		border: 1px solid var(--color-pencil);
		color: var(--color-pencil);
		opacity: 0;
		transition: opacity 150ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.bubble-wrapper:hover .edit-btn {
		opacity: 0.6;
	}

	.edit-btn:hover {
		opacity: 1 !important;
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}
</style>
