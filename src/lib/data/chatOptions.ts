import type { ChatOption, ChatState } from '$lib/types';

export const forWhomOptions: ChatOption[] = [
	{ id: 'for_self', labelDe: 'Für mich selbst', emoji: '🙋', value: true, nextState: 'location' },
	{ id: 'for_other', labelDe: 'Für jemand anderen', emoji: '🤝', value: false, nextState: 'for_other_name' }
];

export const locationOptions: ChatOption[] = [
	{ id: 'use_location', labelDe: 'Standort automatisch ermitteln', emoji: '📍', value: 'geolocation' }
];

export const insuranceTypeOptions: ChatOption[] = [
	{ id: 'gkv', labelDe: 'Gesetzlich (GKV)', emoji: '🏥', value: 'GKV', nextState: 'insurance_details' },
	{ id: 'pkv', labelDe: 'Privat (PKV)', emoji: '💳', value: 'PKV', nextState: 'therapy_type' },
	{ id: 'self_pay', labelDe: 'Selbstzahler', emoji: '💶', value: 'Selbstzahler', nextState: 'therapy_type' }
];

export const ageGroupOptions: ChatOption[] = [
	{ id: 'adult', labelDe: 'Über 21 (Erwachsene)', emoji: '🧑', value: 'adult', nextState: 'therapy_type' },
	{ id: 'youth', labelDe: 'Unter 21 (KJP möglich)', emoji: '👶', value: 'youth', nextState: 'therapy_type' }
];

export const therapyTypeOptions: ChatOption[] = [
	{ id: 'vt', labelDe: 'Verhaltenstherapie', value: ['VT', 'Verhaltenstherapie'], nextState: 'preferences' },
	{ id: 'tp', labelDe: 'Tiefenpsychologie', value: ['TP', 'Tiefenpsychologie'], nextState: 'preferences' },
	{ id: 'analyse', labelDe: 'Psychoanalyse', value: ['Analyse', 'Psychoanalyse'], nextState: 'preferences' },
	{ id: 'any_therapy', labelDe: 'Ist mir egal', emoji: '🤷', value: [], nextState: 'preferences' }
];

export const preferenceOptions: ChatOption[] = [
	{ id: 'female', labelDe: 'Weibliche Therapeutin', emoji: '👩', value: { genderPref: 'w' } },
	{ id: 'male', labelDe: 'Männlicher Therapeut', emoji: '👨', value: { genderPref: 'm' } },
	{ id: 'english', labelDe: 'Englisch', emoji: '🇬🇧', value: { languages: ['de', 'en'] } },
	{ id: 'trauma', labelDe: 'Traumatherapie', value: { specialties: ['trauma'] } }
];

export const summaryOptions: ChatOption[] = [
	{ id: 'start_search', labelDe: "Los geht's!", emoji: '🔍', value: true, nextState: 'terminservice' },
	{ id: 'change_criteria', labelDe: 'Nochmal ändern', emoji: '✏️', value: false, nextState: 'edit_hint' }
];

export const terminserviceOptions: ChatOption[] = [
	{ id: 'terminservice_done', labelDe: 'Weiter zu Schritt 2', emoji: '→', value: true, nextState: 'searching' },
	{ id: 'terminservice_skip', labelDe: 'Überspringen', value: false, nextState: 'searching' }
];

export const editHintOptions: ChatOption[] = [
	{ id: 'start_search', labelDe: "Los geht's!", emoji: '🔍', value: true, nextState: 'searching' }
];

export const emailConfirmOptions: ChatOption[] = [
	{ id: 'yes_sent', labelDe: 'Ja, abgeschickt', emoji: '✅', value: true, nextState: 'results' },
	{ id: 'no_cancelled', labelDe: 'Nein, abgebrochen', emoji: '❌', value: false, nextState: 'results' }
];

export const phoneConfirmOptions: ChatOption[] = [
	{ id: 'yes_called', labelDe: 'Ja, angerufen', emoji: '✅', value: true, nextState: 'results' },
	{ id: 'no_cancelled', labelDe: 'Nein, abgebrochen', emoji: '❌', value: false, nextState: 'results' }
];

export const noResultsOptions: ChatOption[] = [
	{ id: 'change_criteria', labelDe: 'Kriterien ändern', value: true, nextState: 'greeting' }
];

export const reSearchOptions: ChatOption[] = [
	{ id: 'replace_results', labelDe: 'Ersetzen', emoji: '🔄', value: 'replace', nextState: 'searching' },
	{ id: 'merge_results', labelDe: 'Zusammenführen', emoji: '➕', value: 'merge', nextState: 'searching' }
];


