// wobbly border radius presets - creates organic hand-drawn edges
export const wobbly = {
	sm: '255px 15px 225px 15px / 15px 225px 15px 255px',
	md: '15px 255px 15px 225px / 225px 15px 255px 15px',
	lg: '225px 25px 255px 25px / 25px 255px 25px 225px',
	button: '255px 15px 225px 15px / 15px 225px 15px 255px',
	bubble: '20px 255px 20px 255px / 255px 20px 255px 20px',
	bubbleAlt: '255px 20px 255px 20px / 20px 255px 20px 255px'
} as const;

// random subtle rotation for playful feel
export function randomRotation(max = 2): string {
	const deg = (Math.random() - 0.5) * max * 2;
	return `${deg.toFixed(1)}deg`;
}
