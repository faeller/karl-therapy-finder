import type { ChatOption, ChatState } from '$lib/types';

// Who is the search for?
export const forWhomOptions: ChatOption[] = [
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
];

// Insurance type
export const insuranceTypeOptions: ChatOption[] = [
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
];

// Age group (for KJP eligibility)
export const ageGroupOptions: ChatOption[] = [
	{
		id: 'adult',
		label: 'Over 21',
		labelDe: 'Über 21 (Erwachsene)',
		emoji: '🧑',
		value: 'adult',
		nextState: 'therapy_type'
	},
	{
		id: 'youth',
		label: 'Under 21',
		labelDe: 'Unter 21 (KJP möglich)',
		emoji: '👶',
		value: 'youth',
		nextState: 'therapy_type'
	}
];

// Therapy types
export const therapyTypeOptions: ChatOption[] = [
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
];

// Preferences (multi-select)
export const preferenceOptions: ChatOption[] = [
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
];

// Summary confirmation
export const summaryOptions: ChatOption[] = [
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
];

// Email confirmation
export const emailConfirmOptions: ChatOption[] = [
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
];

// No results - retry
export const noResultsOptions: ChatOption[] = [
	{
		id: 'retry',
		label: 'Change criteria',
		labelDe: 'Kriterien ändern',
		value: true,
		nextState: 'greeting'
	}
];

// karl message keys with german fallbacks
export const karlMessages: Record<string, { key: string; fallback: string }> = {
	greeting: {
		key: 'karl_greeting',
		fallback: 'Hey! Ich bin KARL. Ich helfe dir dabei, freie Therapieplätze zu finden - damit du dich nicht durch 30 Praxen telefonieren musst.'
	},
	for_other_name: {
		key: 'karl_for_other_name',
		fallback: 'Okay! Wie heißt die Person, für die du suchst? (Vorname reicht)'
	},
	location_default: {
		key: 'karl_location',
		fallback: 'Wo soll ich suchen? Gib mir eine PLZ oder einen Ort.'
	},
	location_with_name: {
		key: 'karl_location_with_name',
		fallback: 'Alles klar, ich such für {name}. Wo soll ich suchen? Gib mir eine PLZ oder einen Ort.'
	},
	insurance_type: {
		key: 'karl_insurance_type',
		fallback: 'Wie bist du versichert?'
	},
	insurance_details: {
		key: 'karl_age_group',
		fallback: 'Bist du über oder unter 21?'
	},
	therapy_type: {
		key: 'karl_therapy_type',
		fallback: 'Was für eine Therapie suchst du?'
	},
	preferences: {
		key: 'karl_preferences',
		fallback: 'Noch besondere Wünsche? Wähl aus was passt, dann klick "Weiter".'
	},
	searching: {
		key: 'karl_searching',
		fallback: 'Suche Therapeut:innen in deiner Nähe...'
	},
	results_found: {
		key: 'karl_results_found',
		fallback: 'Ich habe {count} Therapeut:innen gefunden! Klick auf "E-Mail schreiben" um sie direkt zu kontaktieren.'
	},
	results_empty: {
		key: 'karl_no_results',
		fallback: 'Hmm, ich habe leider keine passenden Therapeut:innen gefunden. Möchtest du die Kriterien anpassen?'
	},
	email_confirm: {
		key: 'email_sent_question',
		fallback: 'E-Mail abgeschickt?'
	},
	location_error: {
		key: 'karl_location_error',
		fallback: 'Das hab ich nicht ganz verstanden. Kannst du mir eine Postleitzahl geben?'
	},
	summary: {
		key: 'karl_summary_intro',
		fallback: 'Alles klar! Ich suche für dich:'
	}
};

