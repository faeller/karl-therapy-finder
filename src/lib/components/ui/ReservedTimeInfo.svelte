<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';
	import Tooltip from './Tooltip.svelte';

	interface Props {
		projectedSeconds: number;
		pendingCalls: number;
	}

	let { projectedSeconds, pendingCalls }: Props = $props();

	const reservedMins = $derived(Math.floor(projectedSeconds / 60));
	const reservedSecs = $derived(projectedSeconds % 60);
	const tooltipText = $derived(`Reservierte Zeit für ${pendingCalls} geplante${pendingCalls === 1 ? 'n' : ''} Anruf${pendingCalls === 1 ? '' : 'e'}. Diese Minuten werden vorläufig blockiert, um sicherzustellen, dass genug Guthaben für anstehende Anrufe vorhanden ist. Nach Abschluss des Anrufs wird nur die tatsächlich genutzte Zeit abgezogen.`);
</script>

{#if pendingCalls > 0}
	<Tooltip text={tooltipText}>
		<span class="reserved-info">
			{pendingCalls} geplant ({reservedMins}:{reservedSecs.toString().padStart(2, '0')} min reserviert)
			<HelpCircle size={14} class="help-icon" />
		</span>
	</Tooltip>
{/if}

<style>
	.reserved-info {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.reserved-info :global(.lucide) {
		opacity: 0.4;
	}
</style>
