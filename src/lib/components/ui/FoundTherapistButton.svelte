<script lang="ts">
	import { PartyPopper } from 'lucide-svelte';
	import { wobbly } from '$lib/utils/wobbly';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		onclick: () => void;
	}

	let { onclick }: Props = $props();

	function handleClick() {
		spawnConfetti(120);
		setTimeout(() => {
			onclick();
		}, 600);
	}

	function spawnConfetti(count: number = 120) {
		const container = document.createElement('div');
		container.className = 'confetti-fullscreen';
		document.body.appendChild(container);

		const colors = ['#2d5da1', '#d14b4b', '#d99e3d', '#4a9d4a', '#9b59b6', '#e91e63', '#00bcd4', '#ff9800'];

		// use documentFragment for better performance
		const fragment = document.createDocumentFragment();

		for (let i = 0; i < count; i++) {
			const particle = document.createElement('div');
			particle.className = 'confetti-piece';

			particle.style.cssText = `
				left: ${Math.random() * 100}%;
				--fall-delay: ${Math.random() * 0.8}s;
				--fall-duration: ${4 + Math.random() * 4}s;
				--drift: ${(Math.random() - 0.5) * 300}px;
				--spin: ${Math.random() * 1080 - 540}deg;
				background-color: ${colors[Math.floor(Math.random() * colors.length)]};
				width: ${6 + Math.random() * 8}px;
				height: ${6 + Math.random() * 12}px;
				border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
			`;

			fragment.appendChild(particle);
		}

		container.appendChild(fragment);
		setTimeout(() => container.remove(), 9000);
	}

	// expose for "mehr konfetti" button
	export { spawnConfetti };
</script>

<button
	onclick={handleClick}
	class="action-chip success"
	style:border-radius={wobbly.button}
>
	<PartyPopper size={16} />
	{m.option_found_therapist()}
</button>

<style>
	:global(.confetti-fullscreen) {
		position: fixed;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 9999;
	}

	:global(.confetti-piece) {
		position: absolute;
		top: -20px;
		animation: confetti-fall var(--fall-duration) ease-out forwards;
		animation-delay: var(--fall-delay);
		will-change: transform, opacity;
	}

	@keyframes confetti-fall {
		0% {
			opacity: 1;
			transform: translateY(0) translateX(0) rotate(0deg);
		}
		100% {
			opacity: 0;
			transform: translateY(100vh) translateX(var(--drift)) rotate(var(--spin));
		}
	}

	/* imessage theme (default) */
	.action-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border: 1px solid var(--color-card-border);
		background-color: var(--color-erased);
		color: var(--color-pencil);
		font-family: var(--font-body);
		font-size: 0.875rem;
		transition: all 100ms;
	}

	.action-chip:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
	}

	.action-chip.success {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.action-chip.success:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	/* handdrawn theme */
	:global(:root.theme-handdrawn) .action-chip {
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		box-shadow: var(--shadow-hard-sm);
	}

	:global(:root.theme-handdrawn) .action-chip.success {
		border-color: var(--color-blue-pen);
		background-color: var(--color-paper);
		color: var(--color-blue-pen);
	}

	:global(:root.theme-handdrawn) .action-chip.success:hover {
		background-color: var(--color-blue-pen);
		color: white;
	}
</style>
