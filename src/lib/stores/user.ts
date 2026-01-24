// user store - initialized from server page data
import { writable } from 'svelte/store';

export interface User {
	id: string;
	username: string;
	email: string | null;
	avatarUrl: string | null;
	pledgeTier: string | null;
	pledgeAmountCents: number | null;
	syncEnabled: boolean | null;
}

function createUserStore() {
	const { subscribe, set } = writable<User | null>(null);

	return {
		subscribe,
		set,
		logout: () => set(null),
		isLoggedIn: () => {
			let user: User | null = null;
			subscribe((u) => (user = u))();
			return user !== null;
		}
	};
}

export const user = createUserStore();

// helper to format pledge tier for display
export function formatPledgeTier(tier: string | null): string {
	if (!tier) return 'Free';
	const labels: Record<string, string> = {
		tropfen: 'Tropfen',
		quelle: 'Quelle',
		fluss: 'Fluss',
		welle: 'Welle',
		ozean: 'Ozean',
		// legacy tiers
		backer: 'Backer',
		supporter: 'Supporter',
		premium: 'Premium'
	};
	return labels[tier] ?? tier.charAt(0).toUpperCase() + tier.slice(1);
}

// helper to format pledge amount
export function formatPledgeAmount(cents: number | null): string {
	if (!cents) return '';
	return `${(cents / 100).toFixed(2)}`;
}
