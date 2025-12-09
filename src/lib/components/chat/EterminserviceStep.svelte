<script lang="ts">
	import { wobbly } from '$lib/utils/wobbly';
	import { Phone, ExternalLink, Check, HelpCircle, PhoneCall, AlertCircle } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { t } from '$lib/i18n';
	import { campaignDraft } from '$lib/stores/campaign';
	import type { ChatOption } from '$lib/types';
	import { OptionId } from '$lib/data/optionIds';
	import MessageBubble from './MessageBubble.svelte';

	interface Props {
		options: ChatOption[];
		onSelect: (option: ChatOption) => void;
		lateCompletion?: boolean;
	}

	let { options, onSelect, lateCompletion = false }: Props = $props();

	function handleDone() {
		if (lateCompletion) {
			campaignDraft.update((d) => ({ ...d, terminserviceStatus: 'done' }));
		} else if (continueOption) {
			onSelect(continueOption);
		}
	}

	function handleSkip() {
		if (lateCompletion) {
			campaignDraft.update((d) => ({ ...d, terminserviceStatus: 'skipped' }));
		} else if (skipOption) {
			onSelect(skipOption);
		}
	}

	const availableRegions = ['10', '12', '13', '14', '20', '21', '22', '80', '81', '85', '50', '51', '60', '65', '70'];
	const plzPrefix = $derived($campaignDraft.plz?.substring(0, 2) ?? '');
	const onlineAvailable = $derived(availableRegions.includes(plzPrefix));

	type Step = 'intro' | 'explain' | 'phone' | 'online';
	let currentStep = $state<Step>('intro');

	const continueOption = $derived(options.find((o) => o.id === OptionId.terminserviceDone));
	const skipOption = $derived(options.find((o) => o.id === OptionId.terminserviceSkip));
</script>

<div class="space-y-4">
	<!-- intro -->
	{#if currentStep === 'intro'}
		<MessageBubble role="karl" content={m.terminservice_intro_message()} />

		<!-- plz availability info -->
		<div class="flex justify-center mb-2">
			{#if onlineAvailable}
				<span class="availability-badge available">
					<Check size={14} />
					{m.terminservice_plz_online_available({ plz: $campaignDraft.plz ?? '' })}
				</span>
			{:else}
				<span class="availability-badge unavailable">
					<AlertCircle size={14} />
					{m.terminservice_plz_online_unavailable({ plz: $campaignDraft.plz ?? '' })}
				</span>
			{/if}
		</div>

		<div class="flex flex-wrap justify-center gap-3 px-2">
			<button
				onclick={() => (currentStep = 'phone')}
				class="option-btn"
				class:recommended={!onlineAvailable}
				style:border-radius={wobbly.button}
			>
				<Phone size={16} class="mr-1" />
				{m.terminservice_choice_phone()}
			</button>

			<button
				onclick={() => (currentStep = 'online')}
				class="option-btn"
				class:recommended={onlineAvailable}
				style:border-radius={wobbly.button}
			>
				<ExternalLink size={16} class="mr-1" />
				{m.terminservice_choice_online()}
			</button>

			<button
				onclick={() => (currentStep = 'explain')}
				class="option-btn secondary"
				style:border-radius={wobbly.button}
			>
				<HelpCircle size={16} class="mr-1" />
				{m.terminservice_explain_why()}
			</button>

			<button
				disabled
				class="option-btn disabled"
				style:border-radius={wobbly.button}
			>
				<PhoneCall size={16} class="mr-1" />
				{m.terminservice_call_for_me()}
			</button>
		</div>

		<!-- skip option always visible -->
		{#if skipOption}
			<div class="flex justify-center mt-2">
				<button
					onclick={handleSkip}
					class="skip-link"
				>
					{t(`option_${skipOption.id}`, skipOption.labelDe)} →
				</button>
			</div>
		{/if}
	{/if}

	<!-- explain why -->
	{#if currentStep === 'explain'}
		<MessageBubble role="karl" content={m.terminservice_explanation()} />

		<div class="flex justify-center">
			<button
				onclick={() => (currentStep = 'intro')}
				class="back-link"
			>
				← {m.terminservice_back_to_options()}
			</button>
		</div>
	{/if}

	<!-- phone flow -->
	{#if currentStep === 'phone'}
		<MessageBubble role="user" content={m.terminservice_choice_phone()} />
		<MessageBubble role="karl" content={m.terminservice_phone_how()} />

		<div class="flow-content">
			<a
				href="tel:116117"
				class="action-btn phone"
				style:border-radius={wobbly.button}
			>
				<Phone size={18} />
				116 117 {m.terminservice_call()}
			</a>

			<div class="tip-box" style:border-radius={wobbly.sm}>
				<strong>{m.terminservice_tip_label()}</strong> {m.terminservice_phone_tip()}
			</div>

			<div class="flex flex-wrap justify-center gap-3">
				{#if continueOption}
					<button
						onclick={handleDone}
						class="option-btn"
						style:border-radius={wobbly.button}
					>
						<Check size={16} class="mr-1" />
						{m.terminservice_done()}
					</button>
				{/if}
				<button
					onclick={() => { currentStep = 'intro'; }}
					class="back-link"
				>
					← {m.terminservice_try_other()}
				</button>
			</div>
		</div>
	{/if}

	<!-- online flow -->
	{#if currentStep === 'online'}
		<MessageBubble role="user" content={m.terminservice_choice_online()} />

		{#if !onlineAvailable}
			<MessageBubble role="karl" content={m.terminservice_online_unavailable_detail({ plz: $campaignDraft.plz ?? '' })} />
		{:else}
			<MessageBubble role="karl" content={m.terminservice_online_how()} />
		{/if}

		<div class="flow-content">
			<a
				href="https://eterminservice.de/terminservice"
				target="_blank"
				rel="noopener noreferrer"
				class="action-btn online"
				style:border-radius={wobbly.button}
			>
				<ExternalLink size={18} />
				eterminservice.de {m.terminservice_open()}
			</a>

			<div class="tip-box" style:border-radius={wobbly.sm}>
				<strong>{m.terminservice_tip_label()}</strong> {m.terminservice_online_tip()}
			</div>

			<div class="flex flex-wrap justify-center gap-3">
				{#if continueOption}
					<button
						onclick={handleDone}
						class="option-btn"
						style:border-radius={wobbly.button}
					>
						<Check size={16} class="mr-1" />
						{m.terminservice_done()}
					</button>
				{/if}
				<button
					onclick={() => { currentStep = 'intro'; }}
					class="back-link"
				>
					← {m.terminservice_try_other()}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* option-btn styles in app.css */

	.flow-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.availability-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
	}

	.availability-badge.available {
		background-color: rgba(45, 93, 161, 0.15);
		color: var(--color-blue-pen);
	}

	.availability-badge.unavailable {
		background-color: rgba(255, 77, 77, 0.15);
		color: var(--color-red-marker);
	}

	.skip-link {
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.5;
		transition: opacity 100ms;
	}

	.skip-link:hover {
		opacity: 0.8;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: 2px solid var(--color-blue-pen);
		background-color: var(--color-blue-pen);
		color: white;
		font-family: var(--font-body);
		font-size: 1rem;
		transition: all 100ms;
		box-shadow: var(--shadow-hard-sm);
	}

	.action-btn:hover {
		background-color: var(--color-red-marker);
		border-color: var(--color-red-marker);
	}

	.tip-box {
		padding: 0.75rem 1rem;
		background-color: var(--color-postit);
		border: 1px solid var(--color-pencil);
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.back-link {
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.6;
	}

	.back-link:hover {
		opacity: 1;
	}
</style>
