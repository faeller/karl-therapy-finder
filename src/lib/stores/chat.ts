// chat orchestrator - coordinates state machine, messages, and campaign
import { derived, writable, get } from 'svelte/store';
import type { ChatState, ChatMessage, ChatOption, Therapist, EditableField } from '$lib/types';
import { campaignDraft } from './campaign';
import { dataSession } from './dataSession';
import { extractPlz } from '$lib/data/plzLookup';
import { OptionId } from '$lib/data/optionIds';
import { applyOption, applyOptions, resetPreferences } from '$lib/data/optionMapping';
import { createKarlMessage, createUserMessage, simulateTyping } from './messageFactory';
import { searchTherapists, mergeTherapists, SearchError } from '$lib/services/therapistService';
import { stateConfigs, noResultsConfig, getFieldForState } from './chatStates';
import { track } from '$lib/utils/analytics';

// derived stores from dataSession
const state = derived(dataSession, ($data) => $data.chatState);
const messages = derived(dataSession, ($data) => $data.chatMessages);
const isTyping = writable(false);

// helpers to update state/messages through dataSession
function setState(newState: ChatState) {
	dataSession.updateChatState(newState);
}

function updateMessages(updater: (msgs: ChatMessage[]) => ChatMessage[]) {
	dataSession.updateChatMessages(updater);
}

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
	updateMessages((msgs) => [
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
	updateMessages((msgs) => [...msgs, createUserMessage(content, field, contentKey)]);
}

// state machine
async function transitionTo(newState: ChatState) {
	setState(newState);
	const config = stateConfigs[newState];
	const draft = get(campaignDraft);

	// track onboarding complete when entering terminservice or searching
	if (newState === 'terminservice' || newState === 'searching') {
		track('onboarding_complete');
	}

	// special cases requiring dynamic logic
	if (newState === 'location') {
		// check if we already answered location in THIS conversation
		const msgs = dataSession.getData().chatMessages;
		const locationMsg = msgs.find((m) => m.field === 'location' && m.role === 'user');

		if (locationMsg) {
			// already answered in this conversation, skip
			const plzFromHistory = extractPlz(locationMsg.content);
			if (plzFromHistory) campaignDraft.update((d) => ({ ...d, plz: plzFromHistory }));
			return transitionTo('insurance_type');
		}

		// show location question (even if draft has PLZ from previous session)
		const messageKey = draft.clientName ? 'karl_location_with_name' : 'karl_location';
		const params = draft.clientName ? { name: draft.clientName } : undefined;
		return say(messageKey, { input: 'plz', options: config?.options, params });
	}

	if (newState === 'searching') {
		// no typing simulation - overlay handles animation
		updateMessages((msgs) => [...msgs, createKarlMessage({ contentKey: 'karl_searching' })]);
		await handleResultsState();
		setState('results');
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
	const msgs = dataSession.getData().chatMessages;
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
	const currentState = dataSession.getData().chatState;
	const field = getFieldForState(currentState);

	// track key events
	if (currentState === 'greeting') track('chat_started');
	if (currentState === 'terminservice') track('terminservice_complete');
	if (option.id === OptionId.foundTherapist) track('found_therapist');

	if (!option.isAction) {
		addUserMessage(option.labelDe, field, `option_${option.id}`);
	}

	campaignDraft.update((d) => applyOption(d, option.id));

	if (option.id === OptionId.mergeResults) mergeResults = true;
	else if (option.id === OptionId.replaceResults) mergeResults = false;

	// theme next: go to location or for_other_name based on forSelf
	if (option.id === OptionId.themeNext) {
		const draft = get(campaignDraft);
		await transitionTo(draft.forSelf ? 'location' : 'for_other_name');
		return;
	}

	if (option.nextState) await transitionTo(option.nextState);
}

async function handleInput(text: string) {
	const currentState = dataSession.getData().chatState;
	const field = getFieldForState(currentState);
	addUserMessage(text, field);

	if (currentState === 'for_other_name') {
		campaignDraft.update((d) => ({ ...d, forSelf: false, clientName: text }));
		return transitionTo('location');
	}

	if (currentState === 'location') {
		const plz = extractPlz(text);
		if (plz) {
			track('plz_entered');
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
	const data = dataSession.getData();
	if (data.chatMessages.length === 0) {
		transitionTo('greeting');
		return;
	}

	// searching is transient - if we reload mid-search, re-run it
	if (data.chatState === 'searching') {
		handleResultsState().then(() => setState('results'));
		return;
	}

	// only re-transition if last message is user AND there's no karl response yet
	const lastMsg = data.chatMessages.at(-1);
	if (lastMsg?.role === 'user') {
		// check if karl already responded to this user message
		const config = stateConfigs[data.chatState];
		const karlAlreadyResponded = data.chatMessages.some(
			(m) => m.role === 'karl' && m.contentKey === config?.messageKey
		);
		if (!karlAlreadyResponded) {
			transitionTo(data.chatState);
		}
	}
}

function reset() {
	dataSession.reset();
	transitionTo('greeting');
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
	const currentMessages = dataSession.getData().chatMessages;
	if (messageIndex < 0 || messageIndex >= currentMessages.length) return;

	const remainingMessages = currentMessages.slice(0, messageIndex);
	updateMessages(() => remainingMessages);
	rebuildCampaignFromMessages(remainingMessages);

	// find the last karl message with a contentKey
	const lastKarl = [...remainingMessages].reverse().find((m) => m.role === 'karl' && m.contentKey);
	if (!lastKarl) return transitionTo('greeting');

	// find state that matches this message's contentKey
	const matchingEntry = Object.entries(stateConfigs).find(
		([, config]) => config?.messageKey === lastKarl.contentKey
	);
	if (matchingEntry) {
		setState(matchingEntry[0] as ChatState);
	} else {
		transitionTo('greeting');
	}
}

async function updateMessage(
	messageIndex: number,
	newContent: string,
	option?: ChatOption,
	contentKey?: string
) {
	const msgs = dataSession.getData().chatMessages;
	const msg = msgs[messageIndex];
	const finalContentKey = contentKey ?? (option ? `option_${option.id}` : msg?.contentKey);

	updateMessages((m) =>
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

	return dataSession.getData().chatMessages.some((m) => m.therapists?.length);
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
	start,
	reset,
	rewindTo,
	updateMessage,
	triggerReSearch
};
