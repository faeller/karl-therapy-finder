<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';

	interface Props {
		projectedSeconds: number;
		pendingCalls: number;
	}

	let { projectedSeconds, pendingCalls }: Props = $props();

	const reservedMins = $derived(Math.floor(projectedSeconds / 60));
	const reservedSecs = $derived(projectedSeconds % 60);
	let showTooltip = $state(false);
</script>

{#if pendingCalls > 0}
	<span
		class="reserved-info"
		onclick={() => showTooltip = !showTooltip}
		title="Reservierte Zeit für {pendingCalls} geplante{pendingCalls === 1 ? 'n' : ''} Anruf{pendingCalls === 1 ? '' : 'e'}. Diese Minuten werden vorläufig blockiert, um sicherzustellen, dass genug Guthaben für anstehende Anrufe vorhanden ist. Nach Abschluss des Anrufs wird nur die tatsächlich genutzte Zeit abgezogen."
		role="button"
		tabindex="0"
	>
		{pendingCalls} geplant ({reservedMins}:{reservedSecs.toString().padStart(2, '0')} min reserviert)
		<HelpCircle size={14} class="help-icon" />
	</span>
	{#if showTooltip}
		<div class="tooltip-text">
			Reservierte Zeit für {pendingCalls} geplante{pendingCalls === 1 ? 'n' : ''} Anruf{pendingCalls === 1 ? '' : 'e'}. Diese Minuten werden vorläufig blockiert, um sicherzustellen, dass genug Guthaben für anstehende Anrufe vorhanden ist. Nach Abschluss des Anrufs wird nur die tatsächlich genutzte Zeit abgezogen.
		</div>
	{/if}
{/if}

<style>
	.reserved-info {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		cursor: help;
	}

	.help-icon {
		opacity: 0.4;
	}

	.tooltip-text {
		margin-top: 0.5rem;
		padding: 0.5rem;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-pencil);
		background: var(--color-erased);
		border-radius: 0.25rem;
		opacity: 0.8;
	}
</style>
