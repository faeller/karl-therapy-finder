<script lang="ts">
	import KarlAvatar from './KarlAvatar.svelte';
</script>

<div class="flex items-end gap-2">
	<KarlAvatar size="sm" />
	<div
		class="flex gap-1 rounded-2xl border-2 border-pencil bg-paper px-4 py-3"
		style:border-radius="20px 255px 20px 255px / 255px 20px 255px 20px"
	>
		<span class="dot"></span>
		<span class="dot" style:animation-delay="0.15s"></span>
		<span class="dot" style:animation-delay="0.3s"></span>
	</div>
</div>

<style>
	.dot {
		width: 8px;
		height: 8px;
		background-color: var(--color-pencil);
		border-radius: 50%;
		animation: bounce 1s infinite;
	}

	@keyframes bounce {
		0%, 60%, 100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-6px);
		}
	}
</style>
