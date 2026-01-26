<script lang="ts">
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import { ArrowLeft, Shield, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { setDefaultStyleIfFirstVisit } from '$lib/stores/theme';

	onMount(() => setDefaultStyleIfFirstVisit('apfel', 'light'));
</script>

<svelte:head>
	<title>Informationen für Praxen - KARL</title>
</svelte:head>

<div class="min-h-screen bg-paper px-4 py-8 md:py-12">
	<div class="mx-auto max-w-3xl pt-4">
		<a href="/dsgvo" class="mb-6 inline-flex items-center gap-2 text-sm text-pencil/60 hover:text-pencil transition-colors">
			<ArrowLeft size={16} />
			Zurück
		</a>

		<WobblyCard class="prose prose-pencil max-w-none">
			<div class="header-row">
				<KarlAvatar size="xl" />
				<div>
					<h1 class="!m-0 !mb-1">Informationen für Praxen</h1>
					<p class="!m-0 text-pencil/60">Hat KARL Sie angerufen?</p>
				</div>
			</div>

			<p class="lead">Wir verstehen, dass ein automatisierter Anruf ungewöhnlich ist. Diese Seite erklärt, wer dahintersteckt - und warum.</p>

			<h2>Wer ruft da an?</h2>
			<p>Hinter jedem Anruf steht eine konkrete Person, die einen Therapieplatz sucht.</p>
			<p>Viele Menschen, die dringend Therapie brauchen, schaffen es kaum, zum Telefon zu greifen. <br><br></p>
			<p>z.B. wegen Depression, Angst, Überforderung. KARL übernimmt diese Anrufe. Wie ein Freund, der sagt: <em>"Bleib sitzen, ich telefoniere für dich."</em></p>

			<h2>Was KARL nicht ist</h2>
			<p>Kein Callcenter, keine Werbung, kein Marketing. Es gibt nichts zu verkaufen. KARL ist ein gemeinnütziges Open-Source-Projekt einer einzelnen Entwicklerin, keine Gewinnabsicht, keine versteckten Interessen.</p>
			<p>Wenn KARL anruft, fragt er nur, was die Person selbst fragen würde: <em>Gibt es freie Plätze?</em> Die Antwort geht an die suchende Person zurück - mehr nicht.</p>

			<h2>Schutz vor Missbrauch</h2>
			<p>KARL ist für Menschen gedacht, die wirklich Hilfe suchen. Automatisierte Filter erkennen auffälliges Verhalten, und wer den Service missbraucht, wird gesperrt. Das schützt sowohl Praxen als auch die Menschen, für die KARL gedacht ist.</p>

			<div class="rights-box">
				<Shield size={20} class="shrink-0 mt-0.5" />
				<div>
					<h3 class="!mt-0">Ihre Rechte. Sie möchten keine Anrufe? Ein Wort genügt.</h3><br>
					<ul class="!mb-2">
						<li>Während des Anrufs: Sagen Sie einfach, dass Sie nicht mehr kontaktiert werden möchten. KARL versteht das und sperrt Ihre Nummer sofort.</li><br>
						<li>Per E-Mail: Schreiben Sie an <a href="mailto:karl@mail.online-impressum.de?subject=Praxis%20-%20Nummer%20sperren">karl@mail.online-impressum.de</a> - Ihre Nummer wird umgehend gesperrt.</li><br>
						<li>Persönlich: Die Entwicklerin ist offen für ein Gespräch, wenn sie die Zeit hat. Geben Sie einfach Ihre Rückrufnummer an.</li><br>
					</ul>
					<p class="!mb-0">Wir respektieren Ihren Wunsch ohne Nachfragen und ohne Diskussion.</p>
				</div>
			</div>

			<h2>Was wir speichern (und was nicht)</h2>
			<p>Nur das Nötigste, so kurz wie möglich:</p>
			<ul>
				<li>Praxisdaten aus öffentlichen Therapeutenverzeichnissen (Telefonnummer, Name, Adresse)</li>
				<li>Gesprächsergebnis, z.B. "kein Platz frei" - wird nach 30 Tagen automatisch gelöscht</li>
				<li>Sperrliste, damit wir Sie nicht erneut anrufen</li>
			</ul>
			<p>Kein Tracking, kein Profiling, keine Weitergabe.</p>

			<h2>Rechtliche Grundlage</h2>
			<p>Wir stützen uns auf Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse). Das Interesse: Menschen mit psychischen Erkrankungen den Zugang zu Therapie vereinfachen. Sobald Sie widersprechen, hat Ihr Wunsch Vorrang - ohne Wenn und Aber.</p>
			<p>Alle Rechte nach Art. 15-21 DSGVO können Sie jederzeit per E-Mail geltend machen.</p>

			<h2>Transparent und offen</h2>
			<p>KARL ist vollständig Open Source: <a href="https://github.com/faeller/karl-therapy-finder" target="_blank" rel="noopener noreferrer">github.com/faeller/karl-therapy-finder</a></p>

			<h2>Kontakt</h2>
			<p>E-Mail: <a href="mailto:karl@mail.online-impressum.de">karl@mail.online-impressum.de</a></p>
			<p class="text-sm text-pencil/70">Beschwerderecht: <a href="https://www.lda.bayern.de/" target="_blank" rel="noopener noreferrer">Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</a>, Promenade 18, 91522 Ansbach</p>

			<div class="contact-box">
				<h3>Keine weiteren Anrufe gewünscht?</h3>
				<p>Wir respektieren das - sofort und ohne Rückfragen.</p>
				<a href="mailto:karl@mail.online-impressum.de?subject=Praxis%20-%20Nummer%20sperren&body=Bitte%20sperren%20Sie%20folgende%20Telefonnummer%3A%0A%0A">
					<WobblyButton variant="secondary" class="w-full mt-3">
						<Trash2 size={20} />
						Nummer sperren lassen
					</WobblyButton>
				</a>
			</div>

			<p class="text-sm text-pencil/50 mt-8"><a href="/datenschutz">Datenschutzerklärung</a> · <a href="/impressum">Impressum</a></p>
		</WobblyCard>
	</div>
</div>

<style>
	:global(.prose) .contact-box *,
	:global(.prose) .rights-box * {
		background: transparent !important;
		border: none !important;
		box-shadow: none !important;
	}

	.contact-box {
		background-color: #fef3c7;
		border: 2px solid #f59e0b;
		padding: 1rem;
		margin: 1.5rem 0;
		border-radius: 4px;
		color: #92400e;
	}
	:global(:root.theme-modern) .contact-box,
	:global(:root.theme-apfel) .contact-box {
		border-width: 1px;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-hard-sm);
		padding: 1.25rem;
	}
	:global(:root.dark) .contact-box {
		background-color: #451a03;
		border-color: #d97706;
		color: #fcd34d;
	}
	.contact-box h3 {
		margin-top: 0;
		margin-bottom: 0.5rem;
	}
	.contact-box p {
		margin-bottom: 0;
	}

	.header-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.lead {
		font-size: 1.125rem;
		color: var(--color-pencil);
		opacity: 0.8;
		margin-bottom: 2rem;
	}

	.rights-box {
		display: flex;
		gap: 0.75rem;
		background-color: #e0f2fe;
		border: 2px solid #0284c7;
		padding: 1rem;
		margin: 1.5rem 0;
		border-radius: 4px;
		color: #0c4a6e;
	}
	:global(:root.theme-modern) .rights-box,
	:global(:root.theme-apfel) .rights-box {
		border-width: 1px;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-hard-sm);
		padding: 1.25rem;
	}
	:global(:root.dark) .rights-box {
		background-color: #082f49;
		border-color: #0ea5e9;
		color: #bae6fd;
	}
	.rights-box h3 {
		margin-bottom: 0.25rem;
	}
	.rights-box p {
		margin-bottom: 0.5rem;
	}

	:global(.prose) h2 {
		margin-top: 1.75rem;
		margin-bottom: 0.5rem;
	}

	:global(.prose) h3 {
		margin-top: 1.25rem;
	}

	:global(.prose) p + h2 {
		margin-top: 2rem;
	}
</style>
