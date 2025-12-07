<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import KarlAvatar from './KarlAvatar.svelte';

	interface Props {
		role: 'karl' | 'user';
		content: string;
	}

	let { role, content }: Props = $props();
</script>

<div class="flex items-end gap-2" class:flex-row-reverse={role === 'user'}>
	{#if role === 'karl'}
		<KarlAvatar size="sm" />
	{/if}

	<div
		class="max-w-[85%] border-2 px-4 py-3 md:max-w-[70%]"
		class:karl={role === 'karl'}
		class:user={role === 'user'}
		style:border-radius={role === 'karl' ? wobbly.bubble : wobbly.bubbleAlt}
	>
		{content}
	</div>
</div>

<style>
	.karl {
		background-color: var(--color-paper);
		border-color: var(--color-pencil);
		color: var(--color-pencil);
	}

	.user {
		background-color: var(--color-blue-pen);
		border-color: var(--color-pencil);
		color: white;
	}
</style>
