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
	| 'edit_hint'
	| 'terminservice'
	| 'searching'
	| 'results';

export interface ChatOption {
	id: string;
	labelDe: string;
	emoji?: string;
	value: unknown;
	nextState?: ChatState;
	style?: 'primary' | 'secondary'; // secondary = dashed border help style
}

export type EditableField =
	| 'forSelf'
	| 'clientName'
	| 'location'
	| 'insuranceType'
	| 'therapyTypes'
	| 'preferences';

export interface ChatMessage {
	id: string;
	role: 'karl' | 'user';
	content: string;
	contentKey?: string;
	contentParams?: Record<string, unknown>;
	options?: ChatOption[];
	multiSelect?: boolean;
	inputType?: 'text' | 'plz';
	therapists?: Therapist[];
	timestamp: number;
	field?: EditableField;
}

export interface CampaignDraft {
	forSelf: boolean;
	clientName?: string;
	plz?: string;
	city?: string;
	radiusKm: number;
	insuranceType?: 'GKV' | 'PKV' | 'Selbstzahler';
	ageGroup?: 'adult' | 'youth';
	kostenerstattung?: boolean;
	therapyTypes: string[];
	genderPref?: 'w' | 'm' | 'd' | null;
	languages: string[];
	specialties: string[];
	urgency: 'low' | 'medium' | 'high';
	terminserviceStatus?: 'done' | 'skipped';
}

export interface Therapist {
	id: string;
	name: string;
	title?: string;
	qualification?: string;
	gender?: 'w' | 'm' | 'd';
	address: string;
	phone?: string;
	email?: string;
	therapyTypes: string[];
	insurances: string[];
	languages: string[];
	distance?: number;
	profileUrl?: string;
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
