<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { m } from '$lib/paraglide/messages';
	import { Cloud } from 'lucide-svelte';

	interface Props {
		onSync: () => void;
		onSkip: () => void;
		onLater: () => void;
	}

	let { onSync, onSkip, onLater }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onLater} role="button" tabindex="-1">
	<div
		class="modal-content"
		onclick={(e) => e.stopPropagation()}
		style:border-radius={wobbly.md}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="icon-wrapper">
			<Cloud size={40} class="text-blue-pen" />
		</div>
		<h2 class="title">{m.auth_sync_prompt_title()}</h2>
		<p class="message">{m.auth_sync_prompt_message()}</p>

		<div class="buttons">
			<button
				onclick={onSync}
				class="modal-btn primary"
				style:border-radius={wobbly.button}
			>
				{m.auth_sync_prompt_yes()}
			</button>
			<button
				onclick={onSkip}
				class="modal-btn"
				style:border-radius={wobbly.button}
			>
				{m.auth_sync_prompt_no()}
			</button>
		</div>

		<button onclick={onLater} class="later-link">
			{m.auth_sync_prompt_later()}
		</button>
	</div>
</div>

<style>
	.icon-wrapper {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.title {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.message {
		font-family: var(--font-body);
		font-size: 1rem;
		color: var(--color-pencil);
		opacity: 0.8;
		text-align: center;
		margin-bottom: 1.5rem;
		line-height: 1.4;
	}

	.buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.later-link {
		display: block;
		width: 100%;
		margin-top: 1rem;
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--color-pencil);
		opacity: 0.6;
		text-align: center;
		text-decoration: underline;
	}

	.later-link:hover {
		opacity: 1;
	}
</style>
