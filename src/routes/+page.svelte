<script lang="ts">
	import { goto } from '$app/navigation';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import LangToggle from '$lib/components/ui/LangToggle.svelte';
	import { theme } from '$lib/stores/theme';
	import { Sun, Moon } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
	<!-- controls -->
	<div class="controls">
		<LangToggle />
		<button
			onclick={() => theme.toggle()}
			class="icon-btn"
			title={m.chat_toggle_theme()}
		>
			{#if $theme === 'dark'}
				<Sun size={20} strokeWidth={2.5} />
			{:else}
				<Moon size={20} strokeWidth={2.5} />
			{/if}
		</button>
	</div>

	<div class="w-full max-w-md text-center">
		<!-- logo -->
		<div class="mb-6 flex justify-center">
			<KarlAvatar size="xl" shadow="md" />
		</div>

		<h1 class="mb-2 font-heading text-4xl font-bold md:text-5xl">{m.app_name()}</h1>
		<p class="mb-8 text-lg text-pencil/70 md:text-xl">
			{m.app_tagline()}
		</p>

		<WobblyCard decoration="tape" class="mb-8 text-left">
			<p class="mb-4">
				{m.landing_intro()}
			</p>
			<p class="font-bold">
				{m.landing_intro_bold()}
			</p>
		</WobblyCard>

		<WobblyButton size="lg" onclick={() => goto('/chat')}>
			{m.landing_cta()}
		</WobblyButton>

		<p class="mt-6 text-sm text-pencil/50">
			{m.landing_privacy()}
		</p>
	</div>
</div>

<style>
	.controls {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.icon-btn {
		padding: 0.5rem;
		border-radius: 9999px;
		color: var(--color-pencil);
		opacity: 0.5;
		transition: opacity 150ms;
	}
	.icon-btn:hover {
		opacity: 1;
		color: var(--color-blue-pen);
	}
</style>
