<script lang="ts">
	import { syncConflict, resolveConflict } from '$lib/services/syncService';
	import { wobbly } from '$lib/utils/wobbly';
	import { m } from '$lib/paraglide/messages';
	import { Cloud, Smartphone } from 'lucide-svelte';

	let resolving = $state(false);

	async function handleChoice(useServer: boolean) {
		resolving = true;
		await resolveConflict(useServer);
		resolving = false;
	}
</script>

{#if $syncConflict}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-overlay">
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<h2 class="modal-title">{m.sync_conflict_title()}</h2>
			<p class="modal-text">{m.sync_conflict_message()}</p>

			<div class="modal-buttons">
				<button
					onclick={() => handleChoice(true)}
					disabled={resolving}
					class="modal-btn"
					style:border-radius={wobbly.button}
				>
					<Cloud size={18} />
					{m.sync_conflict_use_server()}
				</button>
				<button
					onclick={() => handleChoice(false)}
					disabled={resolving}
					class="modal-btn primary"
					style:border-radius={wobbly.button}
				>
					<Smartphone size={18} />
					{m.sync_conflict_use_local()}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--color-paper);
		border: 1px solid var(--color-card-border);
		border-radius: 14px;
		padding: 1.5rem;
		max-width: 400px;
		width: 100%;
	}

	.modal-title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	.modal-text {
		font-size: 0.9rem;
		color: var(--color-pencil);
		opacity: 0.8;
		margin-bottom: 1.25rem;
		line-height: 1.4;
	}

	.modal-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px solid var(--color-pencil);
		background-color: var(--color-paper);
		font-family: var(--font-body);
		font-size: 0.9rem;
		color: var(--color-pencil);
		transition: all 100ms;
	}

	.modal-btn:hover:not(:disabled) {
		background-color: var(--color-erased);
	}

	.modal-btn.primary {
		background-color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		color: white;
	}

	.modal-btn.primary:hover:not(:disabled) {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.modal-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* handdrawn theme */
	:global(:root.theme-handdrawn) .modal-content {
		background-color: var(--color-paper);
		border: 2px solid var(--color-pencil);
		border-radius: var(--radius-wobbly);
		box-shadow: var(--shadow-hard);
	}
</style>
