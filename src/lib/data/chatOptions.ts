import type { ChatOption } from '$lib/types';
import { OptionId } from './optionIds';

export const forWhomOptions: ChatOption[] = [
	{ id: OptionId.forSelf, labelDe: 'Für mich selbst', emoji: '🙋', value: true, nextState: 'location' },
	{ id: OptionId.forOther, labelDe: 'Für jemand anderen', emoji: '🤝', value: false, nextState: 'for_other_name' }
];

export const locationOptions: ChatOption[] = [
	{ id: OptionId.useLocation, labelDe: 'Standort automatisch ermitteln', emoji: '📍', value: 'geolocation' }
];

export const insuranceTypeOptions: ChatOption[] = [
	{ id: OptionId.gkv, labelDe: 'Gesetzlich (GKV)', emoji: '🏥', value: 'GKV', nextState: 'insurance_details' },
	{ id: OptionId.pkv, labelDe: 'Privat (PKV)', emoji: '💳', value: 'PKV', nextState: 'therapy_type' },
	{ id: OptionId.selfPay, labelDe: 'Selbstzahler', emoji: '💶', value: 'Selbstzahler', nextState: 'therapy_type' }
];

export const ageGroupOptions: ChatOption[] = [
	{ id: OptionId.adult, labelDe: 'Über 21 (Erwachsene)', emoji: '🧑', value: 'adult', nextState: 'therapy_type' },
	{ id: OptionId.youth, labelDe: 'Unter 21 (KJP möglich)', emoji: '👶', value: 'youth', nextState: 'therapy_type' }
];

export const therapyTypeOptions: ChatOption[] = [
	{ id: OptionId.vt, labelDe: 'Verhaltenstherapie', value: ['VT', 'Verhaltenstherapie'], nextState: 'preferences' },
	{ id: OptionId.tp, labelDe: 'Tiefenpsychologie', value: ['TP', 'Tiefenpsychologie'], nextState: 'preferences' },
	{ id: OptionId.analyse, labelDe: 'Psychoanalyse', value: ['Analyse', 'Psychoanalyse'], nextState: 'preferences' },
	{ id: OptionId.anyTherapy, labelDe: 'Ist mir egal', emoji: '🤷', value: [], nextState: 'preferences' }
];

export const preferenceOptions: ChatOption[] = [
	{ id: OptionId.female, labelDe: 'Weibliche Therapeutin', emoji: '👩', value: { genderPref: 'w' } },
	{ id: OptionId.male, labelDe: 'Männlicher Therapeut', emoji: '👨', value: { genderPref: 'm' } },
	{ id: OptionId.english, labelDe: 'Englisch', emoji: '🇬🇧', value: { languages: ['de', 'en'] } },
	{ id: OptionId.trauma, labelDe: 'Traumatherapie', value: { specialties: ['trauma'] } }
];

export const summaryOptions: ChatOption[] = [
	{ id: OptionId.startSearch, labelDe: "Los geht's!", emoji: '🔍', value: true, nextState: 'terminservice' },
	{ id: OptionId.changeCriteria, labelDe: 'Nochmal ändern', emoji: '✏️', value: false, nextState: 'edit_hint' }
];

export const terminserviceOptions: ChatOption[] = [
	{ id: OptionId.terminserviceDone, labelDe: 'Weiter zu Schritt 2', emoji: '→', value: true, nextState: 'searching' },
	{ id: OptionId.terminserviceSkip, labelDe: 'Überspringen', value: false, nextState: 'searching' }
];

export const editHintOptions: ChatOption[] = [
	{ id: OptionId.startSearch, labelDe: "Los geht's!", emoji: '🔍', value: true, nextState: 'searching' }
];

export const emailConfirmOptions: ChatOption[] = [
	{ id: OptionId.yesSent, labelDe: 'Ja, abgeschickt', emoji: '✅', value: true, nextState: 'results' },
	{ id: OptionId.noCancelled, labelDe: 'Nein, abgebrochen', emoji: '❌', value: false, nextState: 'results' }
];

export const phoneConfirmOptions: ChatOption[] = [
	{ id: OptionId.yesCalled, labelDe: 'Ja, angerufen', emoji: '✅', value: true, nextState: 'results' },
	{ id: OptionId.noCancelled, labelDe: 'Nein, abgebrochen', emoji: '❌', value: false, nextState: 'results' }
];

export const noResultsOptions: ChatOption[] = [
	{ id: OptionId.changeCriteria, labelDe: 'Kriterien ändern', value: true, nextState: 'greeting' }
];

export const reSearchOptions: ChatOption[] = [
	{ id: OptionId.replaceResults, labelDe: 'Ersetzen', emoji: '🔄', value: 'replace', nextState: 'searching' },
	{ id: OptionId.mergeResults, labelDe: 'Zusammenführen', emoji: '➕', value: 'merge', nextState: 'searching' }
];
