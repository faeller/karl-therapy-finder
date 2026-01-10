// state machine configuration - defines what each state needs
import type { ChatState, ChatOption, EditableField } from '$lib/types';
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
	erstgespraechOptions,
	probatorikOptions,
	hausarztOptions,
	antragOptions,
	widerspruchOptions,
	kostenerstattungGrantedOptions
} from '$lib/data/chatOptions';

export interface StateConfig {
	messageKey: string;
	options?: ChatOption[];
	inputType?: 'text' | 'plz';
	multiSelect?: boolean;
	// if true, needs dynamic params (handled by chat.ts)
	dynamic?: boolean;
	// field this state edits
	field?: EditableField;
}

// static state configurations
export const stateConfigs: Partial<Record<ChatState, StateConfig>> = {
	greeting: {
		messageKey: 'karl_greeting',
		options: forWhomOptions,
		field: 'forSelf'
	},
	for_other_name: {
		messageKey: 'karl_for_other_name',
		inputType: 'text',
		field: 'clientName'
	},
	location: {
		messageKey: 'karl_location',
		inputType: 'plz',
		options: locationOptions,
		dynamic: true,
		field: 'location'
	},
	insurance_type: {
		messageKey: 'karl_insurance_type',
		options: insuranceTypeOptions,
		field: 'insuranceType'
	},
	insurance_details: {
		messageKey: 'karl_age_group',
		options: ageGroupOptions
	},
	therapy_type: {
		messageKey: 'karl_therapy_type',
		options: therapyTypeOptions,
		field: 'therapyTypes'
	},
	preferences: {
		messageKey: 'karl_preferences',
		options: preferenceOptions,
		multiSelect: true,
		field: 'preferences'
	},
	summary: {
		messageKey: 'karl_summary',
		options: summaryOptions
	},
	edit_hint: {
		messageKey: 'karl_edit_hint',
		options: editHintOptions
	},
	terminservice: {
		messageKey: 'terminservice_intro',
		options: terminserviceOptions
	},
	// kostenerstattung flow
	erstgespraech_done: {
		messageKey: 'karl_erstgespraech_done',
		options: erstgespraechOptions
	},
	probatorik: {
		messageKey: 'karl_probatorik',
		options: probatorikOptions
	},
	hausarzt: {
		messageKey: 'karl_hausarzt',
		options: hausarztOptions
	},
	antrag_sent: {
		messageKey: 'karl_antrag_sent',
		options: antragOptions
	},
	widerspruch: {
		messageKey: 'karl_widerspruch',
		options: widerspruchOptions
	},
	kostenerstattung_granted: {
		messageKey: 'karl_kostenerstattung_granted',
		options: kostenerstattungGrantedOptions
	},
	success: {
		messageKey: 'karl_success'
	}
};

export const noResultsConfig: StateConfig = {
	messageKey: 'karl_no_results',
	options: noResultsOptions
};

// get field for current state
export function getFieldForState(state: ChatState): EditableField | undefined {
	return stateConfigs[state]?.field;
}
