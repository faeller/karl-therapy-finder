import type { ChatOption } from '$lib/types';
import { OptionId } from './optionIds';

export const forWhomOptions: ChatOption[] = [
	{ id: OptionId.forSelf, labelDe: 'Für mich selbst', emoji: '🙋', nextState: 'location' },
	{ id: OptionId.forOther, labelDe: 'Für jemand anderen', emoji: '🤝', nextState: 'for_other_name' }
];

export const locationOptions: ChatOption[] = [
	{ id: OptionId.useLocation, labelDe: 'Standort automatisch ermitteln', emoji: '📍', isAction: true }
];

export const insuranceTypeOptions: ChatOption[] = [
	{ id: OptionId.gkv, labelDe: 'Gesetzlich (GKV)', emoji: '🏥', nextState: 'insurance_details' },
	{ id: OptionId.pkv, labelDe: 'Privat (PKV)', emoji: '💳', nextState: 'therapy_type' },
	{ id: OptionId.selfPay, labelDe: 'Selbstzahler', emoji: '💶', nextState: 'therapy_type' }
];

export const ageGroupOptions: ChatOption[] = [
	{ id: OptionId.adult, labelDe: 'Über 21 (Erwachsene)', emoji: '🧑', nextState: 'therapy_type' },
	{ id: OptionId.youth, labelDe: 'Unter 21 (KJP möglich)', emoji: '👶', nextState: 'therapy_type' }
];

export const therapyTypeOptions: ChatOption[] = [
	{ id: OptionId.vt, labelDe: 'Verhaltenstherapie', nextState: 'preferences' },
	{ id: OptionId.tp, labelDe: 'Tiefenpsychologie', nextState: 'preferences' },
	{ id: OptionId.analyse, labelDe: 'Psychoanalyse', nextState: 'preferences' },
	{ id: OptionId.anyTherapy, labelDe: 'Ist mir egal', emoji: '🤷', nextState: 'preferences' }
];

export const preferenceOptions: ChatOption[] = [
	{ id: OptionId.female, labelDe: 'Weibliche Therapeutin', emoji: '👩' },
	{ id: OptionId.male, labelDe: 'Männlicher Therapeut', emoji: '👨' },
	{ id: OptionId.english, labelDe: 'Englisch', emoji: '🇬🇧' },
	{ id: OptionId.trauma, labelDe: 'Traumatherapie' }
];

export const summaryOptions: ChatOption[] = [
	{ id: OptionId.startSearch, labelDe: "Los geht's!", emoji: '🔍', nextState: 'terminservice', isAction: true },
	{ id: OptionId.changeCriteria, labelDe: 'Nochmal ändern', emoji: '✏️', nextState: 'edit_hint', isAction: true }
];

export const terminserviceOptions: ChatOption[] = [
	{ id: OptionId.terminserviceDone, labelDe: 'Weiter zu Schritt 2', emoji: '→', nextState: 'searching', isAction: true },
	{ id: OptionId.terminserviceSkip, labelDe: 'Überspringen', nextState: 'searching', isAction: true }
];

export const editHintOptions: ChatOption[] = [
	{ id: OptionId.startSearch, labelDe: "Los geht's!", emoji: '🔍', nextState: 'searching', isAction: true }
];

export const emailConfirmOptions: ChatOption[] = [
	{ id: OptionId.yesSent, labelDe: 'Ja, abgeschickt', emoji: '✅', nextState: 'results', isAction: true },
	{ id: OptionId.noCancelled, labelDe: 'Nein, abgebrochen', emoji: '❌', nextState: 'results', isAction: true }
];

export const phoneConfirmOptions: ChatOption[] = [
	{ id: OptionId.yesCalled, labelDe: 'Ja, angerufen', emoji: '✅', nextState: 'results', isAction: true },
	{ id: OptionId.noCancelled, labelDe: 'Nein, abgebrochen', emoji: '❌', nextState: 'results', isAction: true }
];

export const noResultsOptions: ChatOption[] = [
	{ id: OptionId.changeCriteria, labelDe: 'Kriterien ändern', nextState: 'greeting', isAction: true }
];

export const reSearchOptions: ChatOption[] = [
	{ id: OptionId.replaceResults, labelDe: 'Ersetzen', emoji: '🔄', nextState: 'searching', isAction: true },
	{ id: OptionId.mergeResults, labelDe: 'Zusammenführen', emoji: '➕', nextState: 'searching', isAction: true }
];
