// debug mode store for testing auto-call
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface DebugState {
	enabled: boolean;
	testPhone: string;
	callbackPhone: string;
}

const STORAGE_KEY = 'karl_debug';

function createDebugStore() {
	const initial: DebugState = { enabled: false, testPhone: '', callbackPhone: '' };

	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				Object.assign(initial, JSON.parse(stored));
			}
		} catch {}
	}

	const { subscribe, set, update } = writable<DebugState>(initial);

	return {
		subscribe,
		setEnabled(enabled: boolean) {
			update((s) => {
				const next = { ...s, enabled };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
				return next;
			});
		},
		setTestPhone(testPhone: string) {
			update((s) => {
				const next = { ...s, testPhone };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
				return next;
			});
		},
		setCallbackPhone(callbackPhone: string) {
			update((s) => {
				const next = { ...s, callbackPhone };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
				return next;
			});
		}
	};
}

export const debug = createDebugStore();

// debug therapist id constant
export const DEBUG_THERAPIST_ID = 'debug-test-therapist';
