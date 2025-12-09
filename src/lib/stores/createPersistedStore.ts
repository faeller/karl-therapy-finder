// generic persisted store factory - eliminates localStorage boilerplate
import { writable, get, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PersistedStore<T> extends Writable<T> {
	reset: () => void;
	hydrate: () => T;
}

export function createPersistedStore<T>(
	key: string,
	defaultValue: T,
	options?: {
		// custom serializer for complex types
		serialize?: (value: T) => string;
		deserialize?: (stored: string) => T;
		// merge function for partial updates (default: shallow merge for objects)
		merge?: (stored: T, current: T) => T;
	}
): PersistedStore<T> {
	const serialize = options?.serialize ?? JSON.stringify;
	const deserialize = options?.deserialize ?? JSON.parse;

	function load(): T {
		if (!browser) return defaultValue;
		try {
			const stored = localStorage.getItem(key);
			if (!stored) return defaultValue;
			const parsed = deserialize(stored);
			// shallow merge for objects to preserve new default fields
			if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
				return { ...defaultValue, ...parsed };
			}
			return parsed;
		} catch {
			return defaultValue;
		}
	}

	function save(value: T): void {
		if (!browser) return;
		try {
			localStorage.setItem(key, serialize(value));
		} catch {
			// quota exceeded or other storage error - fail silently
		}
	}

	const store = writable<T>(load());

	// auto-persist on change
	store.subscribe((value) => save(value));

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		reset: () => {
			if (browser) localStorage.removeItem(key);
			store.set(defaultValue);
		},
		hydrate: () => {
			const value = load();
			store.set(value);
			return value;
		}
	};
}

// specialized version for arrays with add/remove helpers
export interface PersistedArrayStore<T> extends PersistedStore<T[]> {
	add: (item: T) => void;
	remove: (predicate: (item: T) => boolean) => void;
	updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
	clear: () => void;
}

export function createPersistedArrayStore<T>(
	key: string,
	defaultValue: T[] = []
): PersistedArrayStore<T> {
	const base = createPersistedStore<T[]>(key, defaultValue);

	return {
		...base,
		add: (item: T) => base.update((items) => [...items, item]),
		remove: (predicate: (item: T) => boolean) =>
			base.update((items) => items.filter((item) => !predicate(item))),
		updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) =>
			base.update((items) => items.map((item) => (predicate(item) ? updater(item) : item))),
		clear: () => base.reset()
	};
}
