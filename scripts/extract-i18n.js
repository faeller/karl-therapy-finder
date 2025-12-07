#!/usr/bin/env node
/**
 * i18n Extractor for Paraglide
 *
 * Scans source files for t('key', 'default') calls and adds missing keys
 * to the German message file (base locale).
 *
 * Usage: node scripts/extract-i18n.js
 *    or: pnpm run i18n:extract
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const DE_MESSAGES = path.join(ROOT, 'messages', 'de.json');
const EN_MESSAGES = path.join(ROOT, 'messages', 'en.json');

/**
 * Recursively get all files matching extensions
 */
function getFiles(dir, extensions, files = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Skip node_modules and hidden dirs
			if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
				getFiles(fullPath, extensions, files);
			}
		} else if (extensions.some((ext) => entry.name.endsWith(ext))) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Extract t() calls from file content
 * Handles: t('key', 'value') and t("key", "value")
 */
function extractCalls(content, filePath) {
	const results = [];

	// Simple patterns for common cases
	const patterns = [
		// t('key', 'value') or t('key', 'value', params)
		/\bt\(\s*'([^']+)'\s*,\s*'([^']+)'/g,
		// t("key", "value")
		/\bt\(\s*"([^"]+)"\s*,\s*"([^"]+)"/g,
		// t('key', "value") - mixed quotes
		/\bt\(\s*'([^']+)'\s*,\s*"([^"]+)"/g,
		// t("key", 'value') - mixed quotes
		/\bt\(\s*"([^"]+)"\s*,\s*'([^']+)'/g
	];

	for (const pattern of patterns) {
		let match;
		// Reset lastIndex for each pattern
		pattern.lastIndex = 0;

		while ((match = pattern.exec(content)) !== null) {
			const [fullMatch, key, value] = match;
			results.push({
				key,
				value,
				file: path.relative(ROOT, filePath),
				line: content.substring(0, match.index).split('\n').length
			});
		}
	}

	return results;
}

/**
 * Main extraction logic
 */
async function extract() {
	console.log('[i18n] Scanning for t() calls...\n');

	const files = getFiles(SRC_DIR, ['.svelte', '.ts', '.js']);
	const extracted = new Map();
	const conflicts = [];

	for (const file of files) {
		// Skip the i18n.ts file itself and .d.ts files
		if (file.endsWith('i18n.ts') || file.endsWith('.d.ts')) continue;

		const content = fs.readFileSync(file, 'utf-8');
		const calls = extractCalls(content, file);

		for (const call of calls) {
			if (extracted.has(call.key)) {
				const existing = extracted.get(call.key);
				if (existing.value !== call.value) {
					conflicts.push({
						key: call.key,
						values: [
							{ value: existing.value, file: existing.file, line: existing.line },
							{ value: call.value, file: call.file, line: call.line }
						]
					});
				}
			} else {
				extracted.set(call.key, call);
			}
		}
	}

	// Report conflicts
	if (conflicts.length > 0) {
		console.log('[warn] Conflicts (same key, different defaults):\n');
		for (const conflict of conflicts) {
			console.log(`   "${conflict.key}":`);
			for (const v of conflict.values) {
				console.log(`     - "${v.value}" (${v.file}:${v.line})`);
			}
			console.log();
		}
	}

	// Read existing German messages
	let deMessages = {};
	if (fs.existsSync(DE_MESSAGES)) {
		const content = fs.readFileSync(DE_MESSAGES, 'utf-8');
		deMessages = JSON.parse(content);
	}

	// Read existing English messages
	let enMessages = {};
	if (fs.existsSync(EN_MESSAGES)) {
		const content = fs.readFileSync(EN_MESSAGES, 'utf-8');
		enMessages = JSON.parse(content);
	}

	// Track what we add
	const added = [];
	const existing = [];

	for (const [key, call] of extracted) {
		if (key in deMessages) {
			existing.push(key);
		} else {
			deMessages[key] = call.value;
			// Also add placeholder to English
			if (!(key in enMessages)) {
				enMessages[key] = `[EN] ${call.value}`;
			}
			added.push({ key, value: call.value, file: call.file });
		}
	}

	// Sort keys (keep $schema at top if present)
	const sortKeys = (obj) => {
		const schema = obj['$schema'];
		const sorted = Object.keys(obj)
			.filter((k) => k !== '$schema')
			.sort()
			.reduce((acc, key) => {
				acc[key] = obj[key];
				return acc;
			}, {});

		if (schema) {
			return { $schema: schema, ...sorted };
		}
		return sorted;
	};

	deMessages = sortKeys(deMessages);
	enMessages = sortKeys(enMessages);

	// Write back
	fs.writeFileSync(DE_MESSAGES, JSON.stringify(deMessages, null, '\t') + '\n');
	fs.writeFileSync(EN_MESSAGES, JSON.stringify(enMessages, null, '\t') + '\n');

	// Report results
	console.log('[i18n] Results:\n');
	console.log(`   Found: ${extracted.size} t() calls`);
	console.log(`   Already in de.json: ${existing.length}`);
	console.log(`   Added to de.json: ${added.length}`);

	if (added.length > 0) {
		console.log('\n[i18n] Added keys:\n');
		for (const { key, value, file } of added) {
			console.log(`   + "${key}": "${value}"`);
			console.log(`     from ${file}\n`);
		}
	}

	if (added.length > 0) {
		console.log('\n[i18n] Run `pnpm run dev` to regenerate Paraglide types.\n');
	} else {
		console.log('\n[i18n] All keys already exist. Nothing to do.\n');
	}
}

extract().catch((err) => {
	console.error('[i18n] Error:', err);
	process.exit(1);
});
