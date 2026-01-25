<script lang="ts">
	import { Phone, HelpCircle } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		availableSeconds: number;
		projectedSeconds: number;
		tierSeconds: number;
		totalSeconds: number;
		pendingCalls: number;
		compact?: boolean;
		showTitle?: boolean;
		noBackground?: boolean;
		showLegend?: boolean;
	}

	let {
		availableSeconds,
		projectedSeconds,
		tierSeconds,
		totalSeconds,
		pendingCalls,
		compact = false,
		showTitle = false,
		noBackground = false,
		showLegend = false
	}: Props = $props();

	const hasCredits = $derived(tierSeconds > 0 || availableSeconds > 0);
	const availableMins = $derived(Math.floor(availableSeconds / 60));
	const availableSecs = $derived(availableSeconds % 60);
	const tierMins = $derived(Math.floor(tierSeconds / 60));
	const totalMins = $derived(Math.floor(totalSeconds / 60));
	const maxSeconds = $derived(tierSeconds > 0 ? tierSeconds : totalSeconds);
	const reservedMins = $derived(Math.floor(projectedSeconds / 60));
	const reservedSecs = $derived(projectedSeconds % 60);

	const freeSeconds = $derived(availableSeconds - projectedSeconds);
	const freePercent = $derived(Math.min(100, (freeSeconds / maxSeconds) * 100));
	const reservedPercent = $derived(Math.min(100, (projectedSeconds / maxSeconds) * 100));
	const freeMins = $derived(Math.floor(freeSeconds / 60));
	const freeSecs = $derived(freeSeconds % 60);
</script>

<div class="call-credits" class:compact class:no-background={noBackground}>
	{#if showTitle}
		<div class="header">
			<Phone size={20} class="text-blue-pen" />
			<h3 class="title">{m.account_call_credits()}</h3>
		</div>
	{/if}

	{#if hasCredits}
		<p class="time-display">
			{availableMins}:{availableSecs.toString().padStart(2, '0')} / {tierMins > 0 ? tierMins : totalMins}:00 min
		</p>
	{:else}
		<p class="time-display">0:00 min</p>
	{/if}

	<!-- progress bar -->
	<div class="progress-bar">
		{#if hasCredits && maxSeconds > 0}
			<div class="progress-track">
				<!-- free time in blue -->
				<div
					class="progress-segment free"
					style:width="{freePercent}%"
					title="Verfügbar: {freeMins}:{freeSecs.toString().padStart(2, '0')} min"
				></div>
				<!-- reserved time in grey -->
				{#if projectedSeconds > 0}
					<div
						class="progress-segment reserved"
						style:width="{reservedPercent}%"
						title="Reserviert: {reservedMins}:{reservedSecs.toString().padStart(2, '0')} min für {pendingCalls} geplante{pendingCalls === 1 ? 'n' : ''} Anruf{pendingCalls === 1 ? '' : 'e'}"
					></div>
				{/if}
			</div>
		{/if}
	</div>

	{#if showLegend}
		<div class="legend">
			<div class="legend-item">
				<div class="legend-color free"></div>
				<span>Verfügbar</span>
			</div>
			<div
				class="legend-item"
				title="Reservierte Zeit für geplante Anrufe. Diese Minuten werden vorläufig blockiert, um sicherzustellen, dass genug Guthaben für anstehende Anrufe vorhanden ist. Nach Abschluss des Anrufs wird nur die tatsächlich genutzte Zeit abgezogen."
			>
				<div class="legend-color reserved"></div>
				<span>Reserviert</span>
				<HelpCircle size={12} class="help-icon" />
			</div>
		</div>
	{/if}

	{#if pendingCalls > 0}
		<div class="info-text" class:compact>
			<span
				class="reserved-info"
				title="Reservierte Zeit für {pendingCalls} geplante{pendingCalls === 1 ? 'n' : ''} Anruf{pendingCalls === 1 ? '' : 'e'}. Diese Minuten werden vorläufig blockiert, um sicherzustellen, dass genug Guthaben für anstehende Anrufe vorhanden ist. Nach Abschluss des Anrufs wird nur die tatsächlich genutzte Zeit abgezogen."
			>
				{pendingCalls} geplant ({reservedMins}:{reservedSecs.toString().padStart(2, '0')} min reserviert)
				<HelpCircle size={14} class="help-icon" />
			</span>
		</div>
	{/if}
</div>

<style>
	.call-credits {
		width: 100%;
	}

	.call-credits.compact {
		padding: 0.75rem;
		background: var(--color-erased);
		border-radius: 0.5rem;
	}

	.call-credits.no-background {
		background: transparent;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.title {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-pencil);
	}

	.time-display {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.7;
		margin-bottom: 0.75rem;
	}

	.compact .time-display {
		margin-bottom: 0.5rem;
	}

	.progress-bar {
		margin-bottom: 0.5rem;
	}

	.progress-track {
		height: 0.5rem;
		width: 100%;
		overflow: hidden;
		border-radius: 0.25rem;
		background-color: var(--color-erased);
		display: flex;
	}

	.compact .progress-track {
		height: 0.375rem;
	}

	.progress-segment {
		transition: width 200ms;
	}

	.progress-segment.free {
		background-color: var(--color-blue-pen);
	}

	.progress-segment.reserved {
		background-color: var(--color-pencil);
		opacity: 0.3;
	}

	.info-text {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.5;
		text-align: right;
	}

	.info-text.compact {
		text-align: left;
	}

	.reserved-info {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		cursor: help;
	}

	.help-icon {
		opacity: 0.4;
	}

	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.7;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.legend-color {
		width: 1rem;
		height: 0.5rem;
		border-radius: 0.125rem;
	}

	.legend-color.free {
		background-color: var(--color-blue-pen);
	}

	.legend-color.reserved {
		background-color: var(--color-pencil);
		opacity: 0.6;
	}
</style>
