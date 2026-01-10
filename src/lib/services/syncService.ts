// client-side sync service
import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { dataSession, type AppData } from '$lib/stores/dataSession';
import { user } from '$lib/stores/user';

export interface SyncData {
	campaign: AppData['campaign'] | null;
	contacts: AppData['contacts'] | null;
	chatState: AppData['chatState'] | null;
	chatMessages: AppData['chatMessages'] | null;
	updatedAt: string | null;
}

export interface SyncConflict {
	serverData: SyncData;
	serverUpdatedAt: string;
	localData: AppData;
}

let syncInProgress = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncedAt: string | null = null;
let suppressNextSync = false; // prevent sync after applying server data
let consecutiveFailures = 0;

// conflict store for UI to react to
export const syncConflict = writable<SyncConflict | null>(null);

const DEBOUNCE_MS = 2000;
const MAX_BACKOFF_MS = 60000; // cap at 1 minute

export async function fetchSyncedData(): Promise<SyncData | null> {
	if (!browser) return null;

	try {
		const res = await fetch('/api/sync');
		if (!res.ok) {
			if (res.status === 403) return null;
			throw new Error(`Sync fetch failed: ${res.status}`);
		}
		const data = await res.json() as SyncData;
		// track server timestamp for conflict detection
		if (data.updatedAt) {
			lastSyncedAt = data.updatedAt;
		}
		return data;
	} catch (e) {
		console.error('[sync] fetch failed:', e);
		return null;
	}
}

export async function uploadSyncedData(force = false): Promise<boolean> {
	if (!browser || syncInProgress) return false;

	const currentUser = get(user);
	if (!currentUser?.syncEnabled) return false;

	syncInProgress = true;

	try {
		const data = dataSession.getDataForSync();

		const res = await fetch('/api/sync', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				campaign: data.campaign,
				contacts: data.contacts,
				chatState: data.chatState,
				chatMessages: data.chatMessages,
				version: data.version,
				lastSyncedAt: lastSyncedAt,
				force
			})
		});

		if (res.status === 409) {
			// conflict detected
			const conflictData = await res.json() as { serverData: SyncData; serverUpdatedAt: string };
			syncConflict.set({
				serverData: conflictData.serverData,
				serverUpdatedAt: conflictData.serverUpdatedAt,
				localData: data
			});
			return false;
		}

		if (!res.ok) throw new Error(`Sync upload failed: ${res.status}`);

		const result = await res.json() as { updatedAt: string };
		lastSyncedAt = result.updatedAt;
		return true;
	} catch (e) {
		console.error('[sync] upload failed:', e);
		return false;
	} finally {
		syncInProgress = false;
	}
}

// resolve conflict by choosing local or server data
export async function resolveConflict(useServer: boolean): Promise<void> {
	const conflict = get(syncConflict);
	if (!conflict) return;

	if (useServer) {
		// suppress the sync that applyServerData will trigger
		suppressNextSync = true;
		dataSession.applyServerData({
			campaign: conflict.serverData.campaign ?? undefined,
			contacts: conflict.serverData.contacts ?? undefined,
			chatState: conflict.serverData.chatState ?? undefined,
			chatMessages: conflict.serverData.chatMessages ?? undefined
		});
		lastSyncedAt = conflict.serverUpdatedAt;
	} else {
		// force upload local data
		await uploadSyncedData(true);
	}

	syncConflict.set(null);
}

export function scheduleSyncUpload(): void {
	if (!browser) return;

	// skip if we just applied server data
	if (suppressNextSync) {
		suppressNextSync = false;
		return;
	}

	const currentUser = get(user);
	if (!currentUser?.syncEnabled) return;

	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => uploadSyncedData(), DEBOUNCE_MS);
}

// sync on login - fetch server data and apply it
export async function syncOnLogin(): Promise<void> {
	if (!browser) return;

	const serverData = await fetchSyncedData();

	if (serverData) {
		// suppress the sync that applyServerData will trigger
		suppressNextSync = true;
		dataSession.applyServerData({
			campaign: serverData.campaign ?? undefined,
			contacts: serverData.contacts ?? undefined,
			chatState: serverData.chatState ?? undefined,
			chatMessages: serverData.chatMessages ?? undefined
		});
		// lastSyncedAt is already set by fetchSyncedData
	}
}

// reset sync state on logout
export function resetSyncState(): void {
	lastSyncedAt = null;
	syncConflict.set(null);
	teardownAutoSync();
}

// initial sync after enabling - uploads local data
export async function initialSync(): Promise<boolean> {
	return uploadSyncedData();
}

// setup auto-sync on data changes
let unsubscribe: (() => void) | null = null;
let isFirstCallback = true;

export function setupAutoSync(): void {
	if (!browser || unsubscribe) return;

	isFirstCallback = true;
	unsubscribe = dataSession.subscribe(() => {
		// skip the initial callback that fires immediately on subscribe
		if (isFirstCallback) {
			isFirstCallback = false;
			return;
		}
		const currentUser = get(user);
		if (currentUser?.syncEnabled) {
			scheduleSyncUpload();
		}
	});
}

export function teardownAutoSync(): void {
	if (unsubscribe) {
		unsubscribe();
		unsubscribe = null;
	}
}
