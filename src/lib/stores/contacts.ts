// contacts store - wrapper around dataSession for backwards compatibility
import { derived, type Readable } from 'svelte/store';
import { dataSession } from './dataSession';
import { nanoid } from 'nanoid';
import type { ContactAttempt } from '$lib/types';

// waiting times that qualify for kostenerstattung
const QUALIFYING_WAIT_TIMES = ['3-6 Monate', '> 6 Monate'] as const;

interface ContactsStore extends Readable<ContactAttempt[]> {
	add: (contact: Omit<ContactAttempt, 'id' | 'contactDate'>) => void;
	addWithDate: (contact: Omit<ContactAttempt, 'id'>) => void;
	updateStatus: (id: string, status: ContactAttempt['status'], waitingTime?: string) => void;
	updateDate: (id: string, contactDate: string) => void;
	updateMethod: (id: string, method: ContactAttempt['method']) => void;
	remove: (id: string) => void;
	removeByTherapistId: (therapistId: string) => void;
	updateStatusByTherapistId: (therapistId: string, status: ContactAttempt['status']) => void;
	clear: () => void;
}

function createContactsStore(): ContactsStore {
	const derived$ = derived(dataSession, ($data) => $data.contacts);

	return {
		subscribe: derived$.subscribe,
		add: (contact: Omit<ContactAttempt, 'id' | 'contactDate'>) => {
			dataSession.updateContacts((contacts) => {
				// skip if therapist already in contacts
				if (contact.therapistId && contacts.some((c) => c.therapistId === contact.therapistId)) {
					return contacts;
				}
				return [
					...contacts,
					{
						...contact,
						id: nanoid(),
						contactDate: new Date().toISOString()
					} as ContactAttempt
				];
			});
		},
		addWithDate: (contact: Omit<ContactAttempt, 'id'>) => {
			dataSession.updateContacts((contacts) => [
				...contacts,
				{
					...contact,
					id: nanoid()
				} as ContactAttempt
			]);
		},
		updateStatus: (id: string, status: ContactAttempt['status'], waitingTime?: string) => {
			dataSession.updateContacts((contacts) =>
				contacts.map((c) =>
					c.id === id ? { ...c, status, waitingTime: waitingTime ?? c.waitingTime } : c
				)
			);
		},
		updateDate: (id: string, contactDate: string) => {
			dataSession.updateContacts((contacts) =>
				contacts.map((c) => (c.id === id ? { ...c, contactDate } : c))
			);
		},
		updateMethod: (id: string, method: ContactAttempt['method']) => {
			dataSession.updateContacts((contacts) =>
				contacts.map((c) => (c.id === id ? { ...c, method } : c))
			);
		},
		remove: (id: string) => {
			dataSession.updateContacts((contacts) => contacts.filter((c) => c.id !== id));
		},
		removeByTherapistId: (therapistId: string) => {
			dataSession.updateContacts((contacts) => contacts.filter((c) => c.therapistId !== therapistId));
		},
		updateStatusByTherapistId: (therapistId: string, status: ContactAttempt['status']) => {
			dataSession.updateContacts((contacts) =>
				contacts.map((c) => (c.therapistId === therapistId ? { ...c, status } : c))
			);
		},
		clear: () => {
			dataSession.updateContacts(() => []);
		}
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
