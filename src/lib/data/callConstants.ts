// call status and outcome constants with labels

export const CallStatus = {
	SCHEDULED: 'scheduled',
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
	FAILED: 'failed',
	CANCELLED: 'cancelled',
	FROZEN: 'frozen'
} as const;

export type CallStatus = (typeof CallStatus)[keyof typeof CallStatus];

export const CallOutcome = {
	SUCCESS: 'success',
	CALLBACK: 'callback',
	NO_ANSWER: 'no_answer',
	NO_AVAILABILITY: 'no_availability',
	REJECTED_AI: 'rejected_ai',
	REJECTED_PRIVACY: 'rejected_privacy',
	REJECTED_OTHER: 'rejected_other',
	UNCLEAR: 'unclear',
	CONNECTION_FAILED: 'connection_failed'
} as const;

export type CallOutcome = (typeof CallOutcome)[keyof typeof CallOutcome];

// german labels
export const STATUS_LABELS: Record<CallStatus, string> = {
	[CallStatus.SCHEDULED]: 'Geplant',
	[CallStatus.IN_PROGRESS]: 'Läuft',
	[CallStatus.COMPLETED]: 'Abgeschlossen',
	[CallStatus.FAILED]: 'Fehlgeschlagen',
	[CallStatus.CANCELLED]: 'Abgebrochen',
	[CallStatus.FROZEN]: 'Pausiert'
};

export const OUTCOME_LABELS: Record<CallOutcome, string> = {
	[CallOutcome.SUCCESS]: 'Termin vereinbart',
	[CallOutcome.CALLBACK]: 'Rückruf erbeten',
	[CallOutcome.NO_ANSWER]: 'Nicht erreicht',
	[CallOutcome.NO_AVAILABILITY]: 'Kein Platz frei',
	[CallOutcome.REJECTED_AI]: 'KI abgelehnt',
	[CallOutcome.REJECTED_PRIVACY]: 'Datenschutz-Bedenken',
	[CallOutcome.REJECTED_OTHER]: 'Abgelehnt',
	[CallOutcome.UNCLEAR]: 'Unklar',
	[CallOutcome.CONNECTION_FAILED]: 'Verbindung fehlgeschlagen'
};

// colors for status badges
export const STATUS_COLORS: Record<CallStatus, string> = {
	[CallStatus.SCHEDULED]: 'text-blue-pen',
	[CallStatus.IN_PROGRESS]: 'text-yellow-600',
	[CallStatus.COMPLETED]: 'text-green-600',
	[CallStatus.FAILED]: 'text-red-marker',
	[CallStatus.CANCELLED]: 'text-pencil/60',
	[CallStatus.FROZEN]: 'text-cyan-600'
};

// colors for outcome badges
export const OUTCOME_COLORS: Record<CallOutcome, string> = {
	[CallOutcome.SUCCESS]: 'bg-green-100 text-green-800 border-green-300',
	[CallOutcome.CALLBACK]: 'bg-blue-100 text-blue-800 border-blue-300',
	[CallOutcome.NO_ANSWER]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
	[CallOutcome.NO_AVAILABILITY]: 'bg-orange-100 text-orange-800 border-orange-300',
	[CallOutcome.REJECTED_AI]: 'bg-red-100 text-red-800 border-red-300',
	[CallOutcome.REJECTED_PRIVACY]: 'bg-red-100 text-red-800 border-red-300',
	[CallOutcome.REJECTED_OTHER]: 'bg-red-100 text-red-800 border-red-300',
	[CallOutcome.UNCLEAR]: 'bg-gray-100 text-gray-800 border-gray-300',
	[CallOutcome.CONNECTION_FAILED]: 'bg-red-100 text-red-800 border-red-300'
};

// helper functions
export function getStatusLabel(status: string): string {
	return STATUS_LABELS[status as CallStatus] || status;
}

export function getOutcomeLabel(outcome: string): string {
	return OUTCOME_LABELS[outcome as CallOutcome] || outcome;
}

export function getStatusColor(status: string): string {
	return STATUS_COLORS[status as CallStatus] || 'text-pencil';
}

export function getOutcomeColor(outcome: string): string {
	return OUTCOME_COLORS[outcome as CallOutcome] || 'bg-gray-100 text-gray-800 border-gray-300';
}
