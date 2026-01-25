<script lang="ts">
	import { user } from '$lib/stores/user';
	import { User, LogOut } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { wobbly } from '$lib/utils/wobbly';

	let showDropdown = $state(false);

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function closeDropdown() {
		showDropdown = false;
	}
</script>

<svelte:window onclick={closeDropdown} />

<div class="user-menu">
	{#if $user}
		<button
			onclick={(e) => { e.stopPropagation(); toggleDropdown(); }}
			class="avatar-btn"
			title={$user.username}
		>
			{#if $user.avatarUrl}
				<img src={$user.avatarUrl} alt={$user.username} class="avatar-img" />
			{:else}
				<div class="avatar-fallback">
					{$user.username.charAt(0).toUpperCase()}
				</div>
			{/if}
		</button>
		{#if showDropdown}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div
				class="dropdown"
				style:border-radius={wobbly.sm}
				onclick={(e) => e.stopPropagation()}
				role="menu"
				tabindex="-1"
			>
				<a href="/account" class="dropdown-item" onclick={closeDropdown} role="menuitem">
					<User size={16} />
					{m.auth_account()}
				</a>
				<a href="/auth/logout" class="dropdown-item logout" onclick={closeDropdown} role="menuitem">
					<LogOut size={16} />
					{m.auth_logout()}
				</a>
			</div>
		{/if}
	{:else}
		<a
			href="/auth/patreon"
			class="login-btn"
			title={m.auth_login()}
		>
			<User size={18} strokeWidth={2.5} />
		</a>
	{/if}
</div>

<style>
	.user-menu {
		position: relative;
		display: flex;
		align-items: center;
	}

	.login-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-pencil);
		opacity: 0.5;
		transition: opacity 150ms;
	}

	.login-btn:hover {
		opacity: 1;
		color: var(--color-blue-pen);
	}

	.avatar-btn {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		overflow: hidden;
		border: 1.5px solid var(--color-pencil);
		cursor: pointer;
		transition: transform 100ms;
	}

	.avatar-btn:hover {
		transform: scale(1.1);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(100%);
	}

	.avatar-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-blue-pen);
		color: white;
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 700;
	}

	/* modern theme (default) */
	.dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 8px;
		background-color: var(--color-erased);
		border: 1px solid var(--color-card-border);
		border-radius: 12px;
		min-width: 160px;
		z-index: 50;
		overflow: hidden;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		font-family: var(--font-body);
		font-size: 1rem;
		color: var(--color-pencil);
		text-decoration: none;
		transition: background-color 100ms;
	}

	.dropdown-item:hover {
		background-color: var(--color-paper);
	}

	.dropdown-item.logout:hover {
		background-color: var(--color-red-marker);
		color: white;
	}

	/* handdrawn theme */
	:global(:root.theme-handdrawn) .dropdown {
		background-color: var(--color-paper);
		border: 2px solid var(--color-pencil);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-hard-sm);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	:global(:root.theme-handdrawn) .dropdown-item:hover {
		background-color: var(--color-erased);
	}
</style>
