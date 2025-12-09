import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { CampaignDraft } from '$lib/types';

const STORAGE_KEY = 'karl-campaign';

const defaultDraft: CampaignDraft = {
	forSelf: true,
	radiusKm: 15,
	therapyTypes: [],
	languages: ['de'],
	specialties: [],
	urgency: 'medium'
};

function getStored(): CampaignDraft {
	if (!browser) return defaultDraft;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return defaultDraft;
		const parsed = JSON.parse(stored);
		// merge with defaults, keeping all stored values
		return { ...defaultDraft, ...parsed };
	} catch {
		return defaultDraft;
	}
}

function saveToStorage(draft: CampaignDraft) {
	if (browser) {
		// only save defined values to prevent overwriting with undefined
		const toSave: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(draft)) {
			if (value !== undefined) {
				toSave[key] = value;
			}
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
	}
}

const store = writable<CampaignDraft>(getStored());

export const campaignDraft = {
	subscribe: store.subscribe,
	set: (value: CampaignDraft) => {
		saveToStorage(value);
		store.set(value);
	},
	update: (fn: (draft: CampaignDraft) => CampaignDraft) => {
		// ALWAYS start from stored data to prevent data loss
		const stored = getStored();
		const current = get(store);
		// merge: stored first, then current (preserves stored if current is missing values)
		const base = { ...stored };
		for (const [key, value] of Object.entries(current)) {
			if (value !== undefined && value !== null) {
				(base as Record<string, unknown>)[key] = value;
			}
		}
		const updated = fn(base);
		saveToStorage(updated);
		store.set(updated);
	},
	reset: () => {
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
		store.set(defaultDraft);
	},
	hydrate: () => {
		const stored = getStored();
		store.set(stored);
		return stored;
	}
};
