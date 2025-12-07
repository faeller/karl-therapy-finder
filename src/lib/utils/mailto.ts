import type { CampaignDraft } from '$lib/types';

export function generateMailto(
	email: string,
	therapistName: string,
	campaign: CampaignDraft
): string {
	const insuranceText = campaign.insuranceType === 'GKV'
		? `gesetzlich versichert${campaign.insuranceName ? ` (${campaign.insuranceName})` : ''}`
		: campaign.insuranceType === 'PKV'
			? 'privat versichert'
			: 'Selbstzahler';

	const therapyText = campaign.therapyTypes.length > 0
		? campaign.therapyTypes.join(' oder ')
		: 'Psychotherapie';

	const subject = encodeURIComponent(`Anfrage Therapieplatz - ${insuranceText}`);

	const body = encodeURIComponent(`Sehr geehrte Damen und Herren,

ich suche einen Therapieplatz für ${therapyText} und bin ${insuranceText}.

Meine Postleitzahl ist ${campaign.plz || '[PLZ]'}.

Könnten Sie mir mitteilen, ob Sie derzeit neue Patient:innen aufnehmen? Falls nicht, wie lange wäre die ungefähre Wartezeit?

${campaign.urgency === 'high' ? 'Meine Situation ist dringend, daher wäre ich für eine baldige Rückmeldung sehr dankbar.\n\n' : ''}Vielen Dank im Voraus für Ihre Rückmeldung.

Mit freundlichen Grüßen`);

	return `mailto:${email}?subject=${subject}&body=${body}`;
}
