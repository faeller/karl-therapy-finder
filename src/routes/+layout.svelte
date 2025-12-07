<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>KARL - Therapieplatz finden</title>
	<meta name="description" content="KARL hilft dir, einen Therapieplatz zu finden" />
</svelte:head>

{@render children()}
