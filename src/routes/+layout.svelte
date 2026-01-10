<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { user } from '$lib/stores/user';
	import { dataSession } from '$lib/stores/dataSession';
	import { syncOnLogin, setupAutoSync, resetSyncState } from '$lib/services/syncService';
	import { browser } from '$app/environment';
	import SyncConflictModal from '$lib/components/ui/SyncConflictModal.svelte';

	let { data, children } = $props();
	let previousUserId: string | null = null;

	// sync user from server to client store
	$effect(() => {
		const currentUserId = data.user?.id ?? null;

		// detect logout → restore anonymous data if it was backed up
		if (browser && previousUserId && !currentUserId) {
			dataSession.restoreAnonymousData();
			resetSyncState();
		}

		// detect login with sync enabled → fetch and apply server data
		if (browser && !previousUserId && currentUserId && data.user?.syncEnabled) {
			syncOnLogin();
			setupAutoSync();
		}

		previousUserId = currentUserId;
		user.set(data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>KARL - Therapieplatz finden</title>
	<meta name="description" content="KARL hilft dir, einen Therapieplatz zu finden" />
</svelte:head>

{@render children()}

<SyncConflictModal />
