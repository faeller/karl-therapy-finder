import type { Therapist } from '$lib/types';

// mock therapist data for prototype
export const mockTherapists: Therapist[] = [
	{
		id: '1',
		name: 'Dr. Sabine Müller',
		title: 'Psychologische Psychotherapeutin',
		address: 'Königstraße 42, 90402 Nürnberg',
		phone: '0911 123456',
		email: 'praxis@mueller-therapie.de',
		therapyTypes: ['Verhaltenstherapie'],
		insurances: ['GKV', 'PKV'],
		languages: ['de', 'en'],
		distance: 2.3
	},
	{
		id: '2',
		name: 'Michael Weber',
		title: 'Psychologischer Psychotherapeut',
		address: 'Breite Gasse 15, 90402 Nürnberg',
		phone: '0911 234567',
		email: 'kontakt@weber-psychotherapie.de',
		therapyTypes: ['Tiefenpsychologie', 'Psychoanalyse'],
		insurances: ['GKV', 'PKV', 'Selbstzahler'],
		languages: ['de'],
		distance: 3.1
	},
	{
		id: '3',
		name: 'Dr. Anna Schmidt',
		title: 'Fachärztin für Psychiatrie und Psychotherapie',
		address: 'Äußere Sulzbacher Str. 118, 90491 Nürnberg',
		phone: '0911 345678',
		email: 'info@praxis-schmidt.de',
		therapyTypes: ['Verhaltenstherapie', 'EMDR'],
		insurances: ['GKV', 'PKV'],
		languages: ['de', 'en', 'fr'],
		distance: 4.5
	},
	{
		id: '4',
		name: 'Thomas Becker',
		title: 'Psychologischer Psychotherapeut',
		address: 'Fürther Str. 212, 90429 Nürnberg',
		phone: '0911 456789',
		email: undefined,
		therapyTypes: ['Tiefenpsychologie'],
		insurances: ['GKV'],
		languages: ['de', 'tr'],
		distance: 5.2
	},
	{
		id: '5',
		name: 'Dr. Elena Petrova',
		title: 'Psychologische Psychotherapeutin',
		address: 'Hallplatz 2, 90402 Nürnberg',
		phone: '0911 567890',
		email: 'praxis@petrova-therapie.de',
		therapyTypes: ['Verhaltenstherapie', 'Schematherapie'],
		insurances: ['GKV', 'PKV', 'Selbstzahler'],
		languages: ['de', 'ru', 'en'],
		distance: 1.8
	}
];

// filter therapists based on campaign criteria
export function filterTherapists(
	therapists: Therapist[],
	criteria: {
		therapyTypes?: string[];
		insuranceType?: string;
		languages?: string[];
	}
): Therapist[] {
	return therapists.filter((t) => {
		if (criteria.therapyTypes?.length) {
			const hasMatch = criteria.therapyTypes.some((type) =>
				t.therapyTypes.some((tt) => tt.toLowerCase().includes(type.toLowerCase()))
			);
			if (!hasMatch) return false;
		}

		if (criteria.insuranceType) {
			if (!t.insurances.includes(criteria.insuranceType)) return false;
		}

		if (criteria.languages?.length && criteria.languages.length > 1) {
			const hasMatch = criteria.languages.some((lang) => t.languages.includes(lang));
			if (!hasMatch) return false;
		}

		return true;
	});
}
