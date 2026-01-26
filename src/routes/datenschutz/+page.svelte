<script lang="ts">
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Datenschutz - KARL</title>
</svelte:head>

<div class="min-h-screen bg-paper px-4 py-8">
	<div class="mx-auto max-w-3xl">
		<a href="/" class="mb-6 inline-flex items-center gap-2 text-sm text-pencil/60 hover:text-pencil transition-colors">
			<ArrowLeft size={16} />
			Zurück
		</a>

		<WobblyCard class="prose prose-pencil max-w-none">
			<h1>Datenschutzerklärung</h1>

			<div class="info-box">
				<h3>Open Source</h3>
				<p>KARL ist freie, quelloffene Software (FOSS). Der Code ist öffentlich einsehbar auf <a href="https://github.com/faeller/karl-therapy-finder" target="_blank" rel="noopener noreferrer">GitHub</a>. Sie können selbst nachvollziehen, wie Ihre Daten verarbeitet werden.</p>
			</div>

			<br>
			<h2>1. Datenschutz auf einen Blick</h2>

			<h3>Allgemeine Hinweise</h3>
			<p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. KARL unterscheidet zwischen zwei Nutzungsarten: ohne Anmeldung (nur lokale Speicherung) und mit Anmeldung (Cloud-Synchronisation).</p>

			<h3>Wer ist verantwortlich?</h3>
			<p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Kontaktdaten finden Sie im <a href="/impressum">Impressum</a>.</p>

			<div class="info-box">
				<h3>Zwei Nutzungsarten</h3>
				<p><strong>Ohne Anmeldung:</strong> Alle Daten (Suchkriterien, Kontaktversuche, Chat-Verlauf) werden ausschließlich lokal in Ihrem Browser gespeichert und verlassen Ihr Gerät nicht.</p>
				<br>
				<p><strong>Mit Anmeldung:</strong> Wenn Sie sich über Patreon anmelden, werden Ihre Kontaktversuche zusätzlich in unserer Datenbank gespeichert, um eine geräteübergreifende Synchronisation zu ermöglichen.</p>
			</div>

			<br>
			<h2>2. Benutzerkonten und Anmeldung</h2>

			<h3>Patreon OAuth</h3>
			<p>Wenn Sie sich über Patreon anmelden, erhalten wir folgende Daten von Patreon:</p>
			<ul>
				<li>Patreon-Benutzer-ID</li>
				<li>Benutzername</li>
				<li>E-Mail-Adresse</li>
				<li>Profilbild-URL</li>
				<li>Pledge-Status und -Betrag (falls Unterstützer)</li>
			</ul>
			<p><strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Die Anmeldung ist erforderlich, um die Synchronisationsfunktion und ggf. Unterstützer-Vorteile bereitzustellen.</p>
			<p><strong>Speicherdauer:</strong> Bis zur Löschung Ihres Kontos oder bis Sie die Löschung beantragen.</p>

			<h3>Cloud-Synchronisation</h3>
			<p>Angemeldete Nutzer können ihre Kontaktversuche geräteübergreifend synchronisieren. Dabei werden folgende Daten in unserer Datenbank gespeichert:</p>
			<ul>
				<li>Therapist-ID und Name der kontaktierten Praxis</li>
				<li>Kontaktmethode (E-Mail, Telefon, Auto-Anruf)</li>
				<li>Status des Kontaktversuchs</li>
				<li>Zeitstempel</li>
			</ul>
			<p><strong>Rechtsgrundlage:</strong> Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können die Synchronisation in den Kontoeinstellungen aktivieren oder deaktivieren.</p>

			<br>
			<h2>3. Automatische Anrufe (Auto-Call)</h2>

			<div class="info-box warning">
				<h3>Besondere Kategorie: Gesundheitsdaten</h3>
				<p>Die Auto-Call-Funktion verarbeitet Gesundheitsdaten im Sinne von Art. 9 DSGVO. Die Nutzung erfordert Ihre ausdrückliche Einwilligung. Ausführliche Informationen finden Sie auf unserer <a href="/dsgvo">DSGVO-Seite zu Gesundheitsdaten</a>.</p>
			</div>

			<h3>Welche Daten werden verarbeitet?</h3>
			<p>Wenn Sie einen automatischen Anruf beauftragen, verarbeiten wir:</p>
			<ul>
				<li><strong>Kontaktdaten:</strong> Ihr Name, Telefonnummer für Rückrufe, E-Mail-Adresse</li>
				<li><strong>Gesundheitsdaten:</strong> Die Tatsache, dass Sie einen Therapieplatz suchen, gewünschte Therapieform, Versicherungsart</li>
				<li><strong>Anrufdaten:</strong> Zeitpunkt, Dauer, Transkript des Gesprächs, Ergebnis (Termin, Warteliste, etc.)</li>
				<li><strong>Präferenzen:</strong> Anrede/Pronomen, Wunsch auf Warteliste aufgenommen zu werden</li>
			</ul>

			<h3>Wie funktioniert der Anruf?</h3>
			<p>KARL nutzt KI-gestützte Sprachsynthese, um automatisch bei Therapiepraxen anzurufen. Der Anruf wird von unserem Auftragsverarbeiter ElevenLabs durchgeführt:</p>
			<div class="info-box">
				<p><strong>ElevenLabs, Inc.</strong><br>
				1 Waverley Pl, Ste 101, New York, NY 10003, USA<br>
				<a href="https://elevenlabs.io/privacy-policy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a> · <a href="https://elevenlabs.io/dpa" target="_blank" rel="noopener noreferrer">Auftragsverarbeitungsvertrag (DPA)</a></p>
			</div>
			<p>Mit ElevenLabs besteht ein Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO. ElevenLabs verarbeitet die Daten ausschließlich nach unserer Weisung zur Durchführung des Anrufs.</p>

			<h3>Datenübermittlung in die USA</h3>
			<p>ElevenLabs speichert Daten standardmäßig in den USA. Dies stellt eine Übermittlung in ein Drittland dar. Die Übermittlung erfolgt auf Grundlage von:</p>
			<ul>
				<li>Standardvertragsklauseln (SCCs) gemäß Art. 46 Abs. 2 lit. c DSGVO</li>
				<li>Zusätzliche technische Maßnahmen (Ende-zu-Ende-Verschlüsselung, SOC2-Zertifizierung)</li>
			</ul>
			<p>ElevenLabs bietet für Enterprise-Kunden optional EU-Datenresidenz an. Derzeit nutzt KARL diese Option nicht, sodass Anrufdaten in den USA verarbeitet werden. Bei Nutzung der Auto-Call-Funktion willigen Sie in diese Drittlandübermittlung ein.</p>

			<h3>Rechtsgrundlagen</h3>
			<ul>
				<li><strong>Gesundheitsdaten:</strong> Ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO)</li>
				<li><strong>Sonstige Daten:</strong> Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), zur Durchführung des beauftragten Anrufs</li>
			</ul>

			<h3>Speicherdauer</h3>
			<ul>
				<li><strong>Anrufdaten:</strong> 30 Tage nach Abschluss des Anrufs</li>
				<li><strong>Transkripte:</strong> 30 Tage, danach automatische Löschung</li>
				<li><strong>Kontaktdaten:</strong> Bis zur Löschung durch Sie oder auf Anfrage</li>
			</ul>

			<h3>Weitergabe an Dritte</h3>
			<p>Während des Anrufs werden folgende Informationen an die Therapiepraxis weitergegeben:</p>
			<ul>
				<li>Ihr Name</li>
				<li>Ihre Rückrufnummer</li>
				<li>Ihr Versicherungsstatus</li>
				<li>Die gewünschte Therapieform</li>
			</ul>

			<h3>Anthropic</h3>
			<p>Wir nutzen Anthropic's API für verschiedene Funktionen: Verbesserung des Services, Bereitstellung von Features und manchmal Validierung von Eingaben. Da der Therapiekontext Gesundheitsdaten impliziert, erfolgt die Verarbeitung auf Basis Ihrer Einwilligung (Art. 9 Abs. 2 lit. a DSGVO). Anthropic PBC, USA – <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a>. Übermittlung via Standardvertragsklauseln.</p>

			<br>
			<h2>4. Hosting und Infrastruktur</h2>

			<h3>Cloudflare</h3>
			<p>Diese Website wird bei Cloudflare gehostet. Cloudflare verarbeitet technische Daten (IP-Adresse, Browsertyp, etc.) zur Bereitstellung und Absicherung der Website.</p>
			<div class="info-box">
				<p><strong>Cloudflare Germany GmbH</strong><br>
				Rosental 7, c/o Mindspace, 80331 München<br>
				<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a></p>
			</div>
			<p>Mit Cloudflare besteht ein Auftragsverarbeitungsvertrag. Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem, zuverlässigem Hosting).</p>

			<h3>Photon (Adresssuche)</h3>
			<p>Für die Adress-Autovervollständigung beim manuellen Hinzufügen von Kontakten nutzen wir Photon, einen Geocoding-Dienst von Komoot. Dabei wird Ihre Suchanfrage (eingegebene Adresse) an die Server von Komoot übermittelt.</p>
			<div class="info-box">
				<p><strong>komoot GmbH</strong><br>
				Friedrich-Wilhelm-Boelcke-Straße 2, 14473 Potsdam<br>
				<a href="https://www.komoot.com/privacy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a></p>
			</div>
			<p><strong>Rechtsgrundlage:</strong> Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) an der Bereitstellung einer benutzerfreundlichen Adresseingabe.</p>

			<br>
			<h2>5. Cookies und lokale Speicherung</h2>
			<p>Diese Website verwendet:</p>
			<ul>
				<li><strong>localStorage:</strong> Speicherung Ihrer Einstellungen, Suchkriterien und Chat-Verlauf (nur lokal)</li>
				<li><strong>Session-Cookie:</strong> Nur für angemeldete Nutzer zur Authentifizierung</li>
			</ul>
			<p>Es werden keine Tracking-Cookies verwendet.</p>

			<h3>Anonyme Nutzungsstatistiken</h3>
			<p>Wir verwenden <a href="https://umami.is/" target="_blank" rel="noopener noreferrer">Umami</a>, eine datenschutzfreundliche, cookielose Analyse-Software. Umami speichert keine personenbezogenen Daten, setzt keine Cookies und ermöglicht kein Tracking über Websites hinweg. Es werden nur aggregierte, anonyme Statistiken erfasst (z.B. Seitenaufrufe, verwendete Gerätetypen).</p>
			<p><strong>Rechtsgrundlage:</strong> Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) an der Verbesserung unseres Angebots. Da keine personenbezogenen Daten verarbeitet werden, ist keine Einwilligung erforderlich.</p>

			<br>
			<h2>6. Ihre Rechte</h2>
			<p>Sie haben jederzeit folgende Rechte:</p>
			<ul>
				<li><strong>Auskunft</strong> (Art. 15 DSGVO): Welche Daten wir über Sie gespeichert haben</li>
				<li><strong>Berichtigung</strong> (Art. 16 DSGVO): Korrektur unrichtiger Daten</li>
				<li><strong>Löschung</strong> (Art. 17 DSGVO): Löschung Ihrer Daten ("Recht auf Vergessenwerden")</li>
				<li><strong>Einschränkung</strong> (Art. 18 DSGVO): Einschränkung der Verarbeitung</li>
				<li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO): Export Ihrer Daten in maschinenlesbarem Format</li>
				<li><strong>Widerspruch</strong> (Art. 21 DSGVO): Widerspruch gegen bestimmte Verarbeitungen</li>
				<li><strong>Widerruf der Einwilligung</strong>: Jederzeit mit Wirkung für die Zukunft</li>
			</ul>

			<div class="info-box">
				<h3>Self-Service Portal</h3>
				<p>Angemeldete Nutzer können ihre Rechte direkt ausüben:</p>
				<ul>
					<li><strong>Datenexport:</strong> Alle gespeicherten Daten als JSON-Datei herunterladen</li>
					<li><strong>Account löschen:</strong> Alle Daten unwiderruflich löschen</li>
				</ul>
				<p>Sie finden es <a href="/account/gdpr">hier</a>.</p>
			</div>

			<p>Zur Ausübung weiterer Rechte oder bei Fragen kontaktieren Sie uns unter der im Impressum angegebenen E-Mail-Adresse.</p>

			<h3>Beschwerderecht</h3>
			<p>Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die für uns zuständige Behörde ist:</p>
			<div class="info-box">
				<p><strong>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</strong><br>
				Promenade 18, 91522 Ansbach<br>
				<a href="https://www.lda.bayern.de/" target="_blank" rel="noopener noreferrer">https://www.lda.bayern.de/</a></p>
			</div>

			<br>
			<h2>7. Anonymisierte Daten</h2>
			<p>Wir behalten uns vor, vollständig anonymisierte Daten zu Statistikzwecken und zur Verbesserung unserer Dienste zu speichern. Diese Daten enthalten keinerlei Informationen, die Rückschlüsse auf einzelne Personen zulassen. Beispiele:</p>
			<ul>
				<li>Aggregierte Nutzungsstatistiken (z.B. Anzahl durchgeführter Suchen)</li>
				<li>Erfolgsquoten bei Anrufen (ohne Personenbezug)</li>
				<li>Technische Performance-Daten</li>
			</ul>
			<p>Da anonymisierte Daten keine personenbezogenen Daten im Sinne der DSGVO sind, ist für deren Verarbeitung keine Rechtsgrundlage erforderlich.</p>

			<br>
			<h2>8. SSL-Verschlüsselung</h2>
			<p>Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an "https://" in der Adresszeile.</p>

			<br>
			<h2>9. Verantwortliche Stelle</h2>
			<div class="info-box">
				<p><strong>KARL - Kontakt Automatisierung Richtung Leben - Merle Fäller</strong><br>
				c/o Online-Impressum.de #32385<br>
				Europaring 90<br>
				53757 Sankt Augustin<br><br>
				E-Mail: <a href="mailto:karl@mail.online-impressum.de">karl@mail.online-impressum.de</a></p>
			</div>

			<br>
			<h2>10. Änderungen dieser Datenschutzerklärung</h2>
			<p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder bei Änderungen des Dienstes anzupassen. Die aktuelle Version finden Sie stets auf dieser Seite.</p>

			<p class="text-sm text-pencil/50 mt-8">Stand: Januar 2025</p>
		</WobblyCard>
	</div>
</div>

<style>
	.info-box {
		background-color: var(--color-postit);
		border: 2px solid var(--color-pencil);
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 4px;
	}
	:global(:root.theme-modern) .info-box,
	:global(:root.theme-apfel) .info-box {
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-hard-sm);
	}
	.info-box h3 {
		margin-top: 0;
	}
	.info-box.warning {
		background-color: #fef3c7;
		border-color: #f59e0b;
	}
	:global(:root.theme-modern) .info-box.warning,
	:global(:root.theme-apfel) .info-box.warning {
		border-width: 1px;
	}
	:global(:root.dark) .info-box.warning {
		background-color: #451a03;
		border-color: #d97706;
	}
</style>
