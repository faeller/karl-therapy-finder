<script lang="ts">
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import { ArrowLeft, Download, Trash2, Database, FileJson, AlertTriangle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');
	let exporting = $state(false);
	let deleting = $state(false);

	// handle successful data export
	$effect(() => {
		if (form?.success && form?.data && !deleting) {
			// trigger download
			const blob = new Blob([form.data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `karl-daten-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			exporting = false;
		}
	});

	// handle successful deletion
	$effect(() => {
		if (form?.success && deleting) {
			// redirect to home after successful deletion
			setTimeout(() => {
				goto('/');
			}, 2000);
		}
	});
</script>

<svelte:head>
	<title>Meine Daten - KARL</title>
</svelte:head>

<div class="min-h-screen bg-paper px-4 py-8">
	<div class="mx-auto max-w-3xl">
		<a href="/account" class="mb-6 inline-flex items-center gap-2 text-sm text-pencil/60 hover:text-pencil transition-colors">
			<ArrowLeft size={16} />
			zurück
		</a>

		<WobblyCard class="prose prose-pencil max-w-none">
			<div class="flex items-center gap-3 mb-4">
				<Database size={32} class="text-blue-pen" />
				<h1 class="!m-0">meine daten</h1>
			</div>

			<p class="lead">hier kannst du alle deine bei karl gespeicherten daten einsehen, exportieren oder löschen.</p>

			<!-- data overview -->
			<div class="info-box">
				<h3>gespeicherte daten</h3>
				{#if data.stats}
					<ul>
						<li><strong>account:</strong> {data.user.username} ({data.user.email || 'keine e-mail'})</li>
						{#if data.stats.scheduledCalls > 0}
							<li><strong>anrufe:</strong> {data.stats.scheduledCalls} anruf{data.stats.scheduledCalls !== 1 ? 'e' : ''}</li>
						{/if}
						{#if data.stats.userCampaign > 0 || data.stats.userContacts > 0}
							<li><strong>synchronisierte daten:</strong> kampagne und kontakte</li>
						{/if}
						{#if data.stats.creditAudit > 0}
							<li><strong>credit-verlauf:</strong> {data.stats.creditAudit} einträge</li>
						{/if}
						{#if data.stats.callCosts > 0}
							<li><strong>kosten-verlauf:</strong> {data.stats.callCosts} einträge</li>
						{/if}
					</ul>
				{:else}
					<p class="text-pencil/60">keine datenbank verfügbar</p>
				{/if}
			</div>

			<h2>daten exportieren</h2>
			<p>lade alle deine daten als json-datei herunter. diese enthält:</p>
			<ul>
				<li>account-informationen (name, e-mail, patreon-status)</li>
				<li>alle anrufdaten (termine, transkripte, ergebnisse)</li>
				<li>credit-verlauf</li>
				<li>synchronisierte kampagnen- und kontaktdaten</li>
			</ul>

			<form method="POST" action="?/exportData" use:enhance={() => {
				exporting = true;
				return async ({ update }) => {
					await update();
				};
			}}>
				<WobblyButton type="submit" variant="secondary" disabled={exporting}>
					<FileJson size={20} />
					{exporting ? 'exportiere...' : 'daten exportieren'}
				</WobblyButton>
			</form>

			<h2>account löschen</h2>
			<div class="warning-box">
				<AlertTriangle size={20} />
				<div>
					<p><strong>achtung: diese aktion kann nicht rückgängig gemacht werden.</strong></p>
					<p>alle deine daten werden unwiderruflich gelöscht:</p>
					<ul>
						<li>account und login</li>
						<li>alle anrufdaten und transkripte</li>
						<li>credit-guthaben und verlauf</li>
						<li>synchronisierte daten</li>
					</ul>
					<p class="text-sm">deine lokalen browserdaten (suche, chat) bleiben erhalten, bis du sie im browser löschst.</p>
				</div>
			</div>

			{#if !showDeleteConfirm}
				<WobblyButton
					variant="secondary"
					onclick={() => showDeleteConfirm = true}
				>
					<Trash2 size={20} />
					account löschen
				</WobblyButton>
			{:else}
				<div class="delete-confirm">
					<p><strong>bist du sicher?</strong></p>
					<p>tippe "<code>LÖSCHEN</code>" um zu bestätigen:</p>
					<input
						type="text"
						bind:value={deleteConfirmText}
						placeholder="LÖSCHEN"
						class="confirm-input"
					/>

					<form method="POST" action="?/deleteAccount" use:enhance={() => {
						deleting = true;
						return async ({ update }) => {
							await update();
						};
					}}>
						<div class="flex gap-3 mt-4">
							<WobblyButton
								type="button"
								variant="secondary"
								onclick={() => {
									showDeleteConfirm = false;
									deleteConfirmText = '';
								}}
								disabled={deleting}
							>
								abbrechen
							</WobblyButton>
							<WobblyButton
								type="submit"
								variant="secondary"
								disabled={deleteConfirmText !== 'LÖSCHEN' || deleting}
								class="!bg-red-marker !text-paper"
							>
								<Trash2 size={20} />
								{deleting ? 'lösche...' : 'unwiderruflich löschen'}
							</WobblyButton>
						</div>
					</form>
				</div>
			{/if}

			{#if form?.success && deleting}
				<div class="success-box mt-4">
					<p><strong>dein account wurde gelöscht.</strong></p>
					<p>du wirst in kürze zur startseite weitergeleitet...</p>
				</div>
			{/if}

			{#if form?.error}
				<div class="warning-box mt-4">
					<p><strong>fehler:</strong> {form.error}</p>
				</div>
			{/if}

			<h2>deine rechte</h2>
			<p>nach dsgvo hast du folgende rechte:</p>
			<ul>
				<li><strong>auskunft (art. 15):</strong> welche daten wir über dich speichern</li>
				<li><strong>berichtigung (art. 16):</strong> korrektur unrichtiger daten</li>
				<li><strong>löschung (art. 17):</strong> "recht auf vergessenwerden"</li>
				<li><strong>datenübertragbarkeit (art. 20):</strong> export in maschinenlesbarem format</li>
			</ul>

			<p>für weitere fragen oder unterstützung kontaktiere uns unter:</p>
			<div class="info-box">
				<p>
					<strong>e-mail:</strong> <a href="mailto:karl@mail.online-impressum.de">karl@mail.online-impressum.de</a>
				</p>
			</div>

			<p class="text-sm text-pencil/50 mt-8">weitere informationen: <a href="/datenschutz">datenschutzerklärung</a> · <a href="/dsgvo">gesundheitsdaten</a> · <a href="/impressum">impressum</a></p>
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
	.info-box ul {
		margin-bottom: 0;
	}

	.warning-box {
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
	:global(:root.dark) .warning-box {
		background-color: #451a03;
		border-color: #d97706;
		color: #fcd34d;
	}
	.warning-box p,
	.warning-box ul {
		margin: 0.5rem 0;
	}
	.warning-box p:first-child {
		margin-top: 0;
	}

	.success-box {
		background-color: #d1fae5;
		border: 2px solid #10b981;
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 4px;
		color: #065f46;
	}
	:global(:root.dark) .success-box {
		background-color: #064e3b;
		border-color: #34d399;
		color: #a7f3d0;
	}
	.success-box p {
		margin: 0.25rem 0;
	}

	.delete-confirm {
		background-color: var(--color-erased);
		border: 2px solid var(--color-pencil);
		padding: 1.5rem;
		margin: 1rem 0;
		border-radius: 4px;
	}

	.delete-confirm p {
		margin: 0.5rem 0;
	}

	.confirm-input {
		width: 100%;
		max-width: 300px;
		padding: 0.5rem;
		border: 2px solid var(--color-pencil);
		border-radius: 4px;
		font-family: var(--font-mono);
		font-size: 1rem;
		margin-top: 0.5rem;
	}

	.lead {
		font-size: 1.125rem;
		color: var(--color-pencil);
		opacity: 0.8;
	}

	code {
		background-color: var(--color-erased);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-family: var(--font-mono);
	}
</style>
