import type { ChatOption } from '$lib/types';
import { OptionId } from './optionIds';

export const themeOptions: ChatOption[] = [
	{ id: OptionId.themeCool, labelDe: 'Cool (Handgezeichnet)', emoji: '✏️', isAction: true },
	{ id: OptionId.themeModern, labelDe: 'Modern (Clean)', emoji: '📱', isAction: true }
];

export const themeNextOption: ChatOption = {
	id: OptionId.themeNext,
	labelDe: 'Weiter',
	style: 'primary',
	isAction: true
};

export const forWhomOptions: ChatOption[] = [
	{ id: OptionId.forSelf, labelDe: 'Für mich selbst', emoji: '🙋', nextState: 'theme_choice' },
	{ id: OptionId.forOther, labelDe: 'Für jemand anderen', emoji: '🤝', nextState: 'theme_choice' }
];

export const locationOptions: ChatOption[] = [
	{ id: OptionId.useLocation, labelDe: 'Standort automatisch ermitteln', emoji: '📍', isAction: true }
];

export const insuranceTypeOptions: ChatOption[] = [
	{ id: OptionId.gkv, labelDe: 'Gesetzlich (GKV)', emoji: '🏥', nextState: 'insurance_details' },
	{ id: OptionId.pkv, labelDe: 'Privat (PKV)', emoji: '💳', nextState: 'preferences' },
	{ id: OptionId.selfPay, labelDe: 'Selbstzahler', emoji: '💶', nextState: 'preferences' }
];

export const ageGroupOptions: ChatOption[] = [
	{ id: OptionId.adult, labelDe: 'Über 21 (Erwachsene)', emoji: '🧑', nextState: 'preferences' },
	{ id: OptionId.youth, labelDe: 'Unter 21 (KJP möglich)', emoji: '👶', nextState: 'preferences' }
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

// results action buttons (shown in results section)
export const resultsActionOptions: ChatOption[] = [
	{ id: OptionId.hadErstgespraech, labelDe: 'Ich hatte mein Erstgespräch', nextState: 'erstgespraech_done', isAction: true },
	{ id: OptionId.foundTherapist, labelDe: 'Ich hab einen Therapieplatz!', nextState: 'success', isAction: true }
];

// kostenerstattung flow
export const erstgespraechOptions: ChatOption[] = [
	{ id: OptionId.hasPtv11, labelDe: 'Ja, ich habe das PTV-11', nextState: 'ptv11_dringend' },
	{ id: OptionId.noPtv11, labelDe: 'Nein / Weiß nicht', nextState: 'hausarzt' }
];

export const ptv11DringendOptions: ChatOption[] = [
	{ id: OptionId.dringendYes, labelDe: 'Ja, ist angekreuzt', nextState: 'probatorik' },
	{ id: OptionId.dringendNo, labelDe: 'Nein / Weiß nicht', nextState: 'hausarzt' }
];

export const probatorikOptions: ChatOption[] = [
	{ id: OptionId.probatorikDone, labelDe: 'Ja, Probatorik gemacht', nextState: 'hausarzt' },
	{ id: OptionId.probatorikSkip, labelDe: 'Nein, übersprungen', nextState: 'hausarzt' }
];

export const hausarztOptions: ChatOption[] = [
	{ id: OptionId.hausarztDone, labelDe: 'Bescheinigung geholt', nextState: 'antrag_einreichen' }
];

export const antragEinreichenOptions: ChatOption[] = [
	{ id: OptionId.antragEingereicht, labelDe: 'Antrag abgeschickt', nextState: 'antrag_sent' }
];

export const antragOptions: ChatOption[] = [
	{ id: OptionId.antragApproved, labelDe: 'Genehmigt!', nextState: 'kostenerstattung_granted' },
	{ id: OptionId.antragDeclined, labelDe: 'Abgelehnt', nextState: 'widerspruch' }
];

export const widerspruchOptions: ChatOption[] = [
	{ id: OptionId.widerspruchEingereicht, labelDe: 'Widerspruch eingereicht', nextState: 'antrag_sent' }
];

export const kostenerstattungGrantedOptions: ChatOption[] = [
	{ id: OptionId.findPrivateTherapist, labelDe: 'therapie.de öffnen', isAction: true }
];
