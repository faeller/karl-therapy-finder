import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { nanoid } from 'nanoid';
import type { ChatState, ChatMessage, ChatOption, Therapist, EditableField } from '$lib/types';
import { campaignDraft } from './campaign';
import { contacts } from './contacts';
import { getCityFromPlz, extractPlz } from '$lib/data/plzLookup';
import {
	forWhomOptions,
	locationOptions,
	insuranceTypeOptions,
	ageGroupOptions,
	therapyTypeOptions,
	preferenceOptions,
	summaryOptions,
	editHintOptions,
	terminserviceOptions,
	noResultsOptions,
	reSearchOptions
} from '$lib/data/chatOptions';
import { m } from '$lib/paraglide/messages';

function getStoredState(): ChatState {
	if (!browser) return 'greeting';
	return (localStorage.getItem('karl-chat-state') as ChatState) || 'greeting';
}

function getStoredMessages(): ChatMessage[] {
	if (!browser) return [];
	try {
		const saved = localStorage.getItem('karl-chat-messages');
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

const state = writable<ChatState>(getStoredState());
const messages = writable<ChatMessage[]>(getStoredMessages());
const isTyping = writable(false);

// track if next search should merge with existing results
let mergeResults = false;

state.subscribe((s) => browser && localStorage.setItem('karl-chat-state', s));
messages.subscribe((m) => browser && localStorage.setItem('karl-chat-messages', JSON.stringify(m)));

function hydrateChat() {
	state.set(getStoredState());
	messages.set(getStoredMessages());
}

// helpers for clean karl message creation
async function say(key: string, opts: {
	options?: ChatOption[];
	input?: 'text' | 'plz';
	params?: Record<string, unknown>;
	therapists?: Therapist[];
	multi?: boolean;
	content?: string; // pre-built content (skips contentKey lookup)
} = {}) {
	isTyping.set(true);
	await delay(800 + Math.random() * 400);
	isTyping.set(false);

	messages.update((msgs) => [...msgs, {
		id: nanoid(),
		role: 'karl',
		content: opts.content ?? '',
		contentKey: opts.content ? undefined : key,
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
		case 'location': {
			// check message history for PLZ first - source of truth
			const msgs = get(messages);
			const locationMsg = msgs.find(m => m.field === 'location' && m.role === 'user');
			const plzFromHistory = locationMsg ? extractPlz(locationMsg.content) : undefined;

			if (plzFromHistory) {
				// PLZ found in history, ensure it's in campaign and skip
				campaignDraft.update(d => ({ ...d, plz: plzFromHistory }));
				return transitionTo('insurance_type');
			}
			if (draft.plz) return transitionTo('insurance_type');

			return draft.clientName
				? say('karl_location_with_name', { input: 'plz', options: locationOptions, params: { name: draft.clientName } })
				: say('karl_location', { input: 'plz', options: locationOptions });
		}
		case 'insurance_type': return ask('karl_insurance_type', insuranceTypeOptions);
		case 'insurance_details': return ask('karl_age_group', ageGroupOptions);
		case 'therapy_type': return ask('karl_therapy_type', therapyTypeOptions);
		case 'preferences': return ask('karl_preferences', preferenceOptions, true);
		case 'summary':
			return say('karl_summary', { options: summaryOptions });
		case 'edit_hint':
			return ask('karl_edit_hint', editHintOptions);
		case 'terminservice':
			return say('terminservice_intro', { options: terminserviceOptions });
		case 'searching':
			await say('karl_searching');
			await delay(1500);
			return transitionTo('results');
		case 'results': {
			// get PLZ from message history - this is the source of truth
			const msgs = get(messages);
			const locationMsg = msgs.find(m => m.field === 'location' && m.role === 'user');
			let plz = locationMsg ? extractPlz(locationMsg.content) : undefined;

			// fallback to campaign store
			if (!plz) {
				const draft = campaignDraft.hydrate();
				plz = draft.plz;
			}

			if (!plz) {
				console.error('PLZ not found in messages or campaign!');
				return ask('karl_no_results', noResultsOptions);
			}

			// ensure campaign store has the PLZ for consistency
			campaignDraft.update(d => ({ ...d, plz }));

			const draft = get(campaignDraft);
			try {
				const params = new URLSearchParams({
					plz,
					billing: draft.insuranceType || 'GKV',
					...(draft.genderPref && { gender: draft.genderPref }),
					...(draft.ageGroup && { ageGroup: draft.ageGroup })
				});
				const res = await fetch(`/api/therapists?${params}`);
				if (!res.ok) throw new Error(`API error: ${res.status}`);
				const data = await res.json();
				let therapists: Therapist[] = data.therapists || [];

				// merge with existing results if requested
				if (mergeResults) {
					const existingTherapists = msgs
						.filter(m => m.therapists?.length)
						.flatMap(m => m.therapists || []);
					const existingIds = new Set(existingTherapists.map(t => t.id));
					const newTherapists = therapists.filter(t => !existingIds.has(t.id));
					therapists = [...existingTherapists, ...newTherapists];
					mergeResults = false; // reset flag
				}

				return therapists.length === 0
					? ask('karl_no_results', noResultsOptions)
					: say('karl_results_found', { params: { count: therapists.length }, therapists });
			} catch (e) {
				console.error('Failed to fetch therapists:', e);
				return ask('karl_no_results', noResultsOptions);
			}
		}
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
		preferences: () => campaignDraft.update((d) => ({ ...d, ...(option.value as object) })),
		terminservice: () => campaignDraft.update((d) => ({ ...d, terminserviceStatus: option.value ? 'done' : 'skipped' })),
	};
	updates[currentState]?.();

	// handle terminservice options from any state (user can complete it later)
	if (option.id === 'terminservice_done' || option.id === 'terminservice_skip') {
		campaignDraft.update((d) => ({ ...d, terminserviceStatus: option.id === 'terminservice_done' ? 'done' : 'skipped' }));
	}

	// handle merge/replace re-search options
	if (option.id === 'merge_results') {
		mergeResults = true;
	} else if (option.id === 'replace_results') {
		mergeResults = false;
	}

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
			campaignDraft.update((d) => ({ ...d, plz, city: getCityFromPlz(plz) || '' }));
			return transitionTo('insurance_type');
		}
		return prompt('karl_location_error', 'plz');
	}
}

async function handleMultiSelect(options: ChatOption[]) {
	const contentKey = options.length > 0
		? options.map((o) => `option_${o.id}`).join(',')
		: 'option_no_preferences';
	addUserMessage(
		options.map((o) => o.labelDe).join(', ') || 'Keine besonderen Wünsche',
		'preferences',
		contentKey
	);

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


function start() {
	const msgs = get(messages);
	if (msgs.length === 0) {
		// don't reset campaign - preserve PLZ and other data
		transitionTo('greeting');
		return;
	}
	// recover from interrupted state (e.g. language change during typing)
	const lastMsg = msgs.at(-1);
	if (lastMsg?.role === 'user') {
		// karl never responded, re-trigger current state
		transitionTo(get(state));
	}
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

// all options in one list for lookup
const allOptions = [
	...forWhomOptions, ...insuranceTypeOptions, ...ageGroupOptions,
	...therapyTypeOptions, ...preferenceOptions, ...terminserviceOptions
];

function findOptionById(id: string) {
	return allOptions.find(o => o.id === id);
}

function rebuildCampaignFromMessages(msgs: ChatMessage[]) {
	campaignDraft.reset();

	for (const msg of msgs) {
		if (msg.role !== 'user') continue;

		// text input fields
		if (msg.field === 'clientName') {
			campaignDraft.update(d => ({ ...d, forSelf: false, clientName: msg.content }));
			continue;
		}
		if (msg.field === 'location') {
			const plz = extractPlz(msg.content);
			if (plz) campaignDraft.update(d => ({ ...d, plz, city: getCityFromPlz(plz) || '' }));
			continue;
		}

		// option-based fields - parse contentKey
		if (!msg.contentKey) continue;
		const keys = msg.contentKey.split(',').map(k => k.trim().replace('option_', ''));

		// preferences is multi-select, reset first
		if (msg.field === 'preferences') {
			campaignDraft.update(d => ({ ...d, genderPref: undefined, languages: ['de'], specialties: [] }));
		}

		for (const id of keys) {
			if (id === 'no_preferences') continue;
			const opt = findOptionById(id);
			if (!opt) continue;

			const val = opt.value;
			if (id === 'for_self' || id === 'for_other') {
				campaignDraft.update(d => ({ ...d, forSelf: val as boolean }));
			} else if (['gkv', 'pkv', 'self_pay'].includes(id)) {
				campaignDraft.update(d => ({ ...d, insuranceType: val as 'GKV' | 'PKV' | 'Selbstzahler' }));
			} else if (['adult', 'youth'].includes(id)) {
				campaignDraft.update(d => ({ ...d, ageGroup: val as 'adult' | 'youth' }));
			} else if (['vt', 'tp', 'analyse', 'any_therapy'].includes(id)) {
				campaignDraft.update(d => ({ ...d, therapyTypes: val as string[] }));
			} else if (['female', 'male', 'english', 'trauma'].includes(id)) {
				const pref = val as Record<string, unknown>;
				campaignDraft.update(d => ({
					...d,
					...(pref.genderPref && { genderPref: pref.genderPref as 'w' | 'm' | 'd' }),
					...(pref.languages && { languages: pref.languages as string[] }),
					...(pref.specialties && { specialties: [...d.specialties, ...(pref.specialties as string[])] })
				}));
			} else if (id === 'terminservice_done') {
				campaignDraft.update(d => ({ ...d, terminserviceStatus: 'done' }));
			} else if (id === 'terminservice_skip') {
				campaignDraft.update(d => ({ ...d, terminserviceStatus: 'skipped' }));
			}
		}
	}
}

function rewindTo(messageIndex: number) {
	const currentMessages = get(messages);
	if (messageIndex < 0 || messageIndex >= currentMessages.length) return;

	const remainingMessages = currentMessages.slice(0, messageIndex);
	messages.set(remainingMessages);
	rebuildCampaignFromMessages(remainingMessages);

	const lastKarl = remainingMessages.at(-1);
	if (!lastKarl) return transitionTo('greeting');
	if (lastKarl.options || lastKarl.inputType) state.set('greeting');
}

async function updateMessage(messageIndex: number, newContent: string, option?: ChatOption, contentKey?: string) {
	messages.update((msgs) => msgs.map((msg, i) => {
		if (i !== messageIndex) return msg;
		return {
			...msg,
			content: newContent,
			contentKey: contentKey ?? (option ? `option_${option.id}` : msg.contentKey)
		};
	}));

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

	// check if we have results and prompt for re-search
	const hasResults = get(messages).some(m => m.therapists?.length);
	if (hasResults) {
		await ask('karl_research_prompt', reSearchOptions);
	}
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const chat = {
	state, messages, isTyping,
	handleOption, handleInput, handleMultiSelect,
	hydrateChat, start, reset, rewindTo, updateMessage
};
