// single source of truth: option id → campaign field update
import type { CampaignDraft } from '$lib/types';
import { OptionId, GenderIds } from './optionIds';

type CampaignUpdater = (draft: CampaignDraft) => CampaignDraft;

// maps option id to the campaign update it produces
const optionUpdaters: Record<string, CampaignUpdater> = {
	// for whom
	[OptionId.forSelf]: (d) => ({ ...d, forSelf: true }),
	[OptionId.forOther]: (d) => ({ ...d, forSelf: false }),

	// insurance
	[OptionId.gkv]: (d) => ({ ...d, insuranceType: 'GKV' }),
	[OptionId.pkv]: (d) => ({ ...d, insuranceType: 'PKV' }),
	[OptionId.selfPay]: (d) => ({ ...d, insuranceType: 'Selbstzahler' }),

	// age group
	[OptionId.adult]: (d) => ({ ...d, ageGroup: 'adult' }),
	[OptionId.youth]: (d) => ({ ...d, ageGroup: 'youth' }),

	// therapy type
	[OptionId.vt]: (d) => ({ ...d, therapyTypes: ['VT', 'Verhaltenstherapie'] }),
	[OptionId.tp]: (d) => ({ ...d, therapyTypes: ['TP', 'Tiefenpsychologie'] }),
	[OptionId.analyse]: (d) => ({ ...d, therapyTypes: ['Analyse', 'Psychoanalyse'] }),
	[OptionId.anyTherapy]: (d) => ({ ...d, therapyTypes: [] }),

	// preferences
	[OptionId.female]: (d) => ({ ...d, genderPref: 'w' }),
	[OptionId.male]: (d) => ({ ...d, genderPref: 'm' }),
	[OptionId.english]: (d) => ({ ...d, languages: ['de', 'en'] }),
	[OptionId.trauma]: (d) => ({ ...d, specialties: [...d.specialties, 'trauma'] }),
	[OptionId.noPreferences]: (d) => d,

	// terminservice
	[OptionId.terminserviceDone]: (d) => ({ ...d, terminserviceStatus: 'done' }),
	[OptionId.terminserviceSkip]: (d) => ({ ...d, terminserviceStatus: 'skipped' })
};

// apply a single option to campaign
export function applyOption(draft: CampaignDraft, optionId: string): CampaignDraft {
	const updater = optionUpdaters[optionId];
	return updater ? updater(draft) : draft;
}

// apply multiple options (for multi-select like preferences)
export function applyOptions(draft: CampaignDraft, optionIds: string[]): CampaignDraft {
	let result = draft;
	for (const id of optionIds) {
		result = applyOption(result, id);
	}
	return result;
}

// reset preferences before applying new ones (for multi-select edit)
export function resetPreferences(draft: CampaignDraft): CampaignDraft {
	return { ...draft, genderPref: undefined, languages: ['de'], specialties: [] };
}

// check if option id is a gender preference (mutually exclusive)
export function isGenderOption(id: string): boolean {
	return (GenderIds as readonly string[]).includes(id);
}
