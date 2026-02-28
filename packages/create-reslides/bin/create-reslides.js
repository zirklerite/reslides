#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile, access, cp } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', 'template');

// --- Helpers ---

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function printHelp() {
	console.log(`create-reslides — Scaffold a new reslides presentation project

Usage:
  npx create-reslides@latest <project-name>

Example:
  npx create-reslides@latest my-presentation
  cd my-presentation
  pnpm dev`);
}

// --- Main ---

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
	printHelp();
	process.exit(0);
}

const projectName = args[0];

if (!projectName) {
	console.error('Error: Missing project name.\n');
	printHelp();
	process.exit(1);
}

const projectDir = join(process.cwd(), projectName);

if (await exists(projectDir)) {
	console.error(`Error: Directory "${projectName}" already exists.`);
	process.exit(1);
}

console.log(`\nCreating reslides project in ${projectName}/...\n`);

// Copy template directory
await cp(TEMPLATE_DIR, projectDir, { recursive: true });

// Generate package.json with the project name
const pkg = {
	name: projectName,
	private: true,
	version: '0.0.1',
	type: 'module',
	scripts: {
		dev: 'vite',
		build: 'vite build',
		preview: 'vite preview',
	},
	dependencies: {
		reslides: 'latest',
	},
	devDependencies: {
		'@sveltejs/vite-plugin-svelte': '^6.0.0',
		'@tsconfig/svelte': '^5.0.0',
		svelte: '^5.0.0',
		typescript: '~5.7.0',
		vite: '^6.0.0',
	},
};
await writeFile(join(projectDir, 'package.json'), JSON.stringify(pkg, null, '\t') + '\n', 'utf-8');

// List created files
async function listFiles(dir, prefix = '') {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			await listFiles(join(dir, entry.name), rel);
		} else {
			console.log(`  ${rel}`);
		}
	}
}
await listFiles(projectDir);

// Install dependencies
console.log('\nInstalling dependencies...\n');
let usedPnpm = false;
try {
	execSync('pnpm install', { cwd: projectDir, stdio: 'inherit' });
	usedPnpm = true;
} catch {
	try {
		execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
	} catch {
		console.error('\nWarning: dependency install failed. Run `pnpm install` or `npm install` manually after cd into the project.');
	}
}

const runCmd = usedPnpm ? 'pnpm dev' : 'npm run dev';
console.log(`
Done! To get started:

  cd ${projectName}
  ${runCmd}

Use /reslides in Claude Code to create and modify slides.
`);
