<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { campaignDraft } from '$lib/stores/campaign';
	import KarlAvatar from './KarlAvatar.svelte';
	import { Pencil } from 'lucide-svelte';

	interface Props {
		role: 'karl' | 'user';
		content?: string;
		contentKey?: string;
		contentParams?: Record<string, unknown>;
		onEdit?: () => void;
	}

	let { role, content = '', contentKey, contentParams, onEdit }: Props = $props();

	// build summary dynamically from campaign draft
	function buildSummary(): string {
		const draft = $campaignDraft;
		const lines: string[] = [m.karl_summary_intro()];

		if (draft.plz) {
			lines.push(m.karl_summary_location({ city: draft.plz, radius: draft.radiusKm }));
		}
		if (draft.insuranceType) {
			lines.push(m.karl_summary_insurance({ type: draft.insuranceType }));
		}
		const therapyText = draft.therapyTypes.length > 0
			? draft.therapyTypes.join(' / ')
			: m.karl_summary_all_therapies();
		lines.push(m.karl_summary_therapy({ types: therapyText }));

		if (draft.genderPref) {
			const gender = draft.genderPref === 'w' ? m.karl_summary_gender_female()
				: draft.genderPref === 'm' ? m.karl_summary_gender_male() : 'Divers';
			lines.push(m.karl_summary_gender({ gender }));
		}
		if (draft.languages.includes('en')) {
			lines.push(m.karl_summary_english());
		}
		if (draft.specialties.length > 0) {
			lines.push(m.karl_summary_specialties({ specialties: draft.specialties.join(', ') }));
		}

		return lines.join('\n');
	}

	const displayText = $derived.by(() => {
		// special case: build summary dynamically
		if (contentKey === 'karl_summary') {
			return buildSummary();
		}
		if (!contentKey) return content;
		// handle comma-separated keys (multi-select)
		type MessageFn = (p?: Record<string, unknown>) => string;
		type MessageMap = Record<string, MessageFn>;
		const msgMap = m as unknown as MessageMap;
		if (contentKey.includes(',')) {
			const keys = contentKey.split(',');
			const translated = keys.map((k) => {
				const fn = msgMap[k.trim()];
				return fn ? fn() : k;
			});
			return translated.join(', ');
		}
		const fn = msgMap[contentKey];
		return fn ? fn(contentParams) : content;
	});
</script>

<div class="flex items-end gap-2" class:flex-row-reverse={role === 'user'}>
	{#if role === 'karl'}
		<KarlAvatar size="sm" />
	{/if}

	<div class="bubble-wrapper" class:user={role === 'user'}>
		<div
			class="bubble"
			class:karl={role === 'karl'}
			class:user={role === 'user'}
		>
			{displayText}
		</div>

		{#if onEdit}
			<button onclick={onEdit} class="edit-btn" title="Ändern">
				<Pencil size={12} />
			</button>
		{/if}
	</div>
</div>

<style>
	.bubble-wrapper {
		position: relative;
		max-width: 85%;
	}

	@media (min-width: 768px) {
		.bubble-wrapper {
			max-width: 70%;
		}
	}

	/* modern theme (default) */
	.bubble {
		padding: 0.625rem 1rem;
		white-space: pre-line;
		border-radius: var(--radius-bubble);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
	}

	.bubble.karl {
		background-color: var(--color-erased);
		color: var(--color-pencil);
	}

	.bubble.user {
		background-color: var(--color-blue-pen);
		color: white;
	}

	/* handdrawn theme */
	:global(:root.theme-handdrawn) .bubble {
		border: 2px solid var(--color-pencil);
		box-shadow: var(--shadow-hard-sm);
	}

	:global(:root.theme-handdrawn) .bubble.karl {
		background-color: var(--color-paper);
	}

	:global(:root.theme-handdrawn) .bubble.user {
		background-color: var(--color-paper);
		color: var(--color-pencil);
	}

	.edit-btn {
		position: absolute;
		top: -0.5rem;
		right: -0.5rem;
		padding: 0.25rem;
		border-radius: 9999px;
		background-color: var(--color-paper);
		border: none;
		color: var(--color-pencil);
		opacity: 0;
		transition: opacity 150ms;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}

	.bubble-wrapper:hover .edit-btn {
		opacity: 0.6;
	}

	.edit-btn:hover {
		opacity: 1 !important;
		background-color: var(--color-blue-pen);
		color: white;
	}

	:global(:root.theme-handdrawn) .edit-btn {
		border: 1px solid var(--color-pencil);
	}
</style>
