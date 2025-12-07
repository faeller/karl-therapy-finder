import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';

// Custom plugin to extract i18n keys before Paraglide runs
function i18nExtractPlugin() {
	let hasRun = false;
	return {
		name: 'i18n-extract',
		buildStart() {
			if (!hasRun) {
				hasRun = true;
				console.log('\n[i18n] Extracting keys...');
				try {
					execSync('node scripts/extract-i18n.js', { stdio: 'inherit' });
				} catch {
					// Non-fatal - extraction might have no new keys
				}
			}
		}
	};
}

export default defineConfig({
	plugins: [
		i18nExtractPlugin(),
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
