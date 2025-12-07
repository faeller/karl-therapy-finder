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


