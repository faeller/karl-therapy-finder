<script lang="ts">
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import { ArrowLeft, Download, Trash2, Database, FileJson, AlertTriangle } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages';

	let { data, form } = $props();

	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');
	let exporting = $state(false);
	let deleting = $state(false);

	// delete confirmation text - using the message directly
	const deleteConfirmWord = m.gdpr_delete_confirm_placeholder();

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

	// deletion redirect is handled server-side
</script>

<svelte:head>
	<title>{m.gdpr_title()} - KARL</title>
</svelte:head>

<div class="min-h-screen bg-paper px-4 py-8">
	<div class="mx-auto max-w-3xl">
		<a href="/account" class="mb-6 inline-flex items-center gap-2 text-sm text-pencil/60 hover:text-pencil transition-colors">
			<ArrowLeft size={16} />
			{m.gdpr_back()}
		</a>

		<WobblyCard class="prose prose-pencil max-w-none">
			<div class="flex items-center gap-3 mb-6">
				<Database size={32} class="text-blue-pen" />
				<h1 class="!m-0">{m.gdpr_title()}</h1>
			</div>

			<p class="lead mb-12">{m.gdpr_lead()}</p>

			<!-- data overview -->
			<section class="section">
				<h2 class="section-title">{m.gdpr_stored_data_title()}</h2>
				{#if data.stats}
					<dl class="data-list">
						<div class="data-item">
							<dt>{m.gdpr_stored_account()}</dt>
							<dd>{data.user.username} ({data.user.email || m.gdpr_no_email()})</dd>
						</div>
						{#if data.stats.scheduledCalls > 0}
							<div class="data-item">
								<dt>{m.gdpr_stored_calls()}</dt>
								<dd>{data.stats.scheduledCalls} {data.stats.scheduledCalls === 1 ? m.gdpr_stored_call_single() : m.gdpr_stored_calls()}</dd>
							</div>
						{/if}
						{#if data.stats.userCampaign > 0 || data.stats.userContacts > 0}
							<div class="data-item">
								<dt>{m.gdpr_stored_synced_data()}</dt>
								<dd>{m.gdpr_stored_synced_campaign_contacts()}</dd>
							</div>
						{/if}
						{#if data.stats.creditAudit > 0}
							<div class="data-item">
								<dt>{m.gdpr_stored_credit_history()}</dt>
								<dd>{data.stats.creditAudit} {m.gdpr_stored_entries()}</dd>
							</div>
						{/if}
						{#if data.stats.callCosts > 0}
							<div class="data-item">
								<dt>{m.gdpr_stored_cost_history()}</dt>
								<dd>{data.stats.callCosts} {m.gdpr_stored_entries()}</dd>
							</div>
						{/if}
					</dl>
				{:else}
					<p class="text-pencil/60">{m.gdpr_no_database()}</p>
				{/if}
			</section>

			<section class="section">
				<h2 class="section-title">{m.gdpr_export_title()}</h2>
				<p class="mb-4">{m.gdpr_export_description()}</p>
				<ul class="list-simple mb-6">
					<li>{m.gdpr_export_includes_account()}</li>
					<li>{m.gdpr_export_includes_calls()}</li>
					<li>{m.gdpr_export_includes_credits()}</li>
					<li>{m.gdpr_export_includes_synced()}</li>
				</ul>

				<form method="POST" action="?/exportData" use:enhance={() => {
					exporting = true;
					return async ({ update }) => {
						await update();
					};
				}}>
					<WobblyButton type="submit" variant="secondary" disabled={exporting}>
						<FileJson size={20} />
						{exporting ? m.gdpr_export_button_loading() : m.gdpr_export_button()}
					</WobblyButton>
				</form>
			</section>

			<section class="section">
				<h2 class="section-title text-red-marker">{m.gdpr_delete_title()}</h2>
				<div class="warning-notice">
					<AlertTriangle size={20} class="text-amber-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-bold mb-2">{m.gdpr_delete_warning()}</p>
						<p class="mb-3">{m.gdpr_delete_description()}</p>
						<ul class="list-simple mb-3">
							<li>{m.gdpr_delete_includes_account()}</li>
							<li>{m.gdpr_delete_includes_calls()}</li>
							<li>{m.gdpr_delete_includes_credits()}</li>
							<li>{m.gdpr_delete_includes_synced()}</li>
						</ul>
						<p class="text-sm text-pencil/60">{m.gdpr_delete_local_notice()}</p>
					</div>
				</div>

			{#if !showDeleteConfirm}
				<WobblyButton
					variant="secondary"
					onclick={() => showDeleteConfirm = true}
				>
					<Trash2 size={20} />
					{m.gdpr_delete_button()}
				</WobblyButton>
			{:else}
				<div class="delete-confirm-area">
					<p class="font-bold mb-2">{m.gdpr_delete_confirm_title()}</p>
					<p class="mb-4">{m.gdpr_delete_confirm_instructions()}</p>
					<input
						type="text"
						bind:value={deleteConfirmText}
						placeholder={m.gdpr_delete_confirm_placeholder()}
						class="confirm-input"
					/>

					<form method="POST" action="?/deleteAccount" use:enhance={() => {
						deleting = true;
						return async ({ update }) => {
							await update();
						};
					}}>
						<div class="confirm-buttons">
							<WobblyButton
								type="button"
								variant="secondary"
								onclick={() => {
									showDeleteConfirm = false;
									deleteConfirmText = '';
								}}
								disabled={deleting}
							>
								{m.gdpr_delete_confirm_cancel()}
							</WobblyButton>
							<WobblyButton
								type="submit"
								variant="secondary"
								disabled={deleteConfirmText !== deleteConfirmWord || deleting}
								class="!bg-red-marker !text-paper"
							>
								<Trash2 size={20} class="shrink-0" />
								{deleting ? m.gdpr_delete_confirm_loading() : m.gdpr_delete_confirm_submit()}
							</WobblyButton>
						</div>
					</form>
				</div>
			{/if}

			{#if form?.error}
				<div class="notice notice-error">
					<p><strong>{m.gdpr_delete_error()}</strong> {form.error}</p>
				</div>
			{/if}
			</section>

			<section class="section">
				<h2 class="section-title">{m.gdpr_rights_title()}</h2>
				<p class="mb-4">{m.gdpr_rights_intro()}</p>
				<dl class="rights-list">
					<div class="right-item">
						<dt>{m.gdpr_rights_access()}</dt>
						<dd>{m.gdpr_rights_access_desc()}</dd>
					</div>
					<div class="right-item">
						<dt>{m.gdpr_rights_rectification()}</dt>
						<dd>{m.gdpr_rights_rectification_desc()}</dd>
					</div>
					<div class="right-item">
						<dt>{m.gdpr_rights_erasure()}</dt>
						<dd>{m.gdpr_rights_erasure_desc()}</dd>
					</div>
					<div class="right-item">
						<dt>{m.gdpr_rights_portability()}</dt>
						<dd>{m.gdpr_rights_portability_desc()}</dd>
					</div>
				</dl>
			</section>

			<section class="section">
				<p class="mb-3">{m.gdpr_contact_intro()}</p>
				<p class="contact-info">
					<strong>{m.gdpr_contact_email()}</strong> <a href="mailto:karl@mail.online-impressum.de">karl@mail.online-impressum.de</a>
				</p>
			</section>

			<p class="text-sm text-pencil/50 mt-12 pt-6 border-t border-pencil/10">{m.gdpr_footer_links()} <a href="/datenschutz">{m.gdpr_footer_privacy()}</a> · <a href="/dsgvo">{m.gdpr_footer_health_data()}</a> · <a href="/impressum">{m.gdpr_footer_imprint()}</a></p>
		</WobblyCard>
	</div>
</div>

<style>
	.lead {
		font-size: 1.125rem;
		color: var(--color-pencil);
		opacity: 0.8;
	}

	.section {
		margin-top: 3rem;
		padding-top: 2rem;
	}

	.section:not(:first-of-type) {
		border-top: 1px solid rgba(0, 0, 0, 0.15);
	}

	:global(:root.dark) .section:not(:first-of-type) {
		border-top-color: rgba(255, 255, 255, 0.15);
	}

	.section:first-of-type {
		margin-top: 0;
		padding-top: 0;
	}

	.section-title {
		margin-bottom: 1rem;
		font-size: 1.25rem;
		color: var(--color-pencil);
	}

	.data-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.data-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0;
	}

	@media (min-width: 480px) {
		.data-item {
			display: grid;
			grid-template-columns: 180px 1fr;
			gap: 1rem;
		}
	}

	.data-item dt {
		font-weight: 600;
		color: var(--color-pencil);
	}

	.data-item dd {
		color: var(--color-pencil);
		margin: 0;
		opacity: 0.8;
	}

	@media (min-width: 480px) {
		.data-item dd {
			opacity: 1;
		}
	}

	.list-simple {
		list-style: none;
		padding-left: 0;
	}

	.list-simple li {
		padding-left: 1.5rem;
		position: relative;
		margin: 0.5rem 0;
	}

	.list-simple li::before {
		content: '•';
		position: absolute;
		left: 0.5rem;
		color: var(--color-blue-pen);
	}

	.warning-notice {
		display: flex;
		gap: 1rem;
		padding: 1.25rem;
		background-color: var(--color-postit);
		border-left: 3px solid #f59e0b;
		margin: 1.5rem 0;
	}

	.warning-notice p {
		margin: 0;
	}

	.warning-notice ul {
		margin: 0;
	}

	.delete-confirm-area {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background-color: var(--color-erased);
		border-radius: 0.5rem;
	}

	.delete-confirm-area p {
		margin: 0;
	}

	.confirm-input {
		width: 100%;
		max-width: 300px;
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--color-pencil);
		border-radius: 4px;
		font-family: var(--font-mono);
		font-size: 1rem;
	}

	.confirm-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	@media (min-width: 400px) {
		.confirm-buttons {
			flex-direction: row;
		}
	}

	.notice {
		padding: 1rem;
		margin: 1.5rem 0;
		border-radius: 0.5rem;
		border-left: 3px solid;
	}

	.notice p {
		margin: 0.25rem 0;
	}

	.notice-error {
		background-color: #fee2e2;
		border-color: #ef4444;
		color: #991b1b;
	}

	.rights-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.right-item dt {
		font-weight: 700;
		color: var(--color-blue-pen);
		margin-bottom: 0.25rem;
	}

	.right-item dd {
		color: var(--color-pencil);
		opacity: 0.8;
		margin: 0;
		line-height: 1.5;
	}

	.contact-info {
		padding: 1rem;
		background-color: var(--color-erased);
		border-radius: 0.5rem;
	}
</style>
