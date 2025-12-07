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
	noResultsOptions
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

state.subscribe((s) => browser && localStorage.setItem('karl-chat-state', s));
messages.subscribe((m) => browser && localStorage.setItem('karl-chat-messages', JSON.stringify(m)));

// helpers for clean karl message creation
async function say(key: string, opts: {
	options?: ChatOption[];
	input?: 'text' | 'plz';
	params?: Record<string, unknown>;
	therapists?: Therapist[];
	multi?: boolean;
} = {}) {
	isTyping.set(true);
	await delay(800 + Math.random() * 400);
	isTyping.set(false);

	messages.update((msgs) => [...msgs, {
		id: nanoid(),
		role: 'karl',
		content: '',
		contentKey: key,
		contentParams: opts.params,
		options: opts.options,
		multiSelect: opts.multi,
		inputType: opts.input,
		therapists: opts.therapists,
		timestamp: Date.now()
	}]);
}

// shorthand helpers
const ask = (key: string, options: ChatOption[], multi = false) => say(key, { options, multi });
const prompt = (key: string, type: 'text' | 'plz' = 'text', params?: Record<string, unknown>) =>
	say(key, { input: type, params });

function addUserMessage(content: string, field?: EditableField, contentKey?: string) {
	messages.update((msgs) => [...msgs, {
		id: nanoid(),
		role: 'user',
		content,
		contentKey,
		field,
		timestamp: Date.now()
	}]);
}

async function transitionTo(newState: ChatState) {
	state.set(newState);
	const draft = get(campaignDraft);

	switch (newState) {
		case 'greeting': return ask('karl_greeting', forWhomOptions);
		case 'for_other_name': return prompt('karl_for_other_name', 'text');
		case 'location':
			return draft.clientName
				? prompt('karl_location_with_name', 'plz', { name: draft.clientName })
				: prompt('karl_location', 'plz');
		case 'insurance_type': return ask('karl_insurance_type', insuranceTypeOptions);
		case 'insurance_details': return ask('karl_age_group', ageGroupOptions);
		case 'therapy_type': return ask('karl_therapy_type', therapyTypeOptions);
		case 'preferences': return ask('karl_preferences', preferenceOptions, true);
		case 'summary': return ask('karl_summary_intro', summaryOptions, false);
		case 'searching':
			await say('karl_searching');
			await delay(1500);
			return transitionTo('results');
		case 'results': {
			const filtered = filterTherapists(mockTherapists, {
				therapyTypes: draft.therapyTypes,
				insuranceType: draft.insuranceType,
				languages: draft.languages
			});
			return filtered.length === 0
				? ask('karl_no_results', noResultsOptions)
				: say('karl_results_found', { params: { count: filtered.length }, therapists: filtered });
		}
		case 'email_sent_confirm': return ask('email_sent_question', emailConfirmOptions);
	}
}

async function handleOption(option: ChatOption) {
	const currentState = get(state);
	const fieldMap: Record<string, EditableField> = {
		greeting: 'forSelf',
		insurance_type: 'insuranceType',
		therapy_type: 'therapyTypes',
		preferences: 'preferences'
	};

	addUserMessage(option.labelDe, fieldMap[currentState], `option_${option.id}`);

	const updates: Record<string, () => void> = {
		greeting: () => campaignDraft.update((d) => ({ ...d, forSelf: option.value as boolean })),
		insurance_type: () => campaignDraft.update((d) => ({ ...d, insuranceType: option.value as 'GKV' | 'PKV' | 'Selbstzahler' })),
		insurance_details: () => campaignDraft.update((d) => ({ ...d, ageGroup: option.value as 'adult' | 'youth' })),
		therapy_type: () => campaignDraft.update((d) => ({ ...d, therapyTypes: option.value as string[] })),
		preferences: () => campaignDraft.update((d) => ({ ...d, ...(option.value as object) }))
	};
	updates[currentState]?.();

	if (option.nextState) await transitionTo(option.nextState);
}

async function handleInput(text: string) {
	const currentState = get(state);
	const fieldMap: Record<string, EditableField> = {
		for_other_name: 'clientName',
		location: 'location'
	};

	addUserMessage(text, fieldMap[currentState]);

	if (currentState === 'for_other_name') {
		campaignDraft.update((d) => ({ ...d, forSelf: false, clientName: text }));
		return transitionTo('location');
	}

	if (currentState === 'location') {
		const plz = extractPlz(text);
		if (plz) {
			campaignDraft.update((d) => ({ ...d, plz, city: getCityFromPlz(plz) || 'Unbekannt' }));
			return transitionTo('insurance_type');
		}
		const cityMatch = findPlzByCity(text);
		if (cityMatch) {
			campaignDraft.update((d) => ({ ...d, plz: cityMatch.plz, city: cityMatch.city }));
			return transitionTo('insurance_type');
		}
		return prompt('karl_location_error', 'plz');
	}
}

async function handleMultiSelect(options: ChatOption[]) {
	addUserMessage(options.map((o) => o.labelDe).join(', ') || 'Keine besonderen Wünsche', 'preferences');

	for (const { value } of options) {
		const val = value as Record<string, unknown>;
		campaignDraft.update((d) => ({
			...d,
			...(val.genderPref && { genderPref: val.genderPref as 'w' | 'm' | 'd' }),
			...(val.languages && { languages: val.languages as string[] }),
			...(val.specialties && { specialties: [...d.specialties, ...(val.specialties as string[])] })
		}));
	}
	await transitionTo('summary');
}

function promptEmailConfirm(therapist: Therapist) {
	currentTherapist.set(therapist);
	transitionTo('email_sent_confirm');
}

function start() {
	if (get(messages).length > 0) return;
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

	messages.set(currentMessages.slice(0, messageIndex));
	campaignDraft.reset();

	const lastKarl = currentMessages.slice(0, messageIndex).at(-1);
	if (!lastKarl) return transitionTo('greeting');
	if (lastKarl.options || lastKarl.inputType) state.set('greeting');
}

function updateMessage(messageIndex: number, newContent: string, option?: ChatOption) {
	messages.update((msgs) => msgs.map((m, i) => i === messageIndex ? { ...m, content: newContent } : m));

	if (option?.value === undefined) return;
	const val = option.value;

	campaignDraft.update((d) => {
		if (typeof val === 'boolean') return { ...d, forSelf: val };
		if (typeof val === 'string' && ['GKV', 'PKV', 'Selbstzahler'].includes(val))
			return { ...d, insuranceType: val as 'GKV' | 'PKV' | 'Selbstzahler' };
		if (Array.isArray(val)) return { ...d, therapyTypes: val };
		if (typeof val === 'object' && val) return { ...d, ...(val as object) };
		return d;
	});
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const chat = {
	state, messages, isTyping, currentTherapist,
	handleOption, handleInput, handleMultiSelect,
	promptEmailConfirm, start, reset, rewindTo, updateMessage
};
