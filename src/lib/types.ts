// chat state machine
export type ChatState =
	| 'greeting'
	| 'for_whom'
	| 'for_other_name'
	| 'location'
	| 'insurance_type'
	| 'insurance_details'
	| 'therapy_type'
	| 'preferences'
	| 'urgency'
	| 'summary'
	| 'searching'
	| 'results'
	| 'email_sent_confirm';

export interface ChatOption {
	id: string;
	label: string;
	labelDe: string;
	emoji?: string;
	value: unknown;
	nextState?: ChatState;
}

export type EditableField =
	| 'forSelf'
	| 'clientName'
	| 'location'
	| 'insuranceType'
	| 'insuranceName'
	| 'therapyTypes'
	| 'preferences';

export interface ChatMessage {
	id: string;
	role: 'karl' | 'user';
	content: string;
	options?: ChatOption[];
	multiSelect?: boolean;
	inputType?: 'text' | 'plz';
	therapists?: Therapist[];
	timestamp: number;
	/** Which campaign field this user message answers */
	field?: EditableField;
}

export interface CampaignDraft {
	forSelf: boolean;
	clientName?: string;
	plz?: string;
	city?: string;
	radiusKm: number;
	insuranceType?: 'GKV' | 'PKV' | 'Selbstzahler';
	insuranceName?: string;
	kostenerstattung?: boolean;
	therapyTypes: string[];
	genderPref?: 'w' | 'm' | 'd' | null;
	languages: string[];
	specialties: string[];
	urgency: 'low' | 'medium' | 'high';
}

export interface Therapist {
	id: string;
	name: string;
	title?: string;
	address: string;
	phone?: string;
	email?: string;
	therapyTypes: string[];
	insurances: string[];
	languages: string[];
	distance?: number;
}

export interface ContactAttempt {
	id: string;
	therapistId: string;
	therapistName: string;
	therapistEmail?: string;
	therapistPhone?: string;
	therapistAddress?: string;
	method: 'email' | 'phone' | 'online';
	contactDate: string;
	status: 'pending' | 'sent' | 'replied' | 'no_reply';
	waitingTime?: string;
	notes?: string;
}
