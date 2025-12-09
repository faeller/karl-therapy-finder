import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { ChatState, ChatMessage, ChatOption, Therapist, EditableField } from '$lib/types';
import { campaignDraft } from './campaign';
import { getCityFromPlz, extractPlz } from '$lib/data/plzLookup';
import { OptionId } from '$lib/data/optionIds';
import { applyOption, applyOptions, resetPreferences } from '$lib/data/optionMapping';
import { createKarlMessage, createUserMessage, simulateTyping, delay } from './messageFactory';
import { searchTherapists, mergeTherapists } from '$lib/services/therapistService';
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

// persistence
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

// stores
const state = writable<ChatState>(getStoredState());
const messages = writable<ChatMessage[]>(getStoredMessages());
const isTyping = writable(false);

// persist on change
state.subscribe((s) => browser && localStorage.setItem('karl-chat-state', s));
messages.subscribe((m) => browser && localStorage.setItem('karl-chat-messages', JSON.stringify(m)));

// merge flag for re-search
let mergeResults = false;

function hydrateChat() {
	state.set(getStoredState());
	messages.set(getStoredMessages());
}

// message helpers
async function say(key: string, opts: {
	options?: ChatOption[];
	input?: 'text' | 'plz';
	params?: Record<string, unknown>;
	therapists?: Therapist[];
	multi?: boolean;
	content?: string;
} = {}) {
	await simulateTyping((t) => isTyping.set(t));
	messages.update((msgs) => [...msgs, createKarlMessage({
		content: opts.content,
		contentKey: opts.content ? undefined : key,
		contentParams: opts.params,
		options: opts.options,
		multiSelect: opts.multi,
		inputType: opts.input,
		therapists: opts.therapists
	})]);
}

const ask = (key: string, options: ChatOption[], multi = false) => say(key, { options, multi });
const prompt = (key: string, type: 'text' | 'plz' = 'text', params?: Record<string, unknown>) =>
	say(key, { input: type, params });

function addUserMessage(content: string, field?: EditableField, contentKey?: string) {
	messages.update((msgs) => [...msgs, createUserMessage(content, field, contentKey)]);
}

// state machine
async function transitionTo(newState: ChatState) {
	state.set(newState);
	const draft = get(campaignDraft);

	switch (newState) {
		case 'greeting':
			return ask('karl_greeting', forWhomOptions);
		case 'for_other_name':
			return prompt('karl_for_other_name', 'text');
		case 'location': {
			const msgs = get(messages);
			const locationMsg = msgs.find((m) => m.field === 'location' && m.role === 'user');
			const plzFromHistory = locationMsg ? extractPlz(locationMsg.content) : undefined;

			if (plzFromHistory) {
				campaignDraft.update((d) => ({ ...d, plz: plzFromHistory }));
				return transitionTo('insurance_type');
			}
			if (draft.plz) return transitionTo('insurance_type');

			return draft.clientName
				? say('karl_location_with_name', { input: 'plz', options: locationOptions, params: { name: draft.clientName } })
				: say('karl_location', { input: 'plz', options: locationOptions });
		}
		case 'insurance_type':
			return ask('karl_insurance_type', insuranceTypeOptions);
		case 'insurance_details':
			return ask('karl_age_group', ageGroupOptions);
		case 'therapy_type':
			return ask('karl_therapy_type', therapyTypeOptions);
		case 'preferences':
			return ask('karl_preferences', preferenceOptions, true);
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
		case 'results':
			return handleResultsState();
	}
}

async function handleResultsState() {
	const msgs = get(messages);
	const locationMsg = msgs.find((m) => m.field === 'location' && m.role === 'user');
	let plz = locationMsg ? extractPlz(locationMsg.content) : undefined;

	if (!plz) {
		const draft = campaignDraft.hydrate();
		plz = draft.plz;
	}

	if (!plz) {
		console.error('PLZ not found in messages or campaign!');
		return ask('karl_no_results', noResultsOptions);
	}

	campaignDraft.update((d) => ({ ...d, plz }));
	const draft = get(campaignDraft);

	try {
		const result = await searchTherapists(plz, draft);
		let therapists = result.therapists;

		if (mergeResults) {
			const existingTherapists = msgs
				.filter((m) => m.therapists?.length)
				.flatMap((m) => m.therapists || []);
			therapists = mergeTherapists(existingTherapists, therapists);
			mergeResults = false;
		}

		return therapists.length === 0
			? ask('karl_no_results', noResultsOptions)
			: say('karl_results_found', { params: { count: therapists.length }, therapists });
	} catch (e) {
		console.error('Failed to fetch therapists:', e);
		return ask('karl_no_results', noResultsOptions);
	}
}

// field mapping for user messages
const stateFieldMap: Partial<Record<ChatState, EditableField>> = {
	greeting: 'forSelf',
	for_other_name: 'clientName',
	location: 'location',
	insurance_type: 'insuranceType',
	therapy_type: 'therapyTypes',
	preferences: 'preferences'
};

async function handleOption(option: ChatOption) {
	const currentState = get(state);
	const field = stateFieldMap[currentState];

	addUserMessage(option.labelDe, field, `option_${option.id}`);

	// apply option to campaign using centralized mapping
	campaignDraft.update((d) => applyOption(d, option.id));

	// handle special cases
	if (option.id === OptionId.mergeResults) {
		mergeResults = true;
	} else if (option.id === OptionId.replaceResults) {
		mergeResults = false;
	}

	if (option.nextState) await transitionTo(option.nextState);
}

async function handleInput(text: string) {
	const currentState = get(state);
	const field = stateFieldMap[currentState];

	addUserMessage(text, field);

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
		: `option_${OptionId.noPreferences}`;

	addUserMessage(
		options.map((o) => o.labelDe).join(', ') || 'Keine besonderen Wünsche',
		'preferences',
		contentKey
	);

	// reset preferences then apply all selected
	campaignDraft.update((d) => {
		const reset = resetPreferences(d);
		return applyOptions(reset, options.map((o) => o.id));
	});

	await transitionTo('summary');
}

function start() {
	const msgs = get(messages);
	if (msgs.length === 0) {
		transitionTo('greeting');
		return;
	}
	const lastMsg = msgs.at(-1);
	if (lastMsg?.role === 'user') {
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

// rebuild campaign from message history (for undo)
function rebuildCampaignFromMessages(msgs: ChatMessage[]) {
	campaignDraft.reset();

	for (const msg of msgs) {
		if (msg.role !== 'user') continue;

		// text input fields
		if (msg.field === 'clientName') {
			campaignDraft.update((d) => ({ ...d, forSelf: false, clientName: msg.content }));
			continue;
		}
		if (msg.field === 'location') {
			const plz = extractPlz(msg.content);
			if (plz) campaignDraft.update((d) => ({ ...d, plz, city: getCityFromPlz(plz) || '' }));
			continue;
		}

		// option-based fields
		if (!msg.contentKey) continue;
		const ids = msg.contentKey.split(',').map((k) => k.trim().replace('option_', ''));

		// reset preferences for multi-select
		if (msg.field === 'preferences') {
			campaignDraft.update((d) => resetPreferences(d));
		}

		// apply all options using centralized mapping
		campaignDraft.update((d) => applyOptions(d, ids));
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

async function updateMessage(
	messageIndex: number,
	newContent: string,
	option?: ChatOption,
	contentKey?: string
) {
	const msgs = get(messages);
	const msg = msgs[messageIndex];
	const finalContentKey = contentKey ?? (option ? `option_${option.id}` : msg?.contentKey);

	messages.update((m) =>
		m.map((msg, i) => {
			if (i !== messageIndex) return msg;
			return { ...msg, content: newContent, contentKey: finalContentKey };
		})
	);

	// apply option update using centralized mapping
	if (option) {
		campaignDraft.update((d) => applyOption(d, option.id));
	} else if (finalContentKey && msg?.field === 'preferences') {
		// multi-select edit: reset prefs and apply all from contentKey
		const ids = finalContentKey.split(',').map((k) => k.trim().replace('option_', ''));
		campaignDraft.update((d) => {
			const reset = resetPreferences(d);
			return applyOptions(reset, ids);
		});
	}

	// check if we have results and prompt for re-search (remove old prompt first)
	const hasResults = get(messages).some((m) => m.therapists?.length);
	if (hasResults) {
		messages.update((msgs) => msgs.filter((m) => m.contentKey !== 'karl_research_prompt'));
		await ask('karl_research_prompt', reSearchOptions);
	}
}

export const chat = {
	state,
	messages,
	isTyping,
	handleOption,
	handleInput,
	handleMultiSelect,
	hydrateChat,
	start,
	reset,
	rewindTo,
	updateMessage
};
