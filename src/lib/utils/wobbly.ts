// wobbly border radii - uses CSS variables that change per theme
export const wobbly = {
	sm: 'var(--radius-sm)',
	md: 'var(--radius-md)',
	lg: 'var(--radius-lg)',
	button: 'var(--radius-button)',
	bubble: 'var(--radius-bubble)',
	bubbleAlt: 'var(--radius-bubble)'
} as const;

// random rotation for handdrawn style
export function randomRotation(max = 2): string {
	if (typeof window === 'undefined') return '0deg';
	const isHanddrawn = document.documentElement.classList.contains('theme-handdrawn');
	if (!isHanddrawn) return '0deg';
	const deg = (Math.random() - 0.5) * max * 2;
	return `${deg.toFixed(1)}deg`;
}
