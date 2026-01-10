// server-side encryption for sync data
// uses AES-256-GCM with key from env, encrypts at rest in D1

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

let cachedKey: CryptoKey | null = null;

async function getKey(env: Record<string, string | undefined>): Promise<CryptoKey> {
	if (cachedKey) return cachedKey;

	const keyString = env.SYNC_ENCRYPTION_KEY;
	if (!keyString) {
		throw new Error('SYNC_ENCRYPTION_KEY not configured');
	}

	// key should be 32 bytes base64 encoded
	const keyBytes = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
	if (keyBytes.length !== 32) {
		throw new Error('SYNC_ENCRYPTION_KEY must be 32 bytes base64 encoded');
	}

	cachedKey = await crypto.subtle.importKey(
		'raw',
		keyBytes,
		{ name: ALGORITHM },
		false,
		['encrypt', 'decrypt']
	);

	return cachedKey;
}

export async function encrypt(
	plaintext: string,
	env: Record<string, string | undefined>
): Promise<string> {
	const key = await getKey(env);
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encoded = new TextEncoder().encode(plaintext);

	const ciphertext = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv },
		key,
		encoded
	);

	// prepend iv to ciphertext, base64 encode
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(ciphertext), iv.length);

	return btoa(String.fromCharCode(...combined));
}

export async function decrypt(
	encrypted: string,
	env: Record<string, string | undefined>
): Promise<string> {
	const key = await getKey(env);
	const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

	const iv = combined.slice(0, IV_LENGTH);
	const ciphertext = combined.slice(IV_LENGTH);

	const decrypted = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv },
		key,
		ciphertext
	);

	return new TextDecoder().decode(decrypted);
}

// generate a new key for .env
export function generateKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes));
}
