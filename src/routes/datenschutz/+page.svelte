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

			<h2>1. Datenschutz auf einen Blick</h2>

			<h3>Allgemeine Hinweise</h3>
			<p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.</p>

			<h3>Datenerfassung auf dieser Website</h3>
			<p><strong>Wer ist verantwortlich für die Datenerfassung?</strong></p>
			<p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Kontaktdaten finden Sie im <a href="/impressum">Impressum</a>.</p>

			<p><strong>Wie erfassen wir Ihre Daten?</strong></p>
			<p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z.B. PLZ-Eingabe für die Therapiesuche). Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst (technische Daten wie Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>

			<p><strong>Wofür nutzen wir Ihre Daten?</strong></p>
			<p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Die von Ihnen eingegebenen Suchkriterien werden <strong>ausschließlich lokal in Ihrem Browser gespeichert</strong> und nicht an unsere Server übertragen.</p>

			<div class="info-box">
				<h3>Lokale Datenspeicherung</h3>
				<p>KARL speichert alle Ihre Daten (Suchkriterien, Kontaktversuche, Chat-Verlauf) ausschließlich in Ihrem Browser (localStorage). Diese Daten verlassen Ihr Gerät nicht und werden nicht an unsere Server übertragen.</p>
			</div>

			<h2>2. Hosting</h2>
			<p>Diese Website wird bei Cloudflare gehostet:</p>
			<div class="info-box">
				<p><strong>Cloudflare Germany GmbH</strong><br>
				Rosental 7, c/o Mindspace, 80331 München<br>
				<a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/</a></p>
			</div>

			<h2>3. Ihre Rechte</h2>
			<p>Sie haben jederzeit das Recht auf:</p>
			<ul>
				<li>Auskunft über Ihre gespeicherten personenbezogenen Daten</li>
				<li>Berichtigung oder Löschung dieser Daten</li>
				<li>Einschränkung der Verarbeitung</li>
				<li>Widerspruch gegen die Verarbeitung</li>
				<li>Datenübertragbarkeit</li>
				<li>Beschwerde bei einer Aufsichtsbehörde</li>
			</ul>

			<h2>4. Cookies und lokale Speicherung</h2>
			<p>Diese Website verwendet localStorage zur Speicherung Ihrer Einstellungen und Suchkriterien. Diese Daten werden nur lokal in Ihrem Browser gespeichert.</p>
			<p>Cookies werden nur für technisch notwendige Funktionen verwendet (z.B. Theme-Einstellung, Sprachauswahl).</p>

			<h2>5. Externe Datenquellen</h2>
			<p>Die Therapeuten-Daten werden über die TK Ärzteführer-Schnittstelle abgerufen. Bei jeder Suche wird eine Anfrage an diesen Dienst gestellt, wobei nur die eingegebene PLZ und Ihre Suchkriterien übertragen werden.</p>

			<h2>6. SSL-Verschlüsselung</h2>
			<p>Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an "https://" in der Adresszeile.</p>

			<h2>7. Verantwortliche Stelle</h2>
			<div class="info-box">
				<p><strong>KARL - Kontakt Automatisierung Richtung Leben - Merle Fäller</strong><br>
				c/o Online-Impressum.de #32385<br>
				Europaring 90<br>
				53757 Sankt Augustin<br><br>
				E-Mail: <a href="mailto:karl@mein.online-impressum.de">karl@mein.online-impressum.de</a></p>
			</div>

			<p class="text-sm text-pencil/50 mt-8">Stand: 2025</p>
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
	.info-box h3 {
		margin-top: 0;
	}
</style>
