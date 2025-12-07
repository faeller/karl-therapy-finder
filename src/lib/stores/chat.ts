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
	karlMessages
} from '$lib/data/chatOptions';

const state = writable<ChatState>('greeting');
const messages = writable<ChatMessage[]>([]);
const isTyping = writable(false);
const currentTherapist = writable<Therapist | null>(null);

if (browser) {
	const savedState = localStorage.getItem('karl-chat-state');
	const savedMessages = localStorage.getItem('karl-chat-messages');
	if (savedState) state.set(savedState as ChatState);
	if (savedMessages) messages.set(JSON.parse(savedMessages));
}

state.subscribe((s) => {
	if (browser) localStorage.setItem('karl-chat-state', s);
});
messages.subscribe((m) => {
	if (browser) localStorage.setItem('karl-chat-messages', JSON.stringify(m));
});

interface KarlMessageOpts {
	key: string;
	fallback: string;
	params?: Record<string, unknown>;
	options?: ChatOption[];
	inputType?: 'text' | 'plz';
	therapists?: Therapist[];
	multiSelect?: boolean;
}

async function addKarlMessage(opts: KarlMessageOpts) {
	isTyping.set(true);
	await delay(800 + Math.random() * 400);
	isTyping.set(false);

	messages.update((msgs) => [
		...msgs,
		{
			id: nanoid(),
			role: 'karl',
			content: opts.fallback,
			contentKey: opts.key,
			contentParams: opts.params,
			options: opts.options,
			multiSelect: opts.multiSelect,
			inputType: opts.inputType,
			therapists: opts.therapists,
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
			await addKarlMessage({
				...karlMessages.greeting,
				options: forWhomOptions
			});
			break;

		case 'for_other_name':
			await addKarlMessage({
				...karlMessages.for_other_name,
				inputType: 'text'
			});
			break;

		case 'location': {
			const draft = get(campaignDraft);
			if (draft.clientName) {
				await addKarlMessage({
					...karlMessages.location_with_name,
					params: { name: draft.clientName },
					inputType: 'plz'
				});
			} else {
				await addKarlMessage({
					...karlMessages.location_default,
					inputType: 'plz'
				});
			}
			break;
		}

		case 'insurance_type':
			await addKarlMessage({
				...karlMessages.insurance_type,
				options: insuranceTypeOptions
			});
			break;

		case 'insurance_details':
			await addKarlMessage({
				...karlMessages.insurance_details,
				options: ageGroupOptions
			});
			break;

		case 'therapy_type':
			await addKarlMessage({
				...karlMessages.therapy_type,
				options: therapyTypeOptions
			});
			break;

		case 'preferences':
			await addKarlMessage({
				...karlMessages.preferences,
				options: preferenceOptions,
				multiSelect: true
			});
			break;

		case 'summary': {
			const d = get(campaignDraft);
			const details = buildSummaryDetails(d);
			await addKarlMessage({
				...karlMessages.summary,
				params: { details },
				options: summaryOptions
			});
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
				await addKarlMessage({
					...karlMessages.results_empty,
					options: noResultsOptions
				});
			} else {
				await addKarlMessage({
					...karlMessages.results_found,
					params: { count: filtered.length },
					therapists: filtered
				});
			}
			break;
		}

		case 'email_sent_confirm':
			await addKarlMessage({
				...karlMessages.email_confirm,
				options: emailConfirmOptions
			});
			break;
	}
}

function buildSummaryDetails(d: {
	city?: string;
	plz?: string;
	radiusKm: number;
	insuranceType?: string;
	therapyTypes: string[];
	genderPref?: string | null;
	languages: string[];
	specialties: string[];
}): string {
	let text = `\n\n${d.city || d.plz} (${d.radiusKm}km)\n${d.insuranceType}\n${d.therapyTypes.length ? d.therapyTypes.join(', ') : 'Alle Therapieformen'}`;
	if (d.genderPref) text += `\n${d.genderPref === 'w' ? 'Weiblich' : 'Männlich'}`;
	if (d.languages.includes('en')) text += '\nEnglisch';
	if (d.specialties.length) text += `\n${d.specialties.join(', ')}`;
	return text;
}

async function handleOption(option: ChatOption) {
	const currentState = get(state);

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
					await addKarlMessage({
						...karlMessages.location_error,
						inputType: 'plz'
					});
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

function rewindTo(messageIndex: number) {
	const currentMessages = get(messages);
	if (messageIndex < 0 || messageIndex >= currentMessages.length) return;

	const previousMessages = currentMessages.slice(0, messageIndex);
	messages.set(previousMessages);
	campaignDraft.reset();

	const lastKarlMessage = previousMessages[previousMessages.length - 1];

	if (previousMessages.length === 0) {
		transitionTo('greeting');
	} else if (lastKarlMessage?.options) {
		state.set('greeting');
	} else if (lastKarlMessage?.inputType) {
		state.set('greeting');
	}
}

function updateMessage(messageIndex: number, newContent: string, option?: ChatOption) {
	messages.update((msgs) =>
		msgs.map((m, i) => (i === messageIndex ? { ...m, content: newContent } : m))
	);

	if (option?.value !== undefined) {
		const val = option.value;
		campaignDraft.update((d) => {
			if (typeof val === 'boolean') {
				return { ...d, forSelf: val };
			}
			if (typeof val === 'string') {
				if (['GKV', 'PKV', 'Selbstzahler'].includes(val)) {
					return { ...d, insuranceType: val as 'GKV' | 'PKV' | 'Selbstzahler' };
				}
			}
			if (Array.isArray(val)) {
				return { ...d, therapyTypes: val };
			}
			if (typeof val === 'object' && val !== null) {
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
