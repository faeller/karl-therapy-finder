// umami event tracking
import { browser } from '$app/environment';

const UMAMI_WEBSITE_ID = 'c4196d63-50f3-48d2-b422-6e4d22f784bf';
const UMAMI_HOST = 'https://stats.faeller.me/karl';

declare global {
	interface Window {
		umami?: {
			track: (event: string, data?: Record<string, unknown>) => void;
		};
	}
}

// client-side tracking
export function track(event: string, data?: Record<string, unknown>) {
	if (!browser || !window.umami) return;
	window.umami.track(event, data);
}

// server-side tracking
export async function trackServer(event: string, data?: Record<string, unknown>) {
	try {
		await fetch(`${UMAMI_HOST}/api/send`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'event',
				payload: {
					website: UMAMI_WEBSITE_ID,
					hostname: 'karl-helps.org',
					url: '/api/calls/schedule',
					name: event,
					data
				}
			})
		});
	} catch {
		// ignore tracking errors
	}
}
