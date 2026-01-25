<script lang="ts">
	import KarlAvatar from './KarlAvatar.svelte';
</script>

<div class="flex items-end gap-2">
	<KarlAvatar size="sm" />
	<div class="typing-bubble">
		<span class="dot"></span>
		<span class="dot" style:animation-delay="0.15s"></span>
		<span class="dot" style:animation-delay="0.3s"></span>
	</div>
</div>

<style>
	.typing-bubble {
		display: flex;
		gap: 4px;
		padding: 0.75rem 1rem;
		background-color: var(--color-erased);
		border-radius: 18px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
	}

	.dot {
		width: 8px;
		height: 8px;
		background-color: var(--color-pencil);
		opacity: 0.5;
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
