// option ids as const for type safety and autocomplete
export const OptionId = {
	// for whom
	forSelf: 'for_self',
	forOther: 'for_other',

	// location
	useLocation: 'use_location',

	// insurance
	gkv: 'gkv',
	pkv: 'pkv',
	selfPay: 'self_pay',

	// age group
	adult: 'adult',
	youth: 'youth',

	// therapy type
	vt: 'vt',
	tp: 'tp',
	analyse: 'analyse',
	anyTherapy: 'any_therapy',

	// preferences
	female: 'female',
	male: 'male',
	english: 'english',
	trauma: 'trauma',
	noPreferences: 'no_preferences',

	// summary
	startSearch: 'start_search',
	changeCriteria: 'change_criteria',

	// terminservice
	terminserviceDone: 'terminservice_done',
	terminserviceSkip: 'terminservice_skip',

	// contact confirmation
	yesSent: 'yes_sent',
	yesCalled: 'yes_called',
	noCancelled: 'no_cancelled',

	// re-search
	replaceResults: 'replace_results',
	mergeResults: 'merge_results'
} as const;

export type OptionIdType = (typeof OptionId)[keyof typeof OptionId];

// groups for validation
export const InsuranceIds = [OptionId.gkv, OptionId.pkv, OptionId.selfPay] as const;
export const AgeGroupIds = [OptionId.adult, OptionId.youth] as const;
export const TherapyTypeIds = [OptionId.vt, OptionId.tp, OptionId.analyse, OptionId.anyTherapy] as const;
export const PreferenceIds = [OptionId.female, OptionId.male, OptionId.english, OptionId.trauma] as const;
export const GenderIds = [OptionId.female, OptionId.male] as const;
