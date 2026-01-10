// data session management - handles anonymous + logged-in sessions
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { nanoid } from 'nanoid';
import type { CampaignDraft, ContactAttempt, ChatState, ChatMessage } from '$lib/types';

const STORAGE_KEY = 'karl_data';
const ANON_BACKUP_KEY = 'karl_anon_backup';

export interface AppData {
	campaign: CampaignDraft;
	contacts: ContactAttempt[];
	chatState: ChatState;
	chatMessages: ChatMessage[];
	version: number;
	updatedAt: string;
}

const defaultCampaign: CampaignDraft = {
	forSelf: true,
	radiusKm: 15,
	therapyTypes: [],
	languages: ['de'],
	specialties: [],
	urgency: 'medium'
};

function createEmptyData(): AppData {
	return {
		campaign: { ...defaultCampaign },
		contacts: [],
		chatState: 'greeting',
		chatMessages: [],
		version: 1,
		updatedAt: new Date().toISOString()
	};
}

function loadData(): AppData {
	if (!browser) return createEmptyData();

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...createEmptyData(), ...parsed };
		}
	} catch { /* ignore */ }

	// migrate from old formats
	const migrated = migrateOldStorage();
	if (migrated) {
		saveData(migrated);
		return migrated;
	}

	return createEmptyData();
}

function migrateOldStorage(): AppData | null {
	if (!browser) return null;

	const oldCampaign = localStorage.getItem('karl_campaign');
	const oldContacts = localStorage.getItem('karl_contacts');
	const oldChatState = localStorage.getItem('karl_chatState');
	const oldChatMessages = localStorage.getItem('karl_chatMessages');
	const oldSessions = localStorage.getItem('karl_sessions');

	if (!oldCampaign && !oldContacts && !oldChatState && !oldChatMessages && !oldSessions) {
		return null;
	}

	// migrate from session-based format
	if (oldSessions) {
		try {
			const sessions = JSON.parse(oldSessions);
			const activeSession = sessions.sessions?.[sessions.activeGuid];
			if (activeSession) {
				localStorage.removeItem('karl_sessions');
				return {
					campaign: activeSession.campaign ?? { ...defaultCampaign },
					contacts: activeSession.contacts ?? [],
					chatState: activeSession.chatState ?? 'greeting',
					chatMessages: activeSession.chatMessages ?? [],
					version: activeSession.version ?? 1,
					updatedAt: new Date().toISOString()
				};
			}
		} catch { /* ignore */ }
	}

	const data: AppData = {
		campaign: oldCampaign ? { ...defaultCampaign, ...JSON.parse(oldCampaign) } : { ...defaultCampaign },
		contacts: oldContacts ? JSON.parse(oldContacts) : [],
		chatState: (oldChatState as ChatState) || 'greeting',
		chatMessages: oldChatMessages ? JSON.parse(oldChatMessages) : [],
		version: 1,
		updatedAt: new Date().toISOString()
	};

	localStorage.removeItem('karl_campaign');
	localStorage.removeItem('karl_contacts');
	localStorage.removeItem('karl_chatState');
	localStorage.removeItem('karl_chatMessages');
	localStorage.removeItem('karl_sessions');

	return data;
}

function saveData(data: AppData): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch { /* quota exceeded */ }
}

// the store
const store = writable<AppData>(loadData());

// auto-persist
store.subscribe((value) => {
	if (browser) saveData(value);
});

// public API
export const dataSession = {
	subscribe: store.subscribe,

	getData(): AppData {
		return get(store);
	},

	updateCampaign(updater: (c: CampaignDraft) => CampaignDraft): void {
		store.update((data) => ({
			...data,
			campaign: updater(data.campaign),
			version: data.version + 1,
			updatedAt: new Date().toISOString()
		}));
	},

	updateContacts(updater: (c: ContactAttempt[]) => ContactAttempt[]): void {
		store.update((data) => ({
			...data,
			contacts: updater(data.contacts),
			version: data.version + 1,
			updatedAt: new Date().toISOString()
		}));
	},

	updateChatState(newState: ChatState): void {
		store.update((data) => ({
			...data,
			chatState: newState,
			version: data.version + 1,
			updatedAt: new Date().toISOString()
		}));
	},

	updateChatMessages(updater: (m: ChatMessage[]) => ChatMessage[]): void {
		store.update((data) => ({
			...data,
			chatMessages: updater(data.chatMessages),
			version: data.version + 1,
			updatedAt: new Date().toISOString()
		}));
	},

	// backup current anonymous data before switching to synced user data
	backupAnonymousData(): void {
		if (!browser) return;
		const current = get(store);
		// only backup if there's meaningful data
		if (current.chatMessages.length > 0 || current.contacts.length > 0 || current.campaign.plz) {
			try {
				localStorage.setItem(ANON_BACKUP_KEY, JSON.stringify(current));
			} catch { /* ignore */ }
		}
	},

	// restore anonymous data on logout (if backup exists)
	restoreAnonymousData(): void {
		if (!browser) return;
		try {
			const backup = localStorage.getItem(ANON_BACKUP_KEY);
			if (backup) {
				const data = JSON.parse(backup);
				store.set({ ...createEmptyData(), ...data });
				localStorage.removeItem(ANON_BACKUP_KEY);
			}
		} catch { /* ignore */ }
	},

	// apply server data (on login with sync)
	applyServerData(serverData: Partial<AppData>): void {
		// backup anonymous data first
		this.backupAnonymousData();

		store.update((data) => ({
			...data,
			campaign: serverData.campaign ?? data.campaign,
			contacts: serverData.contacts ?? data.contacts,
			chatState: serverData.chatState ?? data.chatState,
			chatMessages: serverData.chatMessages ?? data.chatMessages,
			version: serverData.version ?? data.version,
			updatedAt: new Date().toISOString()
		}));
	},

	// get data for sync upload
	getDataForSync(): AppData {
		return get(store);
	},

	// reset to empty state
	reset(): void {
		store.set(createEmptyData());
	}
};
