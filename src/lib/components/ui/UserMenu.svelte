<script lang="ts">
	import { user } from '$lib/stores/user';
	import { User, LogOut, Settings } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';

	const isAdmin = $derived($user?.role === 'admin');

	let showDropdown = $state(false);
	let buttonRef: HTMLButtonElement | null = $state(null);
	let dropdownRef: HTMLDivElement | null = $state(null);
	let mounted = $state(false);
	let dropdownPos = $state({ top: 0, right: 0 });

	onMount(() => {
		mounted = true;
		return () => {
			if (dropdownRef?.parentNode === document.body) {
				document.body.removeChild(dropdownRef);
			}
		};
	});

	function updatePosition() {
		if (buttonRef) {
			const rect = buttonRef.getBoundingClientRect();
			dropdownPos = {
				top: rect.bottom + 8,
				right: window.innerWidth - rect.right
			};
		}
	}

	function toggleDropdown(e: MouseEvent) {
		e.stopPropagation();
		if (!showDropdown) {
			updatePosition();
		}
		showDropdown = !showDropdown;
	}

	function closeDropdown() {
		showDropdown = false;
	}

	// portal dropdown to body when shown
	$effect(() => {
		if (mounted && showDropdown && dropdownRef) {
			document.body.appendChild(dropdownRef);
		} else if (mounted && !showDropdown && dropdownRef?.parentNode === document.body) {
			document.body.removeChild(dropdownRef);
		}
	});
</script>

<svelte:window onclick={closeDropdown} />

<div class="user-menu">
	{#if $user}
		<button
			bind:this={buttonRef}
			onclick={toggleDropdown}
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
	{:else}
		<a
			href="/auth/patreon"
			class="login-btn"
			title={m.auth_login()}
		>
			<User size={14} strokeWidth={2.5} />
		</a>
	{/if}
</div>

<!-- dropdown portaled to body -->
{#if mounted}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		bind:this={dropdownRef}
		class="dropdown"
		class:visible={showDropdown}
		style:top="{dropdownPos.top}px"
		style:right="{dropdownPos.right}px"
		onclick={(e) => e.stopPropagation()}
		role="menu"
		tabindex="-1"
	>
		<a href="/account" class="dropdown-item" onclick={closeDropdown} role="menuitem">
			<User size={16} />
			{m.auth_account()}
		</a>
		{#if isAdmin}
			<a href="/admin" class="dropdown-item admin" onclick={closeDropdown} role="menuitem">
				<Settings size={16} />
				Admin
			</a>
		{/if}
		<a href="/auth/logout" class="dropdown-item logout" onclick={closeDropdown} role="menuitem">
			<LogOut size={16} />
			{m.auth_logout()}
		</a>
	</div>
{/if}

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
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 1.5px solid var(--color-pencil);
		color: var(--color-pencil);
		opacity: 0.5;
		transition: all 100ms;
	}

	.login-btn:hover {
		opacity: 1;
		color: var(--color-blue-pen);
		border-color: var(--color-blue-pen);
		transform: scale(1.1);
	}

	.avatar-btn {
		width: 24px;
		height: 24px;
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

	/* dropdown - portaled to body, positioned fixed */
	.dropdown {
		position: fixed;
		display: none;
		min-width: 160px;
		z-index: 99999;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.dropdown.visible {
		display: block;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		color: #1c1c1e;
		text-decoration: none;
		transition: background-color 100ms;
		cursor: pointer;
	}

	.dropdown-item:hover {
		background-color: #f5f5f5;
	}

	.dropdown-item.logout:hover {
		background-color: var(--color-red-marker);
		color: white;
	}

	.dropdown-item.admin {
		color: #007aff;
	}

	.dropdown-item.admin:hover {
		background-color: #007aff;
		color: white;
	}

	/* dark mode */
	:global(:root.dark) .dropdown {
		background: #2c2c2e;
		border-color: #3a3a3c;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	}

	:global(:root.dark) .dropdown-item {
		color: #ffffff;
	}

	:global(:root.dark) .dropdown-item:hover {
		background-color: #3a3a3c;
	}

	/* handdrawn theme */
	:global(:root.theme-handdrawn) .dropdown {
		background: var(--color-paper);
		border: 2px solid var(--color-pencil);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-hard-sm);
	}

	:global(:root.theme-handdrawn) .dropdown-item {
		color: var(--color-pencil);
	}

	:global(:root.theme-handdrawn) .dropdown-item:hover {
		background-color: var(--color-erased);
	}

	:global(:root.theme-handdrawn) .dropdown-item.admin {
		color: var(--color-blue-pen);
	}

	:global(:root.theme-handdrawn) .dropdown-item.admin:hover {
		background-color: var(--color-blue-pen);
		color: white;
	}

	:global(:root.theme-handdrawn) .dropdown-item.logout:hover {
		background-color: var(--color-red-marker);
		color: white;
	}
</style>
