import { derived } from 'svelte/store';
import { createPersistedArrayStore } from './createPersistedStore';
import { STORAGE_KEYS } from '$lib/constants';
import { nanoid } from 'nanoid';
import type { ContactAttempt } from '$lib/types';

// waiting times that qualify for kostenerstattung
const QUALIFYING_WAIT_TIMES = ['3-6 Monate', '> 6 Monate'] as const;

function createContactsStore() {
	const base = createPersistedArrayStore<ContactAttempt>(STORAGE_KEYS.contacts);

	return {
		subscribe: base.subscribe,
		add: (contact: Omit<ContactAttempt, 'id' | 'contactDate'>) => {
			base.add({
				...contact,
				id: nanoid(),
				contactDate: new Date().toISOString()
			} as ContactAttempt);
		},
		updateStatus: (id: string, status: ContactAttempt['status'], waitingTime?: string) => {
			base.updateItem(
				(c) => c.id === id,
				(c) => ({ ...c, status, waitingTime: waitingTime ?? c.waitingTime })
			);
		},
		remove: (id: string) => base.remove((c) => c.id === id),
		removeByTherapistId: (therapistId: string) => base.remove((c) => c.therapistId === therapistId),
		updateStatusByTherapistId: (therapistId: string, status: ContactAttempt['status']) => {
			base.updateItem(
				(c) => c.therapistId === therapistId,
				(c) => ({ ...c, status })
			);
		},
		clear: base.clear
	};
}

export const contacts = createContactsStore();

// contacts qualifying for kostenerstattung (no reply or long wait)
export const qualifyingContacts = derived(contacts, ($contacts) =>
	$contacts.filter(
		(c) =>
			c.status === 'no_reply' ||
			(QUALIFYING_WAIT_TIMES as readonly string[]).includes(c.waitingTime ?? '')
	)
);
