<script lang="ts">
	import { goto } from '$app/navigation';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import { wobbly } from '$lib/utils/wobbly';
	import { theme } from '$lib/stores/theme';
	import { Sun, Moon } from 'lucide-svelte';
</script>

<div class="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
	<!-- theme toggle -->
	<button
		onclick={() => theme.toggle()}
		class="theme-toggle"
		title="Design wechseln"
	>
		{#if $theme === 'dark'}
			<Sun size={20} strokeWidth={2.5} />
		{:else}
			<Moon size={20} strokeWidth={2.5} />
		{/if}
	</button>

	<div class="w-full max-w-md text-center">
		<!-- logo -->
		<div class="mb-6 flex justify-center">
			<KarlAvatar size="xl" shadow="md" />
		</div>

		<h1 class="mb-2 font-heading text-4xl font-bold md:text-5xl">KARL</h1>
		<p class="mb-8 text-lg text-pencil/70 md:text-xl">
			Therapieplatz finden, ohne verrückt zu werden
		</p>

		<WobblyCard decoration="tape" class="mb-8 text-left">
			<p class="mb-4">
				Du brauchst einen Therapieplatz, aber 30 Praxen abtelefonieren fühlt sich gerade unmöglich an?
			</p>
			<p class="font-bold">
				KARL hilft dir dabei - Schritt für Schritt, in deinem Tempo.
			</p>
		</WobblyCard>

		<WobblyButton size="lg" onclick={() => goto('/chat')}>
			Los geht's
		</WobblyButton>

		<p class="mt-6 text-sm text-pencil/50">
			Keine Anmeldung nötig. Deine Daten bleiben auf deinem Gerät.
		</p>
	</div>
</div>

<style>
	.theme-toggle {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.5rem;
		border-radius: 9999px;
		color: var(--color-pencil);
		opacity: 0.5;
		transition: opacity 150ms;
	}
	.theme-toggle:hover {
		opacity: 1;
		color: var(--color-blue-pen);
	}
</style>
