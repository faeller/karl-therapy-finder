import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
	if (!browser) return 'light';
	const stored = localStorage.getItem('karl-theme') as Theme;
	if (stored) return stored;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const { subscribe, set } = writable<Theme>('light');

if (browser) {
	set(getInitialTheme());
	// apply class to html
	const unsubscribe = subscribe((theme) => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		localStorage.setItem('karl-theme', theme);
	});
}

export const theme = {
	subscribe,
	toggle: () => {
		let current: Theme = 'light';
		subscribe((t) => (current = t))();
		set(current === 'light' ? 'dark' : 'light');
	},
	set
};
