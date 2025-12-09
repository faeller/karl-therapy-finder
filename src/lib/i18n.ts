/**
 * i18n wrapper with inline fallbacks.
 *
 * Usage:
 *   t('chat_header', 'Therapieplatz-Finder')
 *   t('hello_name', 'Hello {name}!', { name: 'World' })
 *
 * Run `pnpm run i18n:extract` to sync fallbacks to messages/de.json
 */

import * as messages from '$lib/paraglide/messages';

type MessageFn = (params?: Record<string, unknown>) => string;
type Messages = Record<string, MessageFn>;

/**
 * Get a translated message with inline fallback.
 *
 * @param key - The message key (will be added to de.json on extract)
 * @param fallback - Default text (German) shown if key doesn't exist yet
 * @param params - Interpolation params like { name: 'World' }
 */
export function t(key: string, fallback: string, params?: Record<string, unknown>): string {
	// Try to get the Paraglide message function
	const m = messages.m as unknown as Messages;
	const fn = m[key];

	if (typeof fn === 'function') {
		try {
			return fn(params);
		} catch {
			// Function exists but params might be wrong, fall back
		}
	}

	// Fallback: interpolate params into the default string
	if (params) {
		return fallback.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
	}

	return fallback;
}

/**
 * Re-export Paraglide's setLocale and getLocale for convenience
 */
export { setLocale, getLocale } from '$lib/paraglide/runtime';
