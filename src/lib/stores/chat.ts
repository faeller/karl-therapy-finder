// chat orchestrator - coordinates state machine, messages, and campaign
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { ChatState, ChatMessage, ChatOption, Therapist, EditableField } from '$lib/types';
import { STORAGE_KEYS } from '$lib/constants';
import { campaignDraft } from './campaign';
import { extractPlz } from '$lib/data/plzLookup';
import { OptionId } from '$lib/data/optionIds';
import { applyOption, applyOptions, resetPreferences } from '$lib/data/optionMapping';
import { createKarlMessage, createUserMessage, simulateTyping } from './messageFactory';
import { searchTherapists, mergeTherapists, SearchError } from '$lib/services/therapistService';
import { stateConfigs, noResultsConfig, getFieldForState } from './chatStates';

// persistence helpers
function loadState(): ChatState {
	if (!browser) return 'greeting';
	return (localStorage.getItem(STORAGE_KEYS.chatState) as ChatState) || 'greeting';
}

function loadMessages(): ChatMessage[] {
	if (!browser) return [];
	try {
		const saved = localStorage.getItem(STORAGE_KEYS.chatMessages);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

// stores
const state = writable<ChatState>(loadState());
const messages = writable<ChatMessage[]>(loadMessages());
const isTyping = writable(false);

// auto-persist
state.subscribe((s) => browser && localStorage.setItem(STORAGE_KEYS.chatState, s));
messages.subscribe((m) => browser && localStorage.setItem(STORAGE_KEYS.chatMessages, JSON.stringify(m)));

// merge flag for re-search (intentionally module-level, reset after use)
let mergeResults = false;

// message helpers
async function say(
	key: string,
	opts: {
		options?: ChatOption[];
		input?: 'text' | 'plz';
		params?: Record<string, unknown>;
		therapists?: Therapist[];
		multi?: boolean;
		content?: string;
	} = {}
) {
	await simulateTyping((t) => isTyping.set(t));
	messages.update((msgs) => [
		...msgs,
		createKarlMessage({
			content: opts.content,
			contentKey: opts.content ? undefined : key,
			contentParams: opts.params,
			options: opts.options,
			multiSelect: opts.multi,
			inputType: opts.input,
			therapists: opts.therapists
		})
	]);
}

function addUserMessage(content: string, field?: EditableField, contentKey?: string) {
	messages.update((msgs) => [...msgs, createUserMessage(content, field, contentKey)]);
}

// state machine
async function transitionTo(newState: ChatState) {
	state.set(newState);
	const config = stateConfigs[newState];
	const draft = get(campaignDraft);

	// special cases requiring dynamic logic
	if (newState === 'location') {
		// check if we already have PLZ from history or draft
		const msgs = get(messages);
		const locationMsg = msgs.find((m) => m.field === 'location' && m.role === 'user');
		const plzFromHistory = locationMsg ? extractPlz(locationMsg.content) : undefined;

		if (plzFromHistory) {
			campaignDraft.update((d) => ({ ...d, plz: plzFromHistory }));
			return transitionTo('insurance_type');
		}
		if (draft.plz) return transitionTo('insurance_type');

		// dynamic message based on client name
		const messageKey = draft.clientName ? 'karl_location_with_name' : 'karl_location';
		const params = draft.clientName ? { name: draft.clientName } : undefined;
		return say(messageKey, { input: 'plz', options: config?.options, params });
	}

	if (newState === 'searching') {
		// no typing simulation - overlay handles animation
		messages.update((msgs) => [...msgs, createKarlMessage({ contentKey: 'karl_searching' })]);
		await handleResultsState();
		state.set('results');
		return;
	}

	if (newState === 'results') return;

	// standard state handling via config
	if (config) {
		return say(config.messageKey, {
			options: config.options,
			input: config.inputType,
			multi: config.multiSelect
		});
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
		console.error('PLZ not found in messages or campaign');
		return say(noResultsConfig.messageKey, { options: noResultsConfig.options });
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
			? say(noResultsConfig.messageKey, { options: noResultsConfig.options })
			: say('karl_results_found', { params: { count: therapists.length }, therapists });
	} catch (e) {
		console.error('Failed to fetch therapists:', e);

		// show specific error messages
		if (e instanceof SearchError) {
			const errorMessages: Record<string, string> = {
				network: 'karl_error_network',
				timeout: 'karl_error_timeout',
				server: 'karl_error_server',
				invalid_plz: 'karl_location_error'
			};
			const messageKey = errorMessages[e.type] || 'karl_error_server';
			return say(messageKey, { options: noResultsConfig.options });
		}

		return say('karl_error_server', { options: noResultsConfig.options });
	}
}

// handlers
async function handleOption(option: ChatOption) {
	const currentState = get(state);
	const field = getFieldForState(currentState);

	if (!option.isAction) {
		addUserMessage(option.labelDe, field, `option_${option.id}`);
	}

	campaignDraft.update((d) => applyOption(d, option.id));

	if (option.id === OptionId.mergeResults) mergeResults = true;
	else if (option.id === OptionId.replaceResults) mergeResults = false;

	if (option.nextState) await transitionTo(option.nextState);
}

async function handleInput(text: string) {
	const currentState = get(state);
	const field = getFieldForState(currentState);
	addUserMessage(text, field);

	if (currentState === 'for_other_name') {
		campaignDraft.update((d) => ({ ...d, forSelf: false, clientName: text }));
		return transitionTo('location');
	}

	if (currentState === 'location') {
		const plz = extractPlz(text);
		if (plz) {
			campaignDraft.update((d) => ({ ...d, plz }));
			return transitionTo('insurance_type');
		}
		return say('karl_location_error', { input: 'plz' });
	}
}

async function handleMultiSelect(options: ChatOption[]) {
	const contentKey =
		options.length > 0
			? options.map((o) => `option_${o.id}`).join(',')
			: `option_${OptionId.noPreferences}`;

	addUserMessage(
		options.map((o) => o.labelDe).join(', ') || 'Keine besonderen Wünsche',
		'preferences',
		contentKey
	);

	campaignDraft.update((d) => {
		const reset = resetPreferences(d);
		return applyOptions(reset, options.map((o) => o.id));
	});

	await transitionTo('summary');
}

// lifecycle
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
		localStorage.removeItem(STORAGE_KEYS.chatState);
		localStorage.removeItem(STORAGE_KEYS.chatMessages);
	}
	messages.set([]);
	campaignDraft.reset();
	transitionTo('greeting');
}

function hydrateChat() {
	state.set(loadState());
	messages.set(loadMessages());
}

// edit/undo support
function rebuildCampaignFromMessages(msgs: ChatMessage[]) {
	campaignDraft.reset();

	for (const msg of msgs) {
		if (msg.role !== 'user') continue;

		if (msg.field === 'clientName') {
			campaignDraft.update((d) => ({ ...d, forSelf: false, clientName: msg.content }));
			continue;
		}
		if (msg.field === 'location') {
			const plz = extractPlz(msg.content);
			if (plz) campaignDraft.update((d) => ({ ...d, plz }));
			continue;
		}

		if (!msg.contentKey) continue;
		const ids = msg.contentKey.split(',').map((k) => k.trim().replace('option_', ''));

		if (msg.field === 'preferences') {
			campaignDraft.update((d) => resetPreferences(d));
		}

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
		m.map((msg, i) => (i !== messageIndex ? msg : { ...msg, content: newContent, contentKey: finalContentKey }))
	);

	if (option) {
		campaignDraft.update((d) => applyOption(d, option.id));
	} else if (finalContentKey && msg?.field === 'preferences') {
		const ids = finalContentKey.split(',').map((k) => k.trim().replace('option_', ''));
		campaignDraft.update((d) => {
			const reset = resetPreferences(d);
			return applyOptions(reset, ids);
		});
	}

	return get(messages).some((m) => m.therapists?.length);
}

async function triggerReSearch(merge: boolean) {
	mergeResults = merge;
	await transitionTo('searching');
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
	updateMessage,
	triggerReSearch
};
