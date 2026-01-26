<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Users, Phone, CreditCard, Shield, AlertTriangle, Activity,
		ChevronDown, ChevronRight, Search, X, Clock, CheckCircle,
		XCircle, Snowflake, DollarSign, TrendingUp, Eye, Plus,
		Trash2, Award, UserCog, Ban, FileText, Webhook, Moon, Sun,
		PhoneOutgoing, RefreshCw
	} from 'lucide-svelte';
	import { colorMode, theme } from '$lib/stores/theme';
	import KarlAvatar from '$lib/components/chat/KarlAvatar.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { data } = $props();

	// sync with global theme
	const darkMode = $derived($colorMode === 'dark');

	function toggleDarkMode() {
		theme.toggleColorMode();
	}

	// cleanup preload class after hydration
	onMount(() => {
		if (browser) {
			document.documentElement.classList.remove('admin-preload-dark');
		}
	});

	type Tab = 'overview' | 'users' | 'calls' | 'credits' | 'moderation' | 'logs' | 'elevenlabs';
	let activeTab = $state<Tab>('overview');

	// search/filter states
	let userSearch = $state('');
	let callFilter = $state<string>('all');
	let callSearch = $state('');

	// elevenlabs batch calls
	interface BatchCall {
		batch_call_id: string;
		agent_id: string;
		status: string;
		call_name: string;
		scheduled_time_unix: number;
		created_at_unix: number;
		recipients_count?: number;
	}
	let batchCalls = $state<BatchCall[]>([]);
	let batchCallsLoading = $state(false);
	let batchCallsError = $state<string | null>(null);

	async function fetchBatchCalls() {
		batchCallsLoading = true;
		batchCallsError = null;
		try {
			const res = await fetch('/api/admin/elevenlabs');
			if (!res.ok) throw new Error(`Failed: ${res.status}`);
			const data = await res.json();
			batchCalls = data.batchCalls || [];
		} catch (e) {
			batchCallsError = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			batchCallsLoading = false;
		}
	}

	async function cancelBatchCall(batchId: string) {
		if (!confirm('Cancel this batch call?')) return;
		try {
			const res = await fetch(`/api/admin/elevenlabs?batchId=${batchId}`, { method: 'DELETE' });
			if (!res.ok) throw new Error(`Failed: ${res.status}`);
			await fetchBatchCalls();
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed to cancel');
		}
	}

	let cancellingAll = $state(false);
	const pendingCalls = $derived(batchCalls.filter(c => c.status === 'pending' || c.status === 'in_progress'));

	async function cancelAllPending() {
		if (pendingCalls.length === 0) return;
		if (!confirm(`Cancel all ${pendingCalls.length} pending call(s)?`)) return;

		cancellingAll = true;
		let failed = 0;
		for (const call of pendingCalls) {
			try {
				const res = await fetch(`/api/admin/elevenlabs?batchId=${call.batch_call_id}`, { method: 'DELETE' });
				if (!res.ok) failed++;
			} catch {
				failed++;
			}
		}
		cancellingAll = false;
		await fetchBatchCalls();
		if (failed > 0) {
			alert(`${failed} call(s) failed to cancel`);
		}
	}

	// load batch calls when switching to that tab
	$effect(() => {
		if (activeTab === 'elevenlabs' && batchCalls.length === 0 && !batchCallsLoading) {
			fetchBatchCalls();
		}
	});

	// modal states
	let showAwardModal = $state(false);
	let showRoleModal = $state(false);
	let showOverrideModal = $state(false);
	let showBlocklistModal = $state(false);
	let selectedUserId = $state<string | null>(null);
	let selectedUser = $derived(data.users.find(u => u.id === selectedUserId));

	// expanded rows
	let expandedCallId = $state<string | null>(null);
	let expandedWebhookId = $state<string | null>(null);

	// form states
	let awardSeconds = $state(300);
	let awardReason = $state('');
	let awardAction = $state<'award' | 'deduct'>('award');
	let newRole = $state('user');
	let overrideReason = $state('');
	let overrideExpiresDays = $state<number | null>(null);
	let blocklistEId = $state('');
	let blocklistPhone = $state('');
	let blocklistName = $state('');
	let blocklistReason = $state('ai_rejected');
	let blocklistDetails = $state('');
	let blocklistPermanent = $state(false);

	// filtered data
	const filteredUsers = $derived(
		data.users.filter(u =>
			u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
			u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
			u.id.includes(userSearch)
		)
	);

	const filteredCalls = $derived(
		data.calls.filter(c => {
			const matchesFilter = callFilter === 'all' || c.status === callFilter;
			const matchesSearch = !callSearch ||
				c.therapistName?.toLowerCase().includes(callSearch.toLowerCase()) ||
				c.username.toLowerCase().includes(callSearch.toLowerCase()) ||
				c.id.includes(callSearch);
			return matchesFilter && matchesSearch;
		})
	);

	// helpers
	function formatSeconds(s: number): string {
		const mins = Math.floor(s / 60);
		const secs = s % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatMinutes(s: number): string {
		return `${Math.floor(s / 60)} min`;
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '-';
		return new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
	}

	function formatCurrency(cents: number): string {
		return `€${(cents / 100).toFixed(2)}`;
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			scheduled: 'bg-blue-500/20 text-blue-400',
			in_progress: 'bg-yellow-500/20 text-yellow-400',
			completed: 'bg-green-500/20 text-green-400',
			failed: 'bg-red-500/20 text-red-400',
			cancelled: 'bg-gray-500/20 text-gray-400',
			frozen: 'bg-cyan-500/20 text-cyan-400'
		};
		return colors[status] || 'bg-gray-500/20 text-gray-400';
	}

	function getRoleColor(role: string | null): string {
		const colors: Record<string, string> = {
			admin: 'bg-red-500/20 text-red-400',
			moderator: 'bg-purple-500/20 text-purple-400',
			tester: 'bg-blue-500/20 text-blue-400',
			user: 'bg-gray-500/20 text-gray-400'
		};
		return colors[role || 'user'] || 'bg-gray-500/20 text-gray-400';
	}

	function openAwardModal(userId: string) {
		selectedUserId = userId;
		awardSeconds = 300;
		awardReason = '';
		awardAction = 'award';
		showAwardModal = true;
	}

	function openRoleModal(userId: string) {
		selectedUserId = userId;
		const user = data.users.find(u => u.id === userId);
		newRole = user?.role || 'user';
		showRoleModal = true;
	}

	function openOverrideModal(userId: string) {
		selectedUserId = userId;
		overrideReason = '';
		overrideExpiresDays = 30;
		showOverrideModal = true;
	}
</script>

<svelte:head>
	<title>Admin - KARL</title>
	{@html `<script>
		(function() {
			try {
				var stored = localStorage.getItem('karl-theme');
				var isDark = false;
				if (stored) {
					if (stored === 'dark') isDark = true;
					else {
						var parsed = JSON.parse(stored);
						isDark = parsed && parsed.colorMode === 'dark';
					}
				} else {
					isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				}
				if (isDark) document.documentElement.classList.add('admin-preload-dark');
			} catch(e) {}
		})();
	</script>`}
</svelte:head>

<div class="admin-root min-h-screen" class:dark={darkMode}>
	<!-- header -->
	<header class="admin-header sticky top-0 z-40 border-b">
		<div class="max-w-7xl mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a href="/chat" class="admin-link">← Back</a>
					<div class="flex items-center gap-2">
						<KarlAvatar size="sm" />
						<h1 class="text-xl font-semibold admin-title">Admin</h1>
					</div>
				</div>
				<button onclick={toggleDarkMode} class="admin-toggle-btn p-2 rounded-lg" title={darkMode ? 'Light mode' : 'Dark mode'}>
					{#if darkMode}
						<Sun size={18} />
					{:else}
						<Moon size={18} />
					{/if}
				</button>
			</div>
		</div>
	</header>

	<!-- tabs -->
	<nav class="admin-nav border-b">
		<div class="max-w-7xl mx-auto px-4">
			<div class="flex gap-1 overflow-x-auto">
				{#each [
					{ id: 'overview', label: 'Overview', icon: Activity },
					{ id: 'users', label: 'Users', icon: Users },
					{ id: 'calls', label: 'Calls', icon: Phone },
					{ id: 'credits', label: 'Credits', icon: CreditCard },
					{ id: 'moderation', label: 'Moderation', icon: Shield },
					{ id: 'logs', label: 'Logs', icon: FileText },
					{ id: 'elevenlabs', label: 'ElevenLabs', icon: PhoneOutgoing }
				] as tab}
					<button
						onclick={() => activeTab = tab.id as Tab}
						class="admin-tab flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap"
						class:active={activeTab === tab.id}
					>
						<tab.icon size={16} />
						{tab.label}
					</button>
				{/each}
			</div>
		</div>
	</nav>

	<!-- content -->
	<main class="max-w-7xl mx-auto px-4 py-6">
		<!-- OVERVIEW TAB -->
		{#if activeTab === 'overview'}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<!-- stat cards -->
				<div class="admin-card p-4">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-blue-500/20 rounded-lg">
							<Users size={20} class="text-blue-500" />
						</div>
						<div>
							<div class="text-2xl font-bold admin-text">{data.stats.totalUsers}</div>
							<div class="text-sm admin-muted">Total Users</div>
						</div>
					</div>
				</div>

				<div class="admin-card p-4">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-green-500/20 rounded-lg">
							<DollarSign size={20} class="text-green-500" />
						</div>
						<div>
							<div class="text-2xl font-bold admin-text">{formatCurrency(data.stats.monthlyRevenueCents)}</div>
							<div class="text-sm admin-muted">Monthly Revenue</div>
						</div>
					</div>
				</div>

				<div class="admin-card p-4">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-purple-500/20 rounded-lg">
							<Phone size={20} class="text-purple-500" />
						</div>
						<div>
							<div class="text-2xl font-bold admin-text">{formatMinutes(data.stats.totalCallSeconds)}</div>
							<div class="text-sm admin-muted">Total Call Time</div>
						</div>
					</div>
				</div>

				<div class="admin-card p-4">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-red-500/20 rounded-lg">
							<TrendingUp size={20} class="text-red-500" />
						</div>
						<div>
							<div class="text-2xl font-bold admin-text">${data.stats.totalCostUsd.toFixed(2)}</div>
							<div class="text-sm admin-muted">Total API Cost</div>
						</div>
					</div>
				</div>
			</div>

			<!-- detailed stats -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- patrons by tier -->
				<div class="admin-card p-4">
					<h3 class="font-semibold admin-text mb-4">Patrons by Tier</h3>
					<div class="space-y-2">
						{#each Object.entries(data.stats.patronsByTier) as [tier, count]}
							<div class="flex items-center justify-between">
								<span class="admin-secondary capitalize">{tier}</span>
								<span class="font-medium admin-text">{count}</span>
							</div>
						{/each}
						{#if Object.keys(data.stats.patronsByTier).length === 0}
							<div class="admin-muted text-sm">No patrons yet</div>
						{/if}
					</div>
				</div>

				<!-- calls by status -->
				<div class="admin-card p-4">
					<h3 class="font-semibold admin-text mb-4">Calls by Status</h3>
					<div class="space-y-2">
						{#each Object.entries(data.stats.callsByStatus) as [status, count]}
							<div class="flex items-center justify-between">
								<span class="px-2 py-0.5 rounded text-xs font-medium {getStatusColor(status)}">{status}</span>
								<span class="font-medium admin-text">{count}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- calls by outcome -->
				<div class="admin-card p-4">
					<h3 class="font-semibold admin-text mb-4">Calls by Outcome</h3>
					<div class="space-y-2">
						{#each Object.entries(data.stats.callsByOutcome) as [outcome, count]}
							<div class="flex items-center justify-between">
								<span class="admin-secondary">{outcome}</span>
								<span class="font-medium admin-text">{count}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- this month -->
				<div class="admin-card p-4">
					<h3 class="font-semibold admin-text mb-4">This Month</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="admin-secondary">Call Minutes</span>
							<span class="font-medium admin-text">{formatMinutes(data.stats.monthCallSeconds)}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="admin-secondary">Pending Calls</span>
							<span class="font-medium admin-text">{data.stats.pendingCalls}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="admin-secondary">Frozen Calls</span>
							<span class="font-medium admin-text">{data.stats.frozenCalls}</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- USERS TAB -->
		{#if activeTab === 'users'}
			<div class="admin-card">
				<div class="p-4 border-b border-gray-200">
					<div class="flex items-center gap-4">
						<div class="relative flex-1 max-w-md">
							<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								bind:value={userSearch}
								placeholder="Search users..."
								class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div class="text-sm admin-muted">{filteredUsers.length} users</div>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-gray-50 text-left">
							<tr>
								<th class="px-4 py-3 font-medium admin-secondary">User</th>
								<th class="px-4 py-3 font-medium admin-secondary">Role</th>
								<th class="px-4 py-3 font-medium admin-secondary">Tier</th>
								<th class="px-4 py-3 font-medium admin-secondary">Pledge</th>
								<th class="px-4 py-3 font-medium admin-secondary">Joined</th>
								<th class="px-4 py-3 font-medium admin-secondary">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each filteredUsers as user}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											{#if user.avatarUrl}
												<img src={user.avatarUrl} alt="" class="w-8 h-8 rounded-full" />
											{:else}
												<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center admin-secondary font-medium">
													{user.username.charAt(0).toUpperCase()}
												</div>
											{/if}
											<div>
												<div class="font-medium admin-text">{user.username}</div>
												<div class="text-xs admin-muted">{user.email || user.id}</div>
											</div>
										</div>
									</td>
									<td class="px-4 py-3">
										<span class="px-2 py-0.5 rounded text-xs font-medium {getRoleColor(user.role)}">
											{user.role || 'user'}
										</span>
									</td>
									<td class="px-4 py-3 admin-secondary">{user.pledgeTier || '-'}</td>
									<td class="px-4 py-3 admin-secondary">
										{user.pledgeAmountCents ? formatCurrency(user.pledgeAmountCents) : '-'}
									</td>
									<td class="px-4 py-3 admin-secondary">{formatDate(user.createdAt)}</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-1">
											<button
												onclick={() => openAwardModal(user.id)}
												class="p-1.5 admin-muted hover:text-green-600 hover:bg-green-50 rounded"
												title="Award credits"
											>
												<Award size={16} />
											</button>
											<button
												onclick={() => openRoleModal(user.id)}
												class="p-1.5 admin-muted hover:text-blue-600 hover:bg-blue-50 rounded"
												title="Change role"
											>
												<UserCog size={16} />
											</button>
											<button
												onclick={() => openOverrideModal(user.id)}
												class="p-1.5 admin-muted hover:text-purple-600 hover:bg-purple-50 rounded"
												title="Add validation override"
											>
												<Shield size={16} />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- CALLS TAB -->
		{#if activeTab === 'calls'}
			<div class="admin-card">
				<div class="p-4 border-b border-gray-200">
					<div class="flex flex-wrap items-center gap-4">
						<div class="relative flex-1 max-w-md">
							<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								bind:value={callSearch}
								placeholder="Search calls..."
								class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<select
							bind:value={callFilter}
							class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Status</option>
							<option value="scheduled">Scheduled</option>
							<option value="in_progress">In Progress</option>
							<option value="completed">Completed</option>
							<option value="failed">Failed</option>
							<option value="cancelled">Cancelled</option>
							<option value="frozen">Frozen</option>
						</select>
						<div class="text-sm admin-muted">{filteredCalls.length} calls</div>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-gray-50 text-left">
							<tr>
								<th class="px-4 py-3 font-medium admin-secondary w-8"></th>
								<th class="px-4 py-3 font-medium admin-secondary">User</th>
								<th class="px-4 py-3 font-medium admin-secondary">Therapist</th>
								<th class="px-4 py-3 font-medium admin-secondary">Status</th>
								<th class="px-4 py-3 font-medium admin-secondary">Outcome</th>
								<th class="px-4 py-3 font-medium admin-secondary">Duration</th>
								<th class="px-4 py-3 font-medium admin-secondary">Scheduled</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each filteredCalls as call}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3">
										<button
											onclick={() => expandedCallId = expandedCallId === call.id ? null : call.id}
											class="p-1 text-gray-400 hover:admin-secondary"
										>
											{#if expandedCallId === call.id}
												<ChevronDown size={16} />
											{:else}
												<ChevronRight size={16} />
											{/if}
										</button>
									</td>
									<td class="px-4 py-3 admin-text">{call.username}</td>
									<td class="px-4 py-3">
										<div class="font-medium admin-text">{call.therapistName || '-'}</div>
										<div class="text-xs admin-muted">{call.therapistPhone}</div>
									</td>
									<td class="px-4 py-3">
										<span class="px-2 py-0.5 rounded text-xs font-medium {getStatusColor(call.status)}">
											{call.status}
										</span>
									</td>
									<td class="px-4 py-3 admin-secondary">{call.outcome || '-'}</td>
									<td class="px-4 py-3 admin-secondary">
										{call.durationSeconds ? formatSeconds(call.durationSeconds) : '-'}
									</td>
									<td class="px-4 py-3 admin-secondary">{formatDate(call.scheduledAt)}</td>
								</tr>
								{#if expandedCallId === call.id}
									<tr class="bg-gray-50">
										<td colspan="7" class="px-4 py-4">
											<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
												<div>
													<div class="admin-muted">Call ID</div>
													<div class="font-mono text-xs">{call.id}</div>
												</div>
												<div>
													<div class="admin-muted">ElevenLabs ID</div>
													<div class="font-mono text-xs">{call.elevenlabsConvId || '-'}</div>
												</div>
												<div>
													<div class="admin-muted">Attempt</div>
													<div>{call.attemptNumber} / {call.maxAttempts}</div>
												</div>
												<div>
													<div class="admin-muted">Projected</div>
													<div>{call.projectedSeconds ? formatSeconds(call.projectedSeconds) : '-'}</div>
												</div>
												{#if call.appointmentDate}
													<div>
														<div class="admin-muted">Appointment</div>
														<div>{call.appointmentDate} {call.appointmentTime || ''}</div>
													</div>
												{/if}
												{#if call.rejectionReason}
													<div>
														<div class="admin-muted">Rejection</div>
														<div class="text-red-600">{call.rejectionReason}</div>
													</div>
												{/if}
												{#if call.notes}
													<div class="col-span-2">
														<div class="admin-muted">Notes</div>
														<div>{call.notes}</div>
													</div>
												{/if}
											</div>
											{#if call.transcript}
												<details class="mt-4">
													<summary class="cursor-pointer text-blue-600 hover:text-blue-800">View Transcript</summary>
													<pre class="mt-2 p-3 bg-white rounded border text-xs overflow-x-auto whitespace-pre-wrap">{call.transcript}</pre>
												</details>
											{/if}
											{#if call.analysis}
												<details class="mt-2">
													<summary class="cursor-pointer text-blue-600 hover:text-blue-800">View Analysis</summary>
													<pre class="mt-2 p-3 bg-white rounded border text-xs overflow-x-auto">{JSON.stringify(JSON.parse(call.analysis), null, 2)}</pre>
												</details>
											{/if}
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- CREDITS TAB -->
		{#if activeTab === 'credits'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- user credits -->
				<div class="admin-card">
					<div class="p-4 border-b border-gray-200">
						<h3 class="font-semibold admin-text">User Credits</h3>
					</div>
					<div class="overflow-x-auto max-h-96 overflow-y-auto">
						<table class="w-full text-sm">
							<thead class="bg-gray-50 text-left sticky top-0">
								<tr>
									<th class="px-4 py-2 font-medium admin-secondary">User</th>
									<th class="px-4 py-2 font-medium admin-secondary">Available</th>
									<th class="px-4 py-2 font-medium admin-secondary">Used</th>
									<th class="px-4 py-2 font-medium admin-secondary">Total</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#each data.credits as credit}
									{@const available = (credit.creditsTotal || 0) - (credit.creditsUsed || 0) + (credit.creditsRefunded || 0)}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-2">
											<div class="font-medium admin-text">{credit.username}</div>
											<div class="text-xs admin-muted">{credit.pledgeTier || 'free'}</div>
										</td>
										<td class="px-4 py-2 admin-text font-medium">{formatSeconds(available)}</td>
										<td class="px-4 py-2 admin-secondary">{formatSeconds(credit.creditsUsed || 0)}</td>
										<td class="px-4 py-2 admin-secondary">{formatSeconds(credit.creditsTotal || 0)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- audit log -->
				<div class="admin-card">
					<div class="p-4 border-b border-gray-200">
						<h3 class="font-semibold admin-text">Credit Audit Log</h3>
					</div>
					<div class="overflow-x-auto max-h-96 overflow-y-auto">
						<table class="w-full text-sm">
							<thead class="bg-gray-50 text-left sticky top-0">
								<tr>
									<th class="px-4 py-2 font-medium admin-secondary">User</th>
									<th class="px-4 py-2 font-medium admin-secondary">Event</th>
									<th class="px-4 py-2 font-medium admin-secondary">Seconds</th>
									<th class="px-4 py-2 font-medium admin-secondary">Time</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#each data.auditLog as entry}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-2 admin-text">{entry.username}</td>
										<td class="px-4 py-2">
											<span class="event-badge px-2 py-0.5 rounded text-xs font-medium">
												{entry.eventType}
											</span>
										</td>
										<td class="px-4 py-2 font-medium {entry.seconds > 0 ? 'text-green-600' : 'text-red-600'}">
											{entry.seconds > 0 ? '+' : ''}{entry.seconds}s
										</td>
										<td class="px-4 py-2 admin-secondary text-xs">{formatDate(entry.createdAt)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}

		<!-- MODERATION TAB -->
		{#if activeTab === 'moderation'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- validation overrides -->
				<div class="admin-card">
					<div class="p-4 border-b border-gray-200 flex items-center justify-between">
						<h3 class="font-semibold admin-text">Validation Overrides</h3>
					</div>
					<div class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
						{#each data.validationOverrides as override}
							<div class="p-4 flex items-start justify-between gap-4">
								<div>
									<div class="font-medium admin-text">{override.username}</div>
									<div class="text-sm admin-secondary">{override.reason || 'No reason'}</div>
									<div class="text-xs admin-muted mt-1">
										Expires: {override.expiresAt ? formatDate(override.expiresAt) : 'Never'}
									</div>
								</div>
								<form method="POST" action="?/removeOverride" use:enhance>
									<input type="hidden" name="userId" value={override.userId} />
									<button type="submit" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
										<Trash2 size={16} />
									</button>
								</form>
							</div>
						{:else}
							<div class="p-4 admin-muted text-sm">No validation overrides</div>
						{/each}
					</div>
				</div>

				<!-- blocklist -->
				<div class="admin-card">
					<div class="p-4 border-b border-gray-200 flex items-center justify-between">
						<h3 class="font-semibold admin-text">Therapist Blocklist</h3>
						<button
							onclick={() => showBlocklistModal = true}
							class="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
						>
							<Plus size={14} />
							Add
						</button>
					</div>
					<div class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
						{#each data.blocklist as item}
							<div class="p-4 flex items-start justify-between gap-4">
								<div>
									<div class="font-medium admin-text">{item.therapistName || item.phone || item.eId}</div>
									<div class="text-xs admin-muted">
										{#if item.eId}eId: {item.eId}{/if}
										{#if item.eId && item.phone} · {/if}
										{#if item.phone}Phone: {item.phone}{/if}
									</div>
									<div class="text-sm admin-secondary mt-1">{item.reason}</div>
									{#if item.details}
										<div class="text-xs admin-muted mt-1">{item.details}</div>
									{/if}
									<div class="text-xs text-gray-400 mt-1">
										{item.permanent ? 'Permanent' : 'Temporary'}
									</div>
								</div>
								<form method="POST" action="?/removeBlocklist" use:enhance>
									<input type="hidden" name="id" value={item.id} />
									<button type="submit" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
										<Trash2 size={16} />
									</button>
								</form>
							</div>
						{:else}
							<div class="p-4 admin-muted text-sm">No blocked therapists</div>
						{/each}
					</div>
				</div>

				<!-- privacy incidents -->
				<div class="admin-card lg:col-span-2">
					<div class="p-4 border-b border-gray-200">
						<h3 class="font-semibold admin-text">Privacy Incidents</h3>
					</div>
					<div class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
						{#each data.privacyIncidents as incident}
							<div class="p-4 flex items-start justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<span class="px-2 py-0.5 rounded text-xs font-medium
											{incident.severity === 'high' ? 'bg-red-100 text-red-800' :
											 incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
											 'bg-gray-100 admin-secondary'}">
											{incident.severity}
										</span>
										{#if incident.adminReviewed}
											<CheckCircle size={14} class="text-green-500" />
										{/if}
									</div>
									{#if incident.transcriptExcerpt}
										<div class="text-sm admin-secondary mt-2 font-mono bg-gray-50 p-2 rounded">
											{incident.transcriptExcerpt}
										</div>
									{/if}
									{#if incident.actionTaken}
										<div class="text-sm admin-muted mt-2">Action: {incident.actionTaken}</div>
									{/if}
									<div class="text-xs text-gray-400 mt-1">{formatDate(incident.createdAt)}</div>
								</div>
								{#if !incident.adminReviewed}
									<form method="POST" action="?/reviewIncident" use:enhance class="flex items-center gap-2">
										<input type="hidden" name="id" value={incident.id} />
										<input
											type="text"
											name="actionTaken"
											placeholder="Action taken..."
											class="px-2 py-1 text-sm border rounded"
										/>
										<button type="submit" class="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
											Mark Reviewed
										</button>
									</form>
								{/if}
							</div>
						{:else}
							<div class="p-4 admin-muted text-sm">No privacy incidents</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- LOGS TAB -->
		<!-- ELEVENLABS TAB -->
		{#if activeTab === 'elevenlabs'}
			<div class="admin-card">
				<div class="p-4 border-b border-gray-200 flex items-center justify-between">
					<h3 class="font-semibold admin-text">ElevenLabs Batch Calls</h3>
					<div class="flex items-center gap-2">
						<button
							onclick={cancelAllPending}
							class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg
								{pendingCalls.length > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}"
							disabled={cancellingAll || pendingCalls.length === 0}
						>
							{#if cancellingAll}
								<RefreshCw size={14} class="animate-spin" />
								Cancelling...
							{:else}
								Cancel All {pendingCalls.length > 0 ? `(${pendingCalls.length})` : ''}
							{/if}
						</button>
						<button
							onclick={fetchBatchCalls}
							class="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
							disabled={batchCallsLoading}
						>
							<RefreshCw size={14} class={batchCallsLoading ? 'animate-spin' : ''} />
							Refresh
						</button>
					</div>
				</div>

				{#if batchCallsError}
					<div class="p-4 text-red-600">{batchCallsError}</div>
				{:else if batchCallsLoading && batchCalls.length === 0}
					<div class="p-4 admin-muted">Loading...</div>
				{:else if batchCalls.length === 0}
					<div class="p-4 admin-muted">No batch calls found</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="bg-gray-50 text-left">
								<tr>
									<th class="px-4 py-3 font-medium">Name</th>
									<th class="px-4 py-3 font-medium">Status</th>
									<th class="px-4 py-3 font-medium">Scheduled</th>
									<th class="px-4 py-3 font-medium">Created</th>
									<th class="px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#each batchCalls as call}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-3">
											<div class="font-medium admin-text">{call.call_name || '-'}</div>
											<div class="text-xs admin-muted font-mono">{call.batch_call_id}</div>
										</td>
										<td class="px-4 py-3">
											<span class="px-2 py-0.5 rounded text-xs font-medium
												{call.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
												 call.status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
												 call.status === 'completed' ? 'bg-green-500/20 text-green-600' :
												 call.status === 'cancelled' ? 'bg-gray-500/20 text-gray-600' :
												 'bg-red-500/20 text-red-600'}">
												{call.status}
											</span>
										</td>
										<td class="px-4 py-3 admin-secondary">
											{call.scheduled_time_unix
												? new Date(call.scheduled_time_unix * 1000).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
												: 'Immediate'}
										</td>
										<td class="px-4 py-3 admin-secondary text-xs">
											{new Date(call.created_at_unix * 1000).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
										</td>
										<td class="px-4 py-3">
											{#if call.status === 'pending' || call.status === 'in_progress'}
												<button
													onclick={() => cancelBatchCall(call.batch_call_id)}
													class="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
												>
													Cancel
												</button>
											{:else}
												<span class="text-xs admin-muted">-</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'logs'}
			<div class="grid grid-cols-1 gap-6">
				<!-- cost events -->
				<div class="admin-card">
					<div class="p-4 border-b border-gray-200">
						<h3 class="font-semibold admin-text">API Cost Events</h3>
					</div>
					<div class="overflow-x-auto max-h-80 overflow-y-auto">
						<table class="w-full text-sm">
							<thead class="bg-gray-50 text-left sticky top-0">
								<tr>
									<th class="px-4 py-2 font-medium admin-secondary">Type</th>
									<th class="px-4 py-2 font-medium admin-secondary">Provider</th>
									<th class="px-4 py-2 font-medium admin-secondary">Model</th>
									<th class="px-4 py-2 font-medium admin-secondary">Tokens</th>
									<th class="px-4 py-2 font-medium admin-secondary">Duration</th>
									<th class="px-4 py-2 font-medium admin-secondary">Cost</th>
									<th class="px-4 py-2 font-medium admin-secondary">Time</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								{#each data.costEvents as event}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-2 admin-text">{event.eventType}</td>
										<td class="px-4 py-2 admin-secondary">{event.provider}</td>
										<td class="px-4 py-2 admin-secondary text-xs">{event.model || '-'}</td>
										<td class="px-4 py-2 admin-secondary">
											{event.inputTokens || event.outputTokens
												? `${event.inputTokens || 0}/${event.outputTokens || 0}`
												: '-'}
										</td>
										<td class="px-4 py-2 admin-secondary">
											{event.durationSeconds ? formatSeconds(event.durationSeconds) : '-'}
										</td>
										<td class="px-4 py-2 admin-text font-medium">${event.costUsd || '0.00'}</td>
										<td class="px-4 py-2 admin-secondary text-xs">{formatDate(event.createdAt)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- webhook logs -->
				<div class="admin-card">
					<div class="p-4 border-b border-gray-200">
						<h3 class="font-semibold admin-text">Webhook Logs</h3>
					</div>
					<div class="divide-y divide-gray-100 max-h-96 overflow-y-auto">
						{#each data.webhookLogs as log}
							<div class="p-4">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Webhook size={14} class="text-gray-400" />
										<span class="font-medium admin-text">{log.source}</span>
										<span class="px-2 py-0.5 rounded text-xs font-medium {log.processingError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
											{log.status || (log.processingError ? 'error' : 'ok')}
										</span>
									</div>
									<button
										onclick={() => expandedWebhookId = expandedWebhookId === log.id ? null : log.id}
										class="text-blue-600 hover:text-blue-800 text-sm"
									>
										{expandedWebhookId === log.id ? 'Hide' : 'Show'} payload
									</button>
								</div>
								<div class="text-xs admin-muted mt-1">
									{log.conversationId || '-'} · {formatDate(log.createdAt)}
								</div>
								{#if log.processingError}
									<div class="text-sm text-red-600 mt-1">{log.processingError}</div>
								{/if}
								{#if expandedWebhookId === log.id}
									<pre class="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">{JSON.stringify(JSON.parse(log.rawPayload), null, 2)}</pre>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

<!-- MODALS -->

<!-- Award/Deduct Credits Modal -->
{#if showAwardModal && selectedUser}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => showAwardModal = false}>
		<div class="bg-white rounded-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold admin-text">Adjust Credits</h3>
				<button onclick={() => showAwardModal = false} class="text-gray-400 hover:admin-secondary">
					<X size={20} />
				</button>
			</div>
			<p class="text-sm admin-secondary mb-4">Adjust credits for <strong>{selectedUser.username}</strong></p>
			<form method="POST" action="?/awardCredits" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') showAwardModal = false;
				};
			}}>
				<input type="hidden" name="userId" value={selectedUserId} />
				<input type="hidden" name="action" value={awardAction} />
				<div class="space-y-4">
					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => awardAction = 'award'}
							class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
								{awardAction === 'award' ? 'bg-green-600 text-white' : 'bg-gray-100 admin-secondary hover:bg-gray-200'}"
						>
							+ Award
						</button>
						<button
							type="button"
							onclick={() => awardAction = 'deduct'}
							class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
								{awardAction === 'deduct' ? 'bg-red-600 text-white' : 'bg-gray-100 admin-secondary hover:bg-gray-200'}"
						>
							− Deduct
						</button>
					</div>
					<div>
						<label class="block text-sm font-medium admin-secondary mb-1">Seconds</label>
						<input
							type="number"
							name="seconds"
							bind:value={awardSeconds}
							min="1"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<div class="text-xs admin-muted mt-1">= {formatMinutes(awardSeconds)}</div>
					</div>
					<div>
						<label class="block text-sm font-medium admin-secondary mb-1">Reason</label>
						<input
							type="text"
							name="reason"
							bind:value={awardReason}
							placeholder={awardAction === 'award' ? 'e.g., Bug compensation' : 'e.g., Abuse correction'}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
				<div class="flex justify-end gap-3 mt-6">
					<button type="button" onclick={() => showAwardModal = false} class="px-4 py-2 admin-secondary hover:bg-gray-100 rounded-lg">
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-white rounded-lg {awardAction === 'award' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}"
					>
						{awardAction === 'award' ? '+' : '−'}{formatSeconds(awardSeconds)}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Change Role Modal -->
{#if showRoleModal && selectedUser}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => showRoleModal = false}>
		<div class="bg-white rounded-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold admin-text">Change Role</h3>
				<button onclick={() => showRoleModal = false} class="text-gray-400 hover:admin-secondary">
					<X size={20} />
				</button>
			</div>
			<p class="text-sm admin-secondary mb-4">Change role for <strong>{selectedUser.username}</strong></p>
			<form method="POST" action="?/changeRole" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') showRoleModal = false;
				};
			}}>
				<input type="hidden" name="userId" value={selectedUserId} />
				<div class="space-y-2">
					{#each ['user', 'tester', 'moderator', 'admin'] as role}
						<label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {newRole === role ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
							<input
								type="radio"
								name="role"
								value={role}
								bind:group={newRole}
								class="text-blue-600"
							/>
							<div>
								<div class="font-medium admin-text capitalize">{role}</div>
								<div class="text-xs admin-muted">
									{#if role === 'user'}Basic access{/if}
									{#if role === 'tester'}Can test debug calls{/if}
									{#if role === 'moderator'}Can manage blocklist, overrides{/if}
									{#if role === 'admin'}Full access{/if}
								</div>
							</div>
						</label>
					{/each}
				</div>
				<div class="flex justify-end gap-3 mt-6">
					<button type="button" onclick={() => showRoleModal = false} class="px-4 py-2 admin-secondary hover:bg-gray-100 rounded-lg">
						Cancel
					</button>
					<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
						Save
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Add Override Modal -->
{#if showOverrideModal && selectedUser}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => showOverrideModal = false}>
		<div class="bg-white rounded-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold admin-text">Add Validation Override</h3>
				<button onclick={() => showOverrideModal = false} class="text-gray-400 hover:admin-secondary">
					<X size={20} />
				</button>
			</div>
			<p class="text-sm admin-secondary mb-4">Whitelist <strong>{selectedUser.username}</strong> from call validation</p>
			<form method="POST" action="?/addOverride" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') showOverrideModal = false;
				};
			}}>
				<input type="hidden" name="userId" value={selectedUserId} />
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium admin-secondary mb-1">Reason</label>
						<input
							type="text"
							name="reason"
							bind:value={overrideReason}
							placeholder="e.g., Verified legitimate user"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium admin-secondary mb-1">Expires in (days)</label>
						<input
							type="number"
							name="expiresInDays"
							bind:value={overrideExpiresDays}
							min="1"
							placeholder="Leave empty for permanent"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
				<div class="flex justify-end gap-3 mt-6">
					<button type="button" onclick={() => showOverrideModal = false} class="px-4 py-2 admin-secondary hover:bg-gray-100 rounded-lg">
						Cancel
					</button>
					<button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
						Add Override
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Add Blocklist Modal -->
{#if showBlocklistModal}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => showBlocklistModal = false}>
		<div class="bg-white rounded-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold admin-text">Add to Blocklist</h3>
				<button onclick={() => showBlocklistModal = false} class="text-gray-400 hover:admin-secondary">
					<X size={20} />
				</button>
			</div>
			<form method="POST" action="?/addBlocklist" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						showBlocklistModal = false;
						blocklistEId = '';
						blocklistPhone = '';
						blocklistName = '';
						blocklistDetails = '';
					}
				};
			}}>
				<p class="text-sm admin-muted mb-4">Block by eId (TK database) or phone number. At least one required.</p>
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-sm font-medium admin-secondary mb-1">eId</label>
							<input
								type="text"
								name="eId"
								bind:value={blocklistEId}
								placeholder="e.g. 123456"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium admin-secondary mb-1">Phone</label>
							<input
								type="text"
								name="phone"
								bind:value={blocklistPhone}
								placeholder="e.g. +4930123456"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium admin-secondary mb-1">Name (optional)</label>
						<input
							type="text"
							name="therapistName"
							bind:value={blocklistName}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium admin-secondary mb-1">Reason *</label>
						<select
							name="reason"
							bind:value={blocklistReason}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="ai_rejected">Rejected AI calls</option>
							<option value="privacy_concern">Privacy concern</option>
							<option value="hostile">Hostile response</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium admin-secondary mb-1">Details</label>
						<textarea
							name="details"
							bind:value={blocklistDetails}
							rows="2"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						></textarea>
					</div>
					<label class="flex items-center gap-2">
						<input type="checkbox" name="permanent" bind:checked={blocklistPermanent} value="true" />
						<span class="text-sm admin-secondary">Permanent block</span>
					</label>
				</div>
				<div class="flex justify-end gap-3 mt-6">
					<button type="button" onclick={() => showBlocklistModal = false} class="px-4 py-2 admin-secondary hover:bg-gray-100 rounded-lg">
						Cancel
					</button>
					<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
						Add to Blocklist
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* base colors - light mode */
	.admin-root {
		--admin-bg: #f9fafb;
		--admin-card-bg: #ffffff;
		--admin-border: #e5e7eb;
		--admin-text: #111827;
		--admin-secondary: #4b5563;
		--admin-muted: #6b7280;
		--admin-hover: #f3f4f6;
		--admin-input-bg: #ffffff;
		--admin-input-border: #d1d5db;
	}

	/* dark mode - both from store (.dark) and preload class on html */
	.admin-root.dark,
	:global(html.admin-preload-dark) .admin-root {
		--admin-bg: #0f172a;
		--admin-card-bg: #1e293b;
		--admin-border: #475569;
		--admin-text: #ffffff;
		--admin-secondary: #e2e8f0;
		--admin-muted: #cbd5e1;
		--admin-hover: #334155;
		--admin-input-bg: #1e293b;
		--admin-input-border: #64748b;
	}

	/* karl avatar in admin */
	:global(.admin-root .karl-avatar) {
		background-color: var(--admin-card-bg);
		border-color: var(--admin-text);
		color: var(--admin-text);
	}

	.admin-root {
		background-color: var(--admin-bg);
		transition: background-color 150ms;
	}

	/* header + nav */
	.admin-header, .admin-nav {
		background-color: var(--admin-card-bg);
		border-color: var(--admin-border);
		transition: background-color 150ms, border-color 150ms;
	}

	.admin-title { color: var(--admin-text); }
	.admin-link { color: var(--admin-muted); }
	.admin-link:hover { color: var(--admin-text); }

	.admin-toggle-btn {
		background-color: var(--admin-hover);
		color: var(--admin-secondary);
	}
	.admin-toggle-btn:hover {
		background-color: var(--admin-border);
	}

	/* tabs */
	.admin-tab {
		border-color: transparent;
		color: var(--admin-muted);
	}
	.admin-tab:hover {
		color: var(--admin-secondary);
		border-color: var(--admin-border);
	}
	.admin-tab.active {
		color: #60a5fa;
		border-color: #3b82f6;
	}

	/* cards */
	.admin-card {
		background-color: var(--admin-card-bg);
		border: 1px solid var(--admin-border);
		border-radius: 0.5rem;
		transition: background-color 150ms, border-color 150ms;
	}

	/* text classes */
	:global(.admin-root .admin-text) { color: var(--admin-text) !important; }
	:global(.admin-root .admin-secondary) { color: var(--admin-secondary) !important; }
	:global(.admin-root .admin-muted) { color: var(--admin-muted) !important; }

	/* tables */
	:global(.admin-root table thead) {
		background-color: var(--admin-hover);
	}
	:global(.admin-root table th) {
		color: var(--admin-text) !important;
		font-weight: 600;
	}
	:global(.admin-root table td) {
		color: var(--admin-secondary);
	}
	:global(.admin-root table tbody tr) {
		border-color: var(--admin-border);
	}
	:global(.admin-root table tbody tr:hover) {
		background-color: var(--admin-hover);
	}
	:global(.admin-root .divide-gray-100 > :not([hidden]) ~ :not([hidden])) {
		border-color: var(--admin-border);
	}

	/* badges in dark mode need better contrast */
	:global(.admin-root.dark .bg-gray-500\/20) { background-color: rgba(100, 116, 139, 0.3) !important; }
	:global(.admin-root.dark .text-gray-400) { color: #e2e8f0 !important; }
	:global(.admin-root.dark .bg-blue-500\/20) { background-color: rgba(59, 130, 246, 0.3) !important; }
	:global(.admin-root.dark .text-blue-400) { color: #93c5fd !important; }
	:global(.admin-root.dark .bg-green-500\/20) { background-color: rgba(34, 197, 94, 0.3) !important; }
	:global(.admin-root.dark .text-green-400) { color: #86efac !important; }
	:global(.admin-root.dark .bg-red-500\/20) { background-color: rgba(239, 68, 68, 0.3) !important; }
	:global(.admin-root.dark .text-red-400) { color: #fca5a5 !important; }
	:global(.admin-root.dark .bg-yellow-500\/20) { background-color: rgba(234, 179, 8, 0.3) !important; }
	:global(.admin-root.dark .text-yellow-400) { color: #fde047 !important; }
	:global(.admin-root.dark .bg-purple-500\/20) { background-color: rgba(168, 85, 247, 0.3) !important; }
	:global(.admin-root.dark .text-purple-400) { color: #d8b4fe !important; }
	:global(.admin-root.dark .bg-cyan-500\/20) { background-color: rgba(6, 182, 212, 0.3) !important; }
	:global(.admin-root.dark .text-cyan-400) { color: #67e8f9 !important; }

	/* green/red text for +/- values */
	:global(.admin-root.dark .text-green-600) { color: #4ade80 !important; }
	:global(.admin-root.dark .text-red-600) { color: #f87171 !important; }

	/* inputs */
	:global(.admin-root input[type="text"]),
	:global(.admin-root input[type="number"]),
	:global(.admin-root input[type="email"]),
	:global(.admin-root select),
	:global(.admin-root textarea) {
		background-color: var(--admin-input-bg);
		border-color: var(--admin-input-border);
		color: var(--admin-text);
	}
	:global(.admin-root input::placeholder),
	:global(.admin-root textarea::placeholder) {
		color: var(--admin-muted);
	}

	/* modals */
	:global(.admin-root .bg-white) {
		background-color: var(--admin-card-bg) !important;
	}
	:global(.admin-root .bg-gray-50) {
		background-color: var(--admin-hover) !important;
	}
	:global(.admin-root .border-gray-200),
	:global(.admin-root .border-gray-300) {
		border-color: var(--admin-border) !important;
	}
	:global(.admin-root .hover\:bg-gray-100:hover) {
		background-color: var(--admin-hover) !important;
	}
	:global(.admin-root .hover\:bg-gray-50:hover) {
		background-color: var(--admin-hover) !important;
	}

	/* pre/code blocks */
	:global(.admin-root pre) {
		background-color: var(--admin-hover) !important;
		color: var(--admin-text);
	}

	/* details summary */
	:global(.admin-root details summary) {
		color: #60a5fa;
	}
	:global(.admin-root details summary:hover) {
		color: #93c5fd;
	}
</style>
