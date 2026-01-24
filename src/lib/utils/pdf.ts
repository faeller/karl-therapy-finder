import type { ContactAttempt } from '$lib/types';
import { m } from '$lib/paraglide/messages';

function getMethodText(contact: ContactAttempt): string {
	if (contact.method === 'email') return m.pdf_method_email();
	if (contact.method === 'phone') return m.pdf_method_phone();
	if (contact.method === 'auto-call') return m.pdf_method_phone();
	return contact.method;
}

export async function generatePdf(contacts: ContactAttempt[]) {
	// filter out pending contacts and those with < 3 months wait (don't qualify for kostenerstattung)
	const completedContacts = contacts.filter((c) =>
		c.status !== 'pending' &&
		c.waitingTime !== '< 3 Monate'
	);

	// dynamic import to avoid SSR issues
	const { jsPDF } = await import('jspdf');

	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	let y = 20;

	// title
	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text(m.pdf_title(), 20, y);
	y += 7;

	// date
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	const dateStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	doc.text(m.pdf_created_at({ date: dateStr }), 20, y);
	y += 10;

	// intro
	const introText = m.pdf_intro();
	const introLines = doc.splitTextToSize(introText, pageWidth - 40);
	doc.text(introLines, 20, y);
	y += introLines.length * 5 + 8;

	// table column positions
	const col1 = 22; // Datum
	const col2 = 46; // Praxis/Adresse
	const col3 = 125; // Kontakt
	const col4 = 150; // Rückmeldung
	const tableWidth = pageWidth - 40;
	const rowHeight = 8;

	// table header
	doc.setFillColor(220, 220, 220);
	doc.rect(20, y - 5, tableWidth, rowHeight, 'F');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.text(m.pdf_header_date(), col1, y);
	doc.text(m.pdf_header_practice(), col2, y);
	doc.text(m.pdf_header_method(), col3, y);
	doc.text(m.pdf_header_result(), col4, y);

	// header border
	doc.setDrawColor(150);
	doc.rect(20, y - 5, tableWidth, rowHeight);
	y += rowHeight;

	// table rows
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);

	completedContacts.forEach((contact, index) => {
		// check if we need a new page
		if (y > 270) {
			doc.addPage();
			y = 20;
			// repeat header on new page
			doc.setFillColor(220, 220, 220);
			doc.rect(20, y - 5, tableWidth, rowHeight, 'F');
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(9);
			doc.text(m.pdf_header_date(), col1, y);
			doc.text(m.pdf_header_practice(), col2, y);
			doc.text(m.pdf_header_method(), col3, y);
			doc.text(m.pdf_header_result(), col4, y);
			doc.setDrawColor(150);
			doc.rect(20, y - 5, tableWidth, rowHeight);
			y += rowHeight;
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8);
		}

		// row content
		const dateStr = new Date(contact.contactDate).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
		const timeStr = new Date(contact.contactDate).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit'
		});

		// build practice info (name + address + phone)
		let practiceInfo = contact.therapistName;
		if (contact.therapistAddress) {
			practiceInfo += '\n' + contact.therapistAddress;
		}
		if (contact.therapistPhone && (contact.method === 'phone' || contact.method === 'auto-call')) {
			practiceInfo += '\n' + m.pdf_tel_prefix() + ' ' + contact.therapistPhone;
		}

		const practiceLines = doc.splitTextToSize(practiceInfo, 78);
		const currentRowHeight = Math.max(rowHeight, practiceLines.length * 4 + 4);

		// alternating row background
		if (index % 2 === 0) {
			doc.setFillColor(250, 250, 250);
			doc.rect(20, y - 5, tableWidth, currentRowHeight, 'F');
		}

		// row border
		doc.setDrawColor(200);
		doc.rect(20, y - 5, tableWidth, currentRowHeight);

		// cell content
		doc.text(dateStr, col1, y);
		doc.text(timeStr, col1, y + 4);
		doc.text(practiceLines, col2, y);
		doc.text(getMethodText(contact), col3, y);
		doc.text(getResultText(contact), col4, y);

		y += currentRowHeight;
	});

	// legal note at bottom
	y += 10;
	if (y > 260) {
		doc.addPage();
		y = 20;
	}
	doc.setFontSize(8);
	doc.setTextColor(100);
	const legalText = m.pdf_legal();
	const legalLines = doc.splitTextToSize(legalText, pageWidth - 40);
	doc.text(legalLines, 20, y);
	doc.setTextColor(0);

	return doc;
}

export async function downloadPdf(contacts: ContactAttempt[]) {
	const doc = await generatePdf(contacts);
	doc.save(m.pdf_filename());
}

export async function viewPdf(contacts: ContactAttempt[]) {
	const doc = await generatePdf(contacts);
	const blob = doc.output('blob');
	const url = URL.createObjectURL(blob);
	window.open(url, '_blank');
}

function getResultText(contact: ContactAttempt): string {
	if (contact.status === 'no_reply') return m.status_no_reply();
	if (contact.status === 'pending') return m.status_pending();
	if (contact.status === 'sent') return m.status_sent();
	if (contact.waitingTime) {
		// clean up symbols for PDF
		const cleaned = contact.waitingTime
			.replace('> ', m.pdf_status_over() + ' ')
			.replace('< ', m.pdf_status_under() + ' ');
		return m.pdf_status_waiting({ time: cleaned });
	}
	return m.status_replied();
}
