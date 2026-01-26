<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';
	import Tooltip from './Tooltip.svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	const tooltipText = 'Dieser Anruf wurde pausiert, weil dein Guthaben aufgebraucht ist. Sobald du neue Minuten erhältst (z.B. durch monatliches Aufladen oder Tier-Upgrade), wird der Anruf automatisch fortgesetzt und neu geplant.';
</script>

<Tooltip text={tooltipText}>
	<span class="frozen-info {className}">
		pausiert
		<HelpCircle size={12} class="help-icon" />
	</span>
</Tooltip>

<style>
	.frozen-info {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-cyan-600, #0891b2);
	}

	.help-icon {
		opacity: 0.5;
	}
</style>
