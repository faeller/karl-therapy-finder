import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

type ColorMode = 'light' | 'dark';
type Style = 'handdrawn' | 'imessage';

interface ThemeState {
	colorMode: ColorMode;
	style: Style;
}

const STORAGE_KEY = 'karl-theme';

function getInitialState(): ThemeState {
	if (!browser) return { colorMode: 'light', style: 'handdrawn' };

	const stored = localStorage.getItem(STORAGE_KEY);

	if (stored) {
		// backward compat: old format was just 'light' or 'dark'
		if (stored === 'light' || stored === 'dark') {
			return { colorMode: stored, style: 'handdrawn' };
		}
		try {
			const parsed = JSON.parse(stored) as Partial<ThemeState>;
			return {
				colorMode: parsed.colorMode ?? 'light',
				style: parsed.style ?? 'handdrawn'
			};
		} catch {
			// corrupted storage
		}
	}

	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	return { colorMode: prefersDark ? 'dark' : 'light', style: 'handdrawn' };
}

const store = writable<ThemeState>({ colorMode: 'light', style: 'handdrawn' });

if (browser) {
	store.set(getInitialState());

	store.subscribe((state) => {
		const html = document.documentElement;
		html.classList.toggle('dark', state.colorMode === 'dark');
		html.classList.remove('theme-handdrawn', 'theme-imessage');
		html.classList.add(`theme-${state.style}`);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	});
}

export const colorMode = derived(store, ($s) => $s.colorMode);
export const style = derived(store, ($s) => $s.style);

export const theme = {
	subscribe: store.subscribe,

	toggleColorMode: () => {
		store.update((s) => ({
			...s,
			colorMode: s.colorMode === 'light' ? 'dark' : 'light'
		}));
	},

	setStyle: (newStyle: Style) => {
		store.update((s) => ({ ...s, style: newStyle }));
	},

	toggleStyle: () => {
		store.update((s) => ({
			...s,
			style: s.style === 'handdrawn' ? 'imessage' : 'handdrawn'
		}));
	},

	// backward compat alias
	toggle: () => {
		store.update((s) => ({
			...s,
			colorMode: s.colorMode === 'light' ? 'dark' : 'light'
		}));
	},

	set: store.set
};
