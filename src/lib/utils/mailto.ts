import type { CampaignDraft } from '$lib/types';
import { m } from '$lib/paraglide/messages';

export function generateMailto(
	email: string,
	therapistName: string,
	campaign: CampaignDraft
): string {
	// Build insurance text based on type
	let insuranceText: string;
	if (campaign.insuranceType === 'GKV') {
		insuranceText = m.email_insurance_gkv();
	} else if (campaign.insuranceType === 'PKV') {
		insuranceText = m.email_insurance_pkv();
	} else {
		insuranceText = m.email_insurance_self();
	}

	// Build therapy text
	const therapyText = campaign.therapyTypes.length > 0
		? campaign.therapyTypes.join(' / ')
		: 'Psychotherapie';

	// Build subject
	const subject = encodeURIComponent(m.email_subject({ insurance: insuranceText }));

	// Build body parts
	const greeting = m.email_body_greeting();
	const intro = m.email_body_intro({ therapy: therapyText, insurance: insuranceText });
	const location = m.email_body_location({ plz: campaign.plz || '[PLZ]' });
	const question = m.email_body_question();
	const urgent = campaign.urgency === 'high' ? m.email_body_urgent() + '\n\n' : '';
	const thanks = m.email_body_thanks();
	const closing = m.email_body_closing();

	const body = encodeURIComponent(`${greeting}

${intro}

${location}

${question}

${urgent}${thanks}

${closing}`);

	return `mailto:${email}?subject=${subject}&body=${body}`;
}
