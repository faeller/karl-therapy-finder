<script lang="ts">
	import WobblyCard from '$lib/components/ui/WobblyCard.svelte';
	import WobblyButton from '$lib/components/ui/WobblyButton.svelte';
	import { ArrowLeft, Download, Trash2, Database, FileJson, AlertTriangle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
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
	<title>{m.gdpr_title()} - KARL</title>
</svelte:head>

<div class="min-h-screen bg-paper px-4 py-8">
	<div class="mx-auto max-w-3xl">
		<a href="/account" class="mb-6 inline-flex items-center gap-2 text-sm text-pencil/60 hover:text-pencil transition-colors">
			<ArrowLeft size={16} />
			{m.gdpr_back()}
		</a>

		<WobblyCard class="prose prose-pencil max-w-none">
			<div class="flex items-center gap-3 mb-4">
				<Database size={32} class="text-blue-pen" />
				<h1 class="!m-0">{m.gdpr_title()}</h1>
			</div>

			<p class="lead">{m.gdpr_lead()}</p>

			<!-- data overview -->
			<div class="info-box">
				<h3>{m.gdpr_stored_data_title()}</h3>
				{#if data.stats}
					<ul>
						<li><strong>{m.gdpr_stored_account()}:</strong> {data.user.username} ({data.user.email || m.gdpr_no_email()})</li>
						{#if data.stats.scheduledCalls > 0}
							<li><strong>{m.gdpr_stored_calls()}:</strong> {data.stats.scheduledCalls} {data.stats.scheduledCalls === 1 ? m.gdpr_stored_call_single() : m.gdpr_stored_calls()}</li>
						{/if}
						{#if data.stats.userCampaign > 0 || data.stats.userContacts > 0}
							<li><strong>{m.gdpr_stored_synced_data()}:</strong> {m.gdpr_stored_synced_campaign_contacts()}</li>
						{/if}
						{#if data.stats.creditAudit > 0}
							<li><strong>{m.gdpr_stored_credit_history()}:</strong> {data.stats.creditAudit} {m.gdpr_stored_entries()}</li>
						{/if}
						{#if data.stats.callCosts > 0}
							<li><strong>{m.gdpr_stored_cost_history()}:</strong> {data.stats.callCosts} {m.gdpr_stored_entries()}</li>
						{/if}
					</ul>
				{:else}
					<p class="text-pencil/60">{m.gdpr_no_database()}</p>
				{/if}
			</div>

			<h2>{m.gdpr_export_title()}</h2>
			<p>{m.gdpr_export_description()}</p>
			<ul>
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

			<h2>{m.gdpr_delete_title()}</h2>
			<div class="warning-box">
				<AlertTriangle size={20} />
				<div>
					<p><strong>{m.gdpr_delete_warning()}</strong></p>
					<p>{m.gdpr_delete_description()}</p>
					<ul>
						<li>{m.gdpr_delete_includes_account()}</li>
						<li>{m.gdpr_delete_includes_calls()}</li>
						<li>{m.gdpr_delete_includes_credits()}</li>
						<li>{m.gdpr_delete_includes_synced()}</li>
					</ul>
					<p class="text-sm">{m.gdpr_delete_local_notice()}</p>
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
				<div class="delete-confirm">
					<p><strong>{m.gdpr_delete_confirm_title()}</strong></p>
					<p>{m.gdpr_delete_confirm_instructions()}</p>
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
								{m.gdpr_delete_confirm_cancel()}
							</WobblyButton>
							<WobblyButton
								type="submit"
								variant="secondary"
								disabled={deleteConfirmText !== deleteConfirmWord || deleting}
								class="!bg-red-marker !text-paper"
							>
								<Trash2 size={20} />
								{deleting ? m.gdpr_delete_confirm_loading() : m.gdpr_delete_confirm_submit()}
							</WobblyButton>
						</div>
					</form>
				</div>
			{/if}

			{#if form?.success && deleting}
				<div class="success-box mt-4">
					<p><strong>{m.gdpr_delete_success()}</strong></p>
					<p>{m.gdpr_delete_success_redirect()}</p>
				</div>
			{/if}

			{#if form?.error}
				<div class="warning-box mt-4">
					<p><strong>{m.gdpr_delete_error()}</strong> {form.error}</p>
				</div>
			{/if}

			<h2>{m.gdpr_rights_title()}</h2>
			<p>{m.gdpr_rights_intro()}</p>
			<ul>
				<li><strong>{m.gdpr_rights_access()}</strong> {m.gdpr_rights_access_desc()}</li>
				<li><strong>{m.gdpr_rights_rectification()}</strong> {m.gdpr_rights_rectification_desc()}</li>
				<li><strong>{m.gdpr_rights_erasure()}</strong> {m.gdpr_rights_erasure_desc()}</li>
				<li><strong>{m.gdpr_rights_portability()}</strong> {m.gdpr_rights_portability_desc()}</li>
			</ul>

			<p>{m.gdpr_contact_intro()}</p>
			<div class="info-box">
				<p>
					<strong>{m.gdpr_contact_email()}</strong> <a href="mailto:karl@mail.online-impressum.de">karl@mail.online-impressum.de</a>
				</p>
			</div>

			<p class="text-sm text-pencil/50 mt-8">{m.gdpr_footer_links()} <a href="/datenschutz">{m.gdpr_footer_privacy()}</a> · <a href="/dsgvo">{m.gdpr_footer_health_data()}</a> · <a href="/impressum">{m.gdpr_footer_imprint()}</a></p>
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
	:global(:root.theme-modern) .warning-box,
	:global(:root.theme-apfel) .warning-box {
		border-width: 1px;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-hard-sm);
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
	:global(:root.theme-modern) .success-box,
	:global(:root.theme-apfel) .success-box {
		border-width: 1px;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-hard-sm);
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
	:global(:root.theme-modern) .delete-confirm,
	:global(:root.theme-apfel) .delete-confirm {
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-hard-sm);
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
	:global(:root.theme-modern) .confirm-input,
	:global(:root.theme-apfel) .confirm-input {
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-sm);
	}

	.lead {
		font-size: 1.125rem;
		color: var(--color-pencil);
		opacity: 0.8;
	}
</style>
