import type { ContactAttempt } from '$lib/types';

export async function generatePdf(contacts: ContactAttempt[]) {
	// dynamic import to avoid SSR issues
	const { jsPDF } = await import('jspdf');

	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	let y = 20;

	// title
	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.text('Kontaktprotokoll Therapieplatzsuche', pageWidth / 2, y, { align: 'center' });
	y += 10;

	// subtitle
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, y, {
		align: 'center'
	});
	y += 15;

	// intro text
	doc.setFontSize(10);
	const introText =
		'Dieses Dokument dokumentiert meine Bemühungen, einen Therapieplatz zu finden. ' +
		'Es dient als Nachweis für das Kostenerstattungsverfahren gemäß § 13 Abs. 3 SGB V.';
	const introLines = doc.splitTextToSize(introText, pageWidth - 40);
	doc.text(introLines, 20, y);
	y += introLines.length * 5 + 10;

	// table header
	doc.setFont('helvetica', 'bold');
	doc.setFillColor(240, 240, 240);
	doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
	doc.text('Praxis', 22, y);
	doc.text('Datum', 90, y);
	doc.text('Kontaktweg', 115, y);
	doc.text('Ergebnis', 145, y);
	y += 8;

	// table rows
	doc.setFont('helvetica', 'normal');
	contacts.forEach((contact, index) => {
		if (y > 270) {
			doc.addPage();
			y = 20;
		}

		if (index % 2 === 0) {
			doc.setFillColor(250, 250, 250);
			doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
		}

		const name = contact.therapistName.substring(0, 25);
		const date = new Date(contact.contactDate).toLocaleDateString('de-DE');
		const method = contact.method === 'email' ? 'E-Mail' : contact.method;
		const result = getResultText(contact);

		doc.text(name, 22, y);
		doc.text(date, 90, y);
		doc.text(method, 115, y);
		doc.text(result, 145, y);
		y += 8;
	});

	// summary
	y += 10;
	const qualifying = contacts.filter(
		(c) =>
			c.status === 'no_reply' || c.waitingTime === '3-6 Monate' || c.waitingTime === '> 6 Monate'
	);

	doc.setFont('helvetica', 'bold');
	doc.text('Zusammenfassung:', 20, y);
	y += 6;
	doc.setFont('helvetica', 'normal');
	doc.text(`Gesamte Kontaktversuche: ${contacts.length}`, 20, y);
	y += 5;
	doc.text(`Keine Rückmeldung: ${contacts.filter((c) => c.status === 'no_reply').length}`, 20, y);
	y += 5;
	doc.text(`Wartezeit > 3 Monate: ${qualifying.length}`, 20, y);
	y += 15;

	// legal note
	doc.setFontSize(8);
	doc.setTextColor(100);
	const legalText =
		'Gemäß § 13 Abs. 3 SGB V haben Versicherte Anspruch auf Kostenerstattung, wenn die ' +
		'Krankenkasse eine unaufschiebbare Leistung nicht rechtzeitig erbringen kann. ' +
		'Bei psychotherapeutischen Behandlungen gilt eine Wartezeit von mehr als drei Monaten ' +
		'in der Regel als unzumutbar.';
	const legalLines = doc.splitTextToSize(legalText, pageWidth - 40);
	doc.text(legalLines, 20, y);

	doc.save('kontaktprotokoll.pdf');
}

function getResultText(contact: ContactAttempt): string {
	if (contact.status === 'no_reply') return 'Keine Antwort';
	if (contact.status === 'pending') return 'Ausstehend';
	if (contact.status === 'sent') return 'Gesendet';
	if (contact.waitingTime) return `Wartezeit: ${contact.waitingTime}`;
	return 'Antwort erhalten';
}
