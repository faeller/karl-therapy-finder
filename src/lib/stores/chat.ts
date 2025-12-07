import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { nanoid } from 'nanoid';
import type { ChatState, ChatMessage, ChatOption, Therapist, EditableField } from '$lib/types';
import { campaignDraft } from './campaign';
import { mockTherapists, filterTherapists } from '$lib/data/mockTherapists';
import { getCityFromPlz, findPlzByCity, extractPlz } from '$lib/data/plzLookup';
import {
	forWhomOptions,
	insuranceTypeOptions,
	ageGroupOptions,
	therapyTypeOptions,
	preferenceOptions,
	summaryOptions,
	emailConfirmOptions,
	noResultsOptions,
	karlMessages,
	buildSummaryText
} from '$lib/data/chatOptions';

const state = writable<ChatState>('greeting');
const messages = writable<ChatMessage[]>([]);
const isTyping = writable(false);
const currentTherapist = writable<Therapist | null>(null);

// hydrate from localStorage on client
if (browser) {
	const savedState = localStorage.getItem('karl-chat-state');
	const savedMessages = localStorage.getItem('karl-chat-messages');
	if (savedState) state.set(savedState as ChatState);
	if (savedMessages) messages.set(JSON.parse(savedMessages));
}

// persist on change
state.subscribe((s) => {
	if (browser) localStorage.setItem('karl-chat-state', s);
});
messages.subscribe((m) => {
	if (browser) localStorage.setItem('karl-chat-messages', JSON.stringify(m));
});

async function addKarlMessage(
	content: string,
	options?: ChatOption[],
	inputType?: 'text' | 'plz',
	therapists?: Therapist[],
	multiSelect?: boolean
) {
	isTyping.set(true);
	await delay(800 + Math.random() * 400);
	isTyping.set(false);

	messages.update((msgs) => [
		...msgs,
		{
			id: nanoid(),
			role: 'karl',
			content,
			options,
			multiSelect,
			inputType,
			therapists,
			timestamp: Date.now()
		}
	]);
}

function addUserMessage(content: string, field?: EditableField) {
	messages.update((msgs) => [
		...msgs,
		{
			id: nanoid(),
			role: 'user',
			content,
			field,
			timestamp: Date.now()
		}
	]);
}

async function transitionTo(newState: ChatState) {
	state.set(newState);

	switch (newState) {
		case 'greeting':
			await addKarlMessage(karlMessages.greeting, forWhomOptions);
			break;

		case 'for_other_name':
			await addKarlMessage(karlMessages.for_other_name, undefined, 'text');
			break;

		case 'location': {
			const draft = get(campaignDraft);
			const message = draft.clientName
				? karlMessages.location_with_name.replace('{name}', draft.clientName)
				: karlMessages.location_default;
			await addKarlMessage(message, undefined, 'plz');
			break;
		}

		case 'insurance_type':
			await addKarlMessage(karlMessages.insurance_type, insuranceTypeOptions);
			break;

		case 'insurance_details':
			await addKarlMessage(karlMessages.insurance_details, ageGroupOptions);
			break;

		case 'therapy_type':
			await addKarlMessage(karlMessages.therapy_type, therapyTypeOptions);
			break;

		case 'preferences':
			await addKarlMessage(karlMessages.preferences, preferenceOptions, undefined, undefined, true);
			break;

		case 'summary': {
			const d = get(campaignDraft);
			const summaryText = buildSummaryText(d);
			await addKarlMessage(summaryText, summaryOptions);
			break;
		}

		case 'searching':
			await addKarlMessage(karlMessages.searching);
			await delay(1500);
			await transitionTo('results');
			break;

		case 'results': {
			const d = get(campaignDraft);
			const filtered = filterTherapists(mockTherapists, {
				therapyTypes: d.therapyTypes,
				insuranceType: d.insuranceType,
				languages: d.languages
			});

			if (filtered.length === 0) {
				await addKarlMessage(karlMessages.results_empty, noResultsOptions);
			} else {
				const message = karlMessages.results_found.replace('{count}', String(filtered.length));
				await addKarlMessage(message, undefined, undefined, filtered);
			}
			break;
		}

		case 'email_sent_confirm':
			await addKarlMessage(karlMessages.email_confirm, emailConfirmOptions);
			break;
	}
}

async function handleOption(option: ChatOption) {
	const currentState = get(state);

	// Determine which field this answers
	const fieldMap: Record<string, EditableField> = {
		greeting: 'forSelf',
		insurance_type: 'insuranceType',
		therapy_type: 'therapyTypes',
		preferences: 'preferences'
	};
	const field = fieldMap[currentState];

	addUserMessage(option.labelDe, field);

	switch (currentState) {
		case 'greeting':
			campaignDraft.update((d) => ({ ...d, forSelf: option.value as boolean }));
			break;
		case 'insurance_type':
			campaignDraft.update((d) => ({ ...d, insuranceType: option.value as 'GKV' | 'PKV' | 'Selbstzahler' }));
			break;
		case 'insurance_details':
			// Age group (adult/youth for KJP)
			campaignDraft.update((d) => ({ ...d, ageGroup: option.value as 'adult' | 'youth' }));
			break;
		case 'therapy_type':
			campaignDraft.update((d) => ({ ...d, therapyTypes: option.value as string[] }));
			break;
		case 'preferences':
			campaignDraft.update((d) => ({ ...d, ...(option.value as object) }));
			break;
	}

	if (option.nextState) {
		await transitionTo(option.nextState);
	}
}

async function handleInput(text: string) {
	const currentState = get(state);

	// Determine which field this answers
	const fieldMap: Record<string, EditableField> = {
		for_other_name: 'clientName',
		location: 'location'
	};
	const field = fieldMap[currentState];

	addUserMessage(text, field);

	switch (currentState) {
		case 'for_other_name':
			campaignDraft.update((d) => ({ ...d, forSelf: false, clientName: text }));
			await transitionTo('location');
			break;

		case 'location': {
			const plz = extractPlz(text);
			if (plz) {
				const city = getCityFromPlz(plz) || 'Unbekannt';
				campaignDraft.update((d) => ({ ...d, plz, city }));
				await transitionTo('insurance_type');
			} else {
				const cityMatch = findPlzByCity(text);
				if (cityMatch) {
					campaignDraft.update((d) => ({ ...d, plz: cityMatch.plz, city: cityMatch.city }));
					await transitionTo('insurance_type');
				} else {
					await addKarlMessage(karlMessages.location_error, undefined, 'plz');
				}
			}
			break;
		}
	}
}

async function handleMultiSelect(options: ChatOption[]) {
	const labels = options.map((o) => o.labelDe).join(', ') || 'Keine besonderen Wünsche';
	addUserMessage(labels, 'preferences');

	for (const option of options) {
		const val = option.value as Record<string, unknown>;
		campaignDraft.update((d) => {
			const updated = { ...d };
			if (val.genderPref) updated.genderPref = val.genderPref as 'w' | 'm' | 'd';
			if (val.languages) updated.languages = val.languages as string[];
			if (val.specialties) updated.specialties = [...d.specialties, ...(val.specialties as string[])];
			return updated;
		});
	}

	await transitionTo('summary');
}

function promptEmailConfirm(therapist: Therapist) {
	currentTherapist.set(therapist);
	transitionTo('email_sent_confirm');
}

function start() {
	const currentMessages = get(messages);
	if (currentMessages.length > 0) return;
	messages.set([]);
	campaignDraft.reset();
	transitionTo('greeting');
}

function reset() {
	if (browser) {
		localStorage.removeItem('karl-chat-state');
		localStorage.removeItem('karl-chat-messages');
	}
	messages.set([]);
	campaignDraft.reset();
	transitionTo('greeting');
}

// Rewind conversation to a specific message index
function rewindTo(messageIndex: number) {
	const currentMessages = get(messages);
	if (messageIndex < 0 || messageIndex >= currentMessages.length) return;

	// Slice messages to just before the user message (keep the Karl question)
	const previousMessages = currentMessages.slice(0, messageIndex);
	messages.set(previousMessages);

	// Reset campaign draft
	campaignDraft.reset();

	// Find the last karl message to determine what state to show
	const lastKarlMessage = previousMessages[previousMessages.length - 1];

	if (previousMessages.length === 0) {
		transitionTo('greeting');
	} else if (lastKarlMessage?.options) {
		// Show the options again by re-rendering
		state.set('greeting');
	} else if (lastKarlMessage?.inputType) {
		state.set('greeting');
	}
}

// Update a message's content in place (for editing without rewinding)
function updateMessage(messageIndex: number, newContent: string, option?: ChatOption) {
	messages.update((msgs) =>
		msgs.map((m, i) => (i === messageIndex ? { ...m, content: newContent } : m))
	);

	// Optionally update campaign draft based on the option's value
	if (option?.value !== undefined) {
		const val = option.value;
		campaignDraft.update((d) => {
			// Handle different value types
			if (typeof val === 'boolean') {
				return { ...d, forSelf: val };
			}
			if (typeof val === 'string') {
				// Could be insurance type
				if (['GKV', 'PKV', 'Selbstzahler'].includes(val)) {
					return { ...d, insuranceType: val as 'GKV' | 'PKV' | 'Selbstzahler' };
				}
			}
			if (Array.isArray(val)) {
				// Therapy types
				return { ...d, therapyTypes: val };
			}
			if (typeof val === 'object' && val !== null) {
				// Preferences object
				return { ...d, ...(val as object) };
			}
			return d;
		});
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const chat = {
	state,
	messages,
	isTyping,
	currentTherapist,
	handleOption,
	handleInput,
	handleMultiSelect,
	promptEmailConfirm,
	start,
	reset,
	rewindTo,
	updateMessage
};
