<script lang="ts">
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import { ArrowLeft, AlertTriangle } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Gesundheitsdaten & DSGVO - KARL</title>
</svelte:head>

<div class="min-h-screen bg-paper px-4 py-8">
	<div class="mx-auto max-w-3xl">
		<a href="/" class="mb-6 inline-flex items-center gap-2 text-sm text-pencil/60 hover:text-pencil transition-colors">
			<ArrowLeft size={16} />
			Zurück
		</a>

		<WobblyCard class="prose prose-pencil max-w-none">
			<h1>Gesundheitsdaten & DSGVO</h1>

			<div class="wip-box">
				<AlertTriangle size={20} />
				<p><strong>Diese Seite befindet sich noch im Aufbau.</strong> Die Inhalte werden laufend ergänzt und präzisiert.</p>
			</div>

			<div class="practice-box">
				<h3>Sind Sie eine Praxis?</h3>
				<p>Sind Sie eine Praxis und KARL hat Sie angerufen? Dann klicken Sie bitte <a href="mailto:karl@mail.online-impressum.de?subject=Praxis%20Anfrage">hier</a>.</p>
			</div>

			<h2>Warum diese Seite?</h2>
			<p>Wenn du KARLs automatische Anruf-Funktion nutzt, verarbeiten wir sogenannte <strong>Gesundheitsdaten</strong>, konkret die Information, dass du einen Therapieplatz suchst. Diese Daten sind nach Art. 9 DSGVO besonders schützenswert.</p>

			<h2>Was sind Gesundheitsdaten?</h2>
			<p>Gesundheitsdaten im Sinne der DSGVO sind alle Informationen, die sich auf deinen körperlichen oder psychischen Gesundheitszustand beziehen. Dazu gehört auch:</p>
			<ul>
				<li>Die Tatsache, dass du einen Therapieplatz suchst</li>
				<li>Die Art der gesuchten Therapie (z.B. Verhaltenstherapie)</li>
				<li>Informationen über deinen Versicherungsstatus im Kontext der Therapiesuche</li>
			</ul>

			<h2>Rechtsgrundlage: Art. 9 Abs. 2 lit. a DSGVO</h2>
			<p>Die Verarbeitung von Gesundheitsdaten ist grundsätzlich verboten, es sei denn, du hast <strong>ausdrücklich eingewilligt</strong>. Genau das tust du, wenn du im Anruf-Formular das entsprechende Häkchen setzt.</p>

			<div class="info-box">
				<h3>Deine Einwilligung umfasst:</h3>
				<ul>
					<li>Die temporäre Speicherung deiner Kontaktdaten und deines Therapiebedarfs</li>
					<li>Die Weitergabe dieser Informationen an die Therapiepraxis während des Anrufs</li>
					<li>Die Speicherung des Anrufergebnisses (z.B. "Termin vereinbart", "Warteliste")</li>
				</ul>
			</div>

			<h2>Wie lange werden die Daten gespeichert?</h2>
			<p>Deine Daten werden nur so lange gespeichert, wie es für den Zweck erforderlich ist:</p>
			<ul>
				<li><strong>Anrufdaten:</strong> Bis zu 30 Tage nach Abschluss des Anrufs</li>
				<li><strong>Kontaktdaten:</strong> Werden nach erfolgreichem Therapieplatz oder auf Wunsch gelöscht</li>
				<li><strong>Lokale Daten:</strong> Verbleiben in deinem Browser, bis du sie löschst</li>
			</ul>

			<h2>Deine Rechte</h2>
			<p>Du kannst deine Einwilligung <strong>jederzeit widerrufen</strong>. Der Widerruf gilt für die Zukunft, bereits durchgeführte Anrufe bleiben davon unberührt.</p>
			<p>Weitere Rechte:</p>
			<ul>
				<li>Auskunft über gespeicherte Daten</li>
				<li>Berichtigung falscher Daten</li>
				<li>Löschung deiner Daten</li>
				<li>Einschränkung der Verarbeitung</li>
				<li>Beschwerde bei einer Aufsichtsbehörde</li>
			</ul>

			<h2>Wer hat Zugriff auf die Daten?</h2>
			<ul>
				<li><strong>KARL:</strong> Zur Durchführung und Auswertung des Anrufs</li>
				<li><strong>ElevenLabs:</strong> Unser Dienstleister für die Sprachsynthese (mit Auftragsverarbeitungsvertrag)</li>
				<li><strong>Die angerufene Praxis:</strong> Erhält nur die für die Terminvereinbarung notwendigen Infos</li>
			</ul>

			<h2>Kontakt</h2>
			<p>Bei Fragen zur Verarbeitung deiner Gesundheitsdaten erreichst du uns unter:</p>
			<div class="info-box">
				<p>
					<strong>E-Mail:</strong> <a href="mailto:karl@mail.online-impressum.de">karl@mail.online-impressum.de</a>
				</p>
			</div>

			<p>Weitere Informationen findest du in unserer <a href="/datenschutz">Datenschutzerklärung</a> und im <a href="/impressum">Impressum</a>.</p>

			<p class="text-sm text-pencil/50 mt-8">Stand: Januar 2025 (in Bearbeitung)</p>
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
	.wip-box {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		background-color: #fef3c7;
		border: 2px solid #f59e0b;
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 4px;
		color: #92400e;
	}
	:global(:root.dark) .wip-box {
		background-color: #451a03;
		border-color: #d97706;
		color: #fcd34d;
	}
	.wip-box p {
		margin: 0;
	}
	.practice-box {
		background-color: #e0f2fe;
		border: 2px solid #0284c7;
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 4px;
		color: #0c4a6e;
	}
	:global(:root.dark) .practice-box {
		background-color: #082f49;
		border-color: #0ea5e9;
		color: #bae6fd;
	}
	.practice-box h3 {
		margin-top: 0;
	}
	.practice-box p {
		margin: 0.5rem 0 0 0;
	}
</style>
