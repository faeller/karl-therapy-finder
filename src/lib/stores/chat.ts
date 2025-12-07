import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { nanoid } from 'nanoid';
import type { ChatState, ChatMessage, ChatOption, Therapist, EditableField } from '$lib/types';
import { campaignDraft } from './campaign';
import { mockTherapists, filterTherapists } from '$lib/data/mockTherapists';

const plzLookup: Record<string, string> = {
	'90402': 'Nürnberg',
	'90403': 'Nürnberg',
	'90419': 'Nürnberg',
	'90429': 'Nürnberg',
	'90491': 'Nürnberg',
	'10115': 'Berlin',
	'10178': 'Berlin',
	'80331': 'München',
	'50667': 'Köln',
	'20095': 'Hamburg'
};

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
			await addKarlMessage(
				'Hey! Ich bin KARL. Ich helfe dir dabei, freie Therapieplätze zu finden - damit du dich nicht durch 30 Praxen telefonieren musst.',
				[
					{
						id: 'self',
						label: 'For myself',
						labelDe: 'Für mich selbst',
						emoji: '🙋',
						value: true,
						nextState: 'location'
					},
					{
						id: 'other',
						label: 'For someone else',
						labelDe: 'Für jemand anderen',
						emoji: '🤝',
						value: false,
						nextState: 'for_other_name'
					}
				]
			);
			break;

		case 'for_other_name':
			await addKarlMessage(
				'Okay! Wie heißt die Person, für die du suchst? (Vorname reicht)',
				undefined,
				'text'
			);
			break;

		case 'location':
			const draft = get(campaignDraft);
			const prefix = draft.clientName ? `Alles klar, ich such für ${draft.clientName}. ` : '';
			await addKarlMessage(`${prefix}Wo soll ich suchen? Gib mir eine PLZ oder einen Ort.`, undefined, 'plz');
			break;

		case 'insurance_type':
			await addKarlMessage('Wie bist du versichert?', [
				{
					id: 'gkv',
					label: 'Statutory',
					labelDe: 'Gesetzlich (GKV)',
					emoji: '🏥',
					value: 'GKV',
					nextState: 'insurance_details'
				},
				{
					id: 'pkv',
					label: 'Private',
					labelDe: 'Privat (PKV)',
					emoji: '💳',
					value: 'PKV',
					nextState: 'therapy_type'
				},
				{
					id: 'selbst',
					label: 'Self-pay',
					labelDe: 'Selbstzahler',
					emoji: '💶',
					value: 'Selbstzahler',
					nextState: 'therapy_type'
				}
			]);
			break;

		case 'insurance_details':
			await addKarlMessage('Bei welcher Krankenkasse bist du? (z.B. TK, AOK, Barmer...)', undefined, 'text');
			break;

		case 'therapy_type':
			await addKarlMessage('Was für eine Therapie suchst du?', [
				{
					id: 'vt',
					label: 'CBT',
					labelDe: 'Verhaltenstherapie',
					value: ['VT', 'Verhaltenstherapie'],
					nextState: 'preferences'
				},
				{
					id: 'tp',
					label: 'Psychodynamic',
					labelDe: 'Tiefenpsychologie',
					value: ['TP', 'Tiefenpsychologie'],
					nextState: 'preferences'
				},
				{
					id: 'analyse',
					label: 'Psychoanalysis',
					labelDe: 'Psychoanalyse',
					value: ['Analyse', 'Psychoanalyse'],
					nextState: 'preferences'
				},
				{
					id: 'egal',
					label: "Doesn't matter",
					labelDe: 'Ist mir egal',
					emoji: '🤷',
					value: [],
					nextState: 'preferences'
				}
			]);
			break;

		case 'preferences':
			await addKarlMessage(
				'Noch besondere Wünsche? Wähl aus was passt, dann klick "Weiter".',
				[
					{
						id: 'female',
						label: 'Female',
						labelDe: 'Weibliche Therapeutin',
						emoji: '👩',
						value: { genderPref: 'w' }
					},
					{
						id: 'male',
						label: 'Male',
						labelDe: 'Männlicher Therapeut',
						emoji: '👨',
						value: { genderPref: 'm' }
					},
					{
						id: 'english',
						label: 'English',
						labelDe: 'Englisch',
						emoji: '🇬🇧',
						value: { languages: ['de', 'en'] }
					},
					{
						id: 'trauma',
						label: 'Trauma',
						labelDe: 'Traumatherapie',
						value: { specialties: ['trauma'] }
					}
				],
				undefined,
				undefined,
				true
			);
			break;

		case 'summary': {
			const d = get(campaignDraft);
			let summaryText = `Alles klar! Ich suche für dich:\n\n📍 ${d.city || d.plz} (${d.radiusKm}km Umkreis)\n🏥 ${d.insuranceType}${d.insuranceName ? ` (${d.insuranceName})` : ''}\n💭 ${d.therapyTypes.length ? d.therapyTypes.join(', ') : 'Alle Therapieformen'}`;
			if (d.genderPref) summaryText += `\n👤 ${d.genderPref === 'w' ? 'Weiblich' : 'Männlich'}`;
			if (d.languages.includes('en')) summaryText += '\n🌐 Englisch sprechend';
			if (d.specialties.length) summaryText += `\n🎯 ${d.specialties.join(', ')}`;
			await addKarlMessage(summaryText, [
				{
					id: 'search',
					label: 'Start search',
					labelDe: "Los geht's!",
					emoji: '🔍',
					value: true,
					nextState: 'searching'
				},
				{
					id: 'change',
					label: 'Change criteria',
					labelDe: 'Nochmal ändern',
					emoji: '✏️',
					value: false,
					nextState: 'greeting'
				}
			]);
			break;
		}

		case 'searching':
			await addKarlMessage('Suche Therapeut:innen in deiner Nähe...');
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
				await addKarlMessage(
					'Hmm, ich habe leider keine passenden Therapeut:innen gefunden. Möchtest du die Kriterien anpassen?',
					[
						{
							id: 'retry',
							label: 'Change criteria',
							labelDe: 'Kriterien ändern',
							value: true,
							nextState: 'greeting'
						}
					]
				);
			} else {
				await addKarlMessage(
					`Ich habe ${filtered.length} Therapeut:innen gefunden! Klick auf "E-Mail schreiben" um sie direkt zu kontaktieren.`,
					undefined,
					undefined,
					filtered
				);
			}
			break;
		}

		case 'email_sent_confirm':
			await addKarlMessage('E-Mail abgeschickt?', [
				{
					id: 'yes',
					label: 'Yes',
					labelDe: 'Ja, abgeschickt',
					emoji: '✅',
					value: true,
					nextState: 'results'
				},
				{
					id: 'no',
					label: 'No',
					labelDe: 'Nein, abgebrochen',
					emoji: '❌',
					value: false,
					nextState: 'results'
				}
			]);
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
		location: 'location',
		insurance_details: 'insuranceName'
	};
	const field = fieldMap[currentState];

	addUserMessage(text, field);

	switch (currentState) {
		case 'for_other_name':
			campaignDraft.update((d) => ({ ...d, forSelf: false, clientName: text }));
			await transitionTo('location');
			break;

		case 'location': {
			const plzMatch = text.match(/\d{5}/);
			if (plzMatch) {
				const plz = plzMatch[0];
				const city = plzLookup[plz] || 'Unbekannt';
				campaignDraft.update((d) => ({ ...d, plz, city }));
				await transitionTo('insurance_type');
			} else {
				const cityMatch = Object.entries(plzLookup).find(([_, c]) =>
					c.toLowerCase().includes(text.toLowerCase())
				);
				if (cityMatch) {
					campaignDraft.update((d) => ({ ...d, plz: cityMatch[0], city: cityMatch[1] }));
					await transitionTo('insurance_type');
				} else {
					await addKarlMessage(
						'Das hab ich nicht ganz verstanden. Kannst du mir eine Postleitzahl geben?',
						undefined,
						'plz'
					);
				}
			}
			break;
		}

		case 'insurance_details':
			campaignDraft.update((d) => ({ ...d, insuranceName: text }));
			await transitionTo('therapy_type');
			break;
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

// Field labels for UI
export const fieldLabels: Record<EditableField, string> = {
	forSelf: 'Für wen suchst du?',
	clientName: 'Name',
	location: 'Ort / PLZ',
	insuranceType: 'Versicherungsart',
	insuranceName: 'Krankenkasse',
	therapyTypes: 'Therapieart',
	preferences: 'Besondere Wünsche'
};

// Fields that require full conversation reset
const resetRequiredFields: EditableField[] = ['forSelf'];

// Check if a field change requires full reset or just re-search
function needsFullReset(field: EditableField): boolean {
	return resetRequiredFields.includes(field);
}

// Smart edit: update a specific field and re-search
async function editField(field: EditableField, newValue: string, messageIndex: number) {
	const currentMessages = get(messages);

	if (needsFullReset(field)) {
		// For fundamental changes, rewind the conversation
		const previousMessages = currentMessages.slice(0, messageIndex);
		messages.set(previousMessages);
		campaignDraft.reset();

		if (previousMessages.length === 0) {
			await transitionTo('greeting');
		}
		return;
	}

	// For other fields, just update the value and re-search
	const targetMessage = currentMessages[messageIndex];
	if (!targetMessage || targetMessage.role !== 'user') return;

	// Update the message content
	messages.update((msgs) =>
		msgs.map((m, i) => (i === messageIndex ? { ...m, content: newValue } : m))
	);

	// Update the campaign draft based on field type
	switch (field) {
		case 'location': {
			const plzMatch = newValue.match(/\d{5}/);
			if (plzMatch) {
				const plz = plzMatch[0];
				const city = plzLookup[plz] || 'Unbekannt';
				campaignDraft.update((d) => ({ ...d, plz, city }));
			} else {
				const cityMatch = Object.entries(plzLookup).find(([_, c]) =>
					c.toLowerCase().includes(newValue.toLowerCase())
				);
				if (cityMatch) {
					campaignDraft.update((d) => ({ ...d, plz: cityMatch[0], city: cityMatch[1] }));
				}
			}
			break;
		}
		case 'insuranceName':
			campaignDraft.update((d) => ({ ...d, insuranceName: newValue }));
			break;
		case 'clientName':
			campaignDraft.update((d) => ({ ...d, clientName: newValue }));
			break;
	}

	// If we're in results, re-search with new criteria
	const currentState = get(state);
	if (['results', 'email_sent_confirm'].includes(currentState)) {
		await refreshResults();
	}
}

// Re-run the search with current campaign draft
async function refreshResults() {
	// Remove old therapist results
	messages.update((msgs) => msgs.filter((m) => !m.therapists?.length));

	state.set('searching');
	await addKarlMessage('Suche mit neuen Kriterien...');
	await delay(1000);

	const d = get(campaignDraft);
	const filtered = filterTherapists(mockTherapists, {
		therapyTypes: d.therapyTypes,
		insuranceType: d.insuranceType,
		languages: d.languages
	});

	state.set('results');
	if (filtered.length === 0) {
		await addKarlMessage(
			'Hmm, ich habe leider keine passenden Therapeut:innen gefunden. Möchtest du die Kriterien anpassen?',
			[{ id: 'retry', label: 'Change criteria', labelDe: 'Kriterien ändern', value: true, nextState: 'greeting' }]
		);
	} else {
		await addKarlMessage(
			`Ich habe ${filtered.length} Therapeut:innen gefunden!`,
			undefined,
			undefined,
			filtered
		);
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
	editField,
	needsFullReset
};
