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
			<div
				class="dropdown"
				style:border-radius={wobbly.sm}
				onclick={(e) => e.stopPropagation()}
			>
				<a href="/account" class="dropdown-item" onclick={closeDropdown}>
					<User size={16} />
					{m.auth_account()}
				</a>
				<a href="/auth/logout" class="dropdown-item logout" onclick={closeDropdown}>
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

	.dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 8px;
		background-color: var(--color-paper);
		border: 2px solid var(--color-pencil);
		box-shadow: var(--shadow-hard-sm);
		min-width: 150px;
		z-index: 50;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		font-family: var(--font-body);
		font-size: 1rem;
		color: var(--color-pencil);
		text-decoration: none;
		transition: background-color 100ms;
	}

	.dropdown-item:hover {
		background-color: var(--color-erased);
	}

	.dropdown-item.logout:hover {
		background-color: var(--color-red-marker);
		color: white;
	}
</style>
