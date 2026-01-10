// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				username: string;
				email: string | null;
				avatarUrl: string | null;
				pledgeTier: string | null;
				pledgeAmountCents: number | null;
				syncEnabled: boolean | null;
			} | null;
			session: {
				id: string;
				userId: string;
				expiresAt: Date;
			} | null;
		}
		interface Platform {
			env?: {
				THERAPIST_CACHE?: KVNamespace;
				DB?: D1Database;
			};
		}
		interface PageData {
			user: Locals['user'];
		}
	}
}

export {};
