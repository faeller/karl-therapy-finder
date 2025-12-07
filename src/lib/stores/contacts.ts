import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { nanoid } from 'nanoid';
import type { ContactAttempt } from '$lib/types';

function createContactsStore() {
	const stored = browser ? localStorage.getItem('karl-contacts') : null;
	const initial: ContactAttempt[] = stored ? JSON.parse(stored) : [];
	const { subscribe, set, update } = writable<ContactAttempt[]>(initial);

	function persist(contacts: ContactAttempt[]) {
		if (browser) {
			localStorage.setItem('karl-contacts', JSON.stringify(contacts));
		}
	}

	return {
		subscribe,
		add: (contact: Omit<ContactAttempt, 'id' | 'contactDate'>) => {
			update((contacts) => {
				const newContact: ContactAttempt = {
					...contact,
					id: nanoid(),
					contactDate: new Date().toISOString()
				};
				const updated = [...contacts, newContact];
				persist(updated);
				return updated;
			});
		},
		updateStatus: (id: string, status: ContactAttempt['status'], waitingTime?: string) => {
			update((contacts) => {
				const updated = contacts.map((c) =>
					c.id === id ? { ...c, status, waitingTime: waitingTime ?? c.waitingTime } : c
				);
				persist(updated);
				return updated;
			});
		},
		remove: (id: string) => {
			update((contacts) => {
				const updated = contacts.filter((c) => c.id !== id);
				persist(updated);
				return updated;
			});
		},
		clear: () => {
			if (browser) {
				localStorage.removeItem('karl-contacts');
			}
			set([]);
		}
	};
}

export const contacts = createContactsStore();

// contacts qualifying for kostenerstattung (no reply or >3 month wait)
export const qualifyingContacts = derived(contacts, ($contacts) =>
	$contacts.filter(
		(c) =>
			c.status === 'no_reply' ||
			c.waitingTime === '3-6 Monate' ||
			c.waitingTime === '> 6 Monate'
	)
);
