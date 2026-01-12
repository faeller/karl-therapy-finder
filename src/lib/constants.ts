// centralized constants

// localStorage keys
export const STORAGE_KEYS = {
	campaign: 'karl-campaign',
	contacts: 'karl-contacts',
	chatState: 'karl-chat-state',
	chatMessages: 'karl-chat-messages',
	theme: 'karl-theme'
} as const;

// message content keys that get special handling (rendered in dedicated sections)
export const SEPARATELY_RENDERED_KEYS = [
	'terminservice_intro',
	'karl_searching',
	'karl_erstgespraech_done',
	'karl_ptv11_dringend',
	'karl_probatorik',
	'karl_hausarzt',
	'karl_antrag_einreichen',
	'karl_antrag_sent',
	'karl_widerspruch',
	'karl_kostenerstattung_granted',
	'karl_success'
] as const;

// cache TTL for therapist API (3 hours in seconds)
export const THERAPIST_CACHE_TTL = 3 * 60 * 60;

// pagination defaults
export const THERAPIST_LIST: { initialShow: number; loadMoreCount: number } = {
	initialShow: 5,
	loadMoreCount: 5
};
