// umami event tracking
import { browser } from '$app/environment';

declare global {
	interface Window {
		umami?: {
			track: (event: string, data?: Record<string, unknown>) => void;
		};
	}
}

export function track(event: string, data?: Record<string, unknown>) {
	if (!browser || !window.umami) return;
	window.umami.track(event, data);
}
