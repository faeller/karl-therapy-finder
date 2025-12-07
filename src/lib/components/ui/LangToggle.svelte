<script lang="ts">
	import { setLocale, getLocale } from '$lib/paraglide/runtime';
</script>

<span class="lang-toggle">
	<button
		onclick={() => setLocale('de')}
		class:active={getLocale() === 'de'}
	>DE</button>
	<span class="separator">/</span>
	<button
		onclick={() => setLocale('en')}
		class:active={getLocale() === 'en'}
	>EN</button>
</span>

<style>
	.lang-toggle {
		display: flex;
		align-items: center;
		font-family: var(--font-body);
		font-size: 0.875rem;
	}
	.lang-toggle button {
		color: var(--color-pencil);
		opacity: 0.4;
		transition: opacity 150ms;
		padding: 0.25rem;
	}
	.lang-toggle button:hover {
		opacity: 0.7;
	}
	.lang-toggle button.active {
		opacity: 1;
		font-weight: bold;
	}
	.lang-toggle .separator {
		color: var(--color-pencil);
		opacity: 0.3;
	}
</style>
