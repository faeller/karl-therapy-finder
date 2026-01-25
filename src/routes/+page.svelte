<script lang="ts">
	import { goto } from '$app/navigation';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import LangToggle from '$lib/components/ui/LangToggle.svelte';
	import UserMenu from '$lib/components/ui/UserMenu.svelte';
	import { theme, style } from '$lib/stores/theme';
	import { Sun, Moon, Pencil, Smartphone } from 'lucide-svelte';
	import PatreonIcon from '$lib/components/ui/PatreonIcon.svelte';
	import GithubIcon from '$lib/components/ui/GithubIcon.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="landing-page">
	<!-- controls -->
	<div class="controls">
		<LangToggle />
		<div class="icon-group">
			<UserMenu />
			<a
				href="https://www.patreon.com/karlhelps"
				target="_blank"
				rel="noopener noreferrer"
				class="icon-btn"
				title={m.support_patreon()}
			>
				<PatreonIcon size={16} />
			</a>
			<a
				href="https://github.com/faeller/karl-therapy-finder"
				target="_blank"
				rel="noopener noreferrer"
				class="icon-btn"
				title="GitHub"
			>
				<GithubIcon size={16} />
			</a>
			<button
				onclick={() => theme.toggleStyle()}
				class="icon-btn"
				title="Toggle theme style"
			>
				{#if $style === 'handdrawn'}
					<Smartphone size={18} strokeWidth={2.5} />
				{:else}
					<Pencil size={18} strokeWidth={2.5} />
				{/if}
			</button>
			<button
				onclick={() => theme.toggle()}
				class="icon-btn"
				title={m.chat_toggle_theme()}
			>
				{#if $theme.colorMode === 'dark'}
					<Sun size={18} strokeWidth={2.5} />
				{:else}
					<Moon size={18} strokeWidth={2.5} />
				{/if}
			</button>
		</div>
	</div>

	<div class="content">
		<!-- logo -->
		<div class="avatar-wrapper">
			<div class="md:hidden">
				<KarlAvatar size="lg" shadow="md" />
			</div>
			<div class="hidden md:block">
				<KarlAvatar size="xl" shadow="md" />
			</div>
		</div>

		<h1 class="title">{m.app_name()}</h1>
		<p class="tagline">
			{m.app_tagline()}
		</p>

		<div class="intro-card">
			<div class="tape"></div>
			<p class="intro-text">
				{m.landing_intro()}
			</p>
			<p class="intro-bold">
				{m.landing_intro_bold()}
			</p>
		</div>

		<button class="cta-button" onclick={() => goto('/chat')}>
			{m.landing_cta()}
		</button>

		<p class="privacy-note">
			{m.landing_privacy()}
		</p>

		<footer class="footer">
			<p class="copyright">&copy; 2025 Merle Fäller</p>
			<div class="footer-links">
				<a href="/impressum">Impressum</a>
				<a href="/datenschutz">Datenschutz</a>
			</div>
		</footer>
	</div>
</div>

<style>
	.landing-page {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 2rem 1rem;
	}

	.controls {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.icon-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 9999px;
		color: var(--color-pencil);
		opacity: 0.5;
		transition: all 200ms ease;
		background: transparent;
	}

	.icon-btn:hover {
		opacity: 1;
		background: rgba(128, 128, 128, 0.1);
	}

	.content {
		width: 100%;
		max-width: 28rem;
		text-align: center;
		margin-top: 2.5rem;
	}

	@media (min-width: 768px) {
		.content {
			margin-top: 0;
		}
	}

	.avatar-wrapper {
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: center;
	}

	.title {
		font-family: var(--font-brand);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-pencil);
		margin-bottom: 0.25rem;
	}

	@media (min-width: 768px) {
		.title {
			font-size: 2.75rem;
		}
	}

	.tagline {
		font-size: 1rem;
		color: var(--color-pencil);
		opacity: 0.6;
		margin-bottom: 2rem;
	}

	@media (min-width: 768px) {
		.tagline {
			font-size: 1.125rem;
			margin-bottom: 2.5rem;
		}
	}

	.intro-card {
		position: relative;
		background: var(--color-erased);
		border: 1px solid var(--color-card-border);
		border-radius: 1rem;
		padding: 1.25rem 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.tape {
		display: none;
	}

	@media (min-width: 768px) {
		.intro-card {
			padding: 1.5rem 1.75rem;
			margin-bottom: 2.5rem;
			border-radius: 1.25rem;
		}
	}

	.intro-text {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--color-pencil);
		margin-bottom: 0.75rem;
	}

	@media (min-width: 768px) {
		.intro-text {
			font-size: 1rem;
		}
	}

	.intro-bold {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-pencil);
	}

	@media (min-width: 768px) {
		.intro-bold {
			font-size: 1rem;
		}
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.875rem 2rem;
		font-size: 1.0625rem;
		font-weight: 500;
		color: white;
		background: linear-gradient(135deg, #007aff 0%, #0056d6 100%);
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 100ms;
		box-shadow: 0 4px 14px rgba(0, 122, 255, 0.25);
	}

	.cta-button:hover {
		background: linear-gradient(135deg, var(--color-red-marker) 0%, #c43030 100%);
		box-shadow: 0 4px 14px rgba(255, 59, 48, 0.3);
	}

	.cta-button:active {
		opacity: 0.8;
	}

	@media (min-width: 768px) {
		.cta-button {
			padding: 1rem 2.5rem;
			font-size: 1.125rem;
		}
	}

	.privacy-note {
		margin-top: 1.25rem;
		font-size: 0.8125rem;
		color: var(--color-pencil);
		opacity: 0.45;
	}

	@media (min-width: 768px) {
		.privacy-note {
			margin-top: 1.5rem;
			font-size: 0.875rem;
		}
	}

	.footer {
		margin-top: 2.5rem;
		text-align: center;
	}

	@media (min-width: 768px) {
		.footer {
			margin-top: 3.5rem;
		}
	}

	.copyright {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.35;
	}

	.footer-links {
		margin-top: 0.5rem;
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.footer-links a {
		font-size: 0.75rem;
		color: var(--color-pencil);
		opacity: 0.35;
		text-decoration: none;
		transition: opacity 200ms ease;
	}

	.footer-links a:hover {
		opacity: 0.7;
	}

	/* handdrawn theme */
	:global(:root.theme-handdrawn) .intro-card {
		background: var(--color-postit);
		border: 2px solid var(--color-pencil);
		border-radius: var(--radius-wobbly);
		box-shadow: var(--shadow-hard);
	}

	:global(:root.theme-handdrawn) .tape {
		display: block;
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%) rotate(-2deg);
		width: 80px;
		height: 24px;
		background-color: var(--color-pencil);
		opacity: 0.15;
	}

	:global(:root.theme-handdrawn) .cta-button {
		background: var(--color-paper);
		border: 3px solid var(--color-pencil);
		border-radius: var(--radius-button);
		color: var(--color-pencil);
		box-shadow: var(--shadow-hard);
		transition: all 100ms;
	}

	:global(:root.theme-handdrawn) .cta-button:hover {
		background: var(--color-red-marker);
		border-color: var(--color-red-marker);
		color: white;
		box-shadow: var(--shadow-hard-sm);
		transform: translate(2px, 2px);
	}

	:global(:root.theme-handdrawn) .cta-button:active {
		box-shadow: none;
		transform: translate(4px, 4px);
		opacity: 1;
	}
</style>
