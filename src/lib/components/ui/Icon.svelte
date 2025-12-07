<script lang="ts">
	import type { Icon as LucideIcon } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	interface Props {
		icon: ComponentType<LucideIcon>;
		size?: number;
		strokeWidth?: number;
		class?: string;
	}

	let { icon: IconComponent, size = 24, strokeWidth = 2.5, class: className = '' }: Props = $props();
</script>

<IconComponent {size} {strokeWidth} class={className} />
