#!/usr/bin/env node

import { readdir, readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const SKILLS_DIR = resolve('.claude/skills');
const BUILT_IN_SKILLS = ['reslides'];

// --- Helpers ---

async function exists(path) {
	try {
		await readFile(path);
		return true;
	} catch {
		return false;
	}
}

async function dirExists(path) {
	try {
		await readdir(path);
		return true;
	} catch {
		return false;
	}
}

async function confirm(question) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(`${question} (y/N) `, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase() === 'y');
		});
	});
}

function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};
	const result = {};
	for (const line of match[1].split('\n')) {
		const idx = line.indexOf(':');
		if (idx > 0) {
			result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
		}
	}
	return result;
}

// --- GitHub API ---

async function fetchGitHubTree(user, repo) {
	const url = `https://api.github.com/repos/${user}/${repo}/git/trees/HEAD?recursive=1`;
	const res = await fetch(url, {
		headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'reslides-cli' }
	});
	if (res.status === 404) return { error: 'not-found' };
	if (!res.ok) return { error: `github-api-error: ${res.status}` };
	const data = await res.json();
	return { tree: data.tree };
}

async function fetchFileContent(user, repo, path) {
	const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
	const res = await fetch(url, {
		headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'reslides-cli' }
	});
	if (!res.ok) return null;
	const data = await res.json();
	if (data.encoding === 'base64') {
		return Buffer.from(data.content, 'base64').toString('utf-8');
	}
	return data.content;
}

function extractSkillsFromTree(tree) {
	const prefix = '.claude/skills/';
	const skills = new Map();
	for (const item of tree) {
		if (item.path.startsWith(prefix) && item.type === 'blob') {
			const rest = item.path.slice(prefix.length);
			const parts = rest.split('/');
			if (parts.length >= 2) {
				const skillName = parts[0];
				if (!skills.has(skillName)) skills.set(skillName, []);
				skills.get(skillName).push(item.path);
			}
		}
	}
	return skills;
}

// --- Commands ---

async function addSkill(userRepo, { force = false } = {}) {
	const parts = userRepo.split('/');
	if (parts.length !== 2) {
		console.error('Error: Expected format <github-user/repo>');
		process.exit(1);
	}
	const [user, repo] = parts;

	console.log(`Fetching skills from github.com/${user}/${repo}...`);
	const result = await fetchGitHubTree(user, repo);

	if (result.error === 'not-found') {
		console.error(`Error: Repository ${user}/${repo} not found.`);
		process.exit(1);
	}
	if (result.error) {
		console.error(`Error: ${result.error}`);
		process.exit(1);
	}

	const skills = extractSkillsFromTree(result.tree);
	if (skills.size === 0) {
		console.error(`Error: No skills found in ${user}/${repo}. Expected files in .claude/skills/.`);
		process.exit(1);
	}

	await mkdir(SKILLS_DIR, { recursive: true });

	let installed = 0;
	for (const [skillName, files] of skills) {
		const skillDir = join(SKILLS_DIR, skillName);
		const alreadyExists = await dirExists(skillDir);

		if (alreadyExists && !force) {
			const ok = await confirm(`Skill "${skillName}" already exists. Overwrite?`);
			if (!ok) {
				console.log(`  Skipped ${skillName}`);
				continue;
			}
		}

		await mkdir(skillDir, { recursive: true });
		for (const filePath of files) {
			const content = await fetchFileContent(user, repo, filePath);
			if (content === null) {
				console.error(`  Warning: Could not fetch ${filePath}`);
				continue;
			}
			const relativePath = filePath.slice(`.claude/skills/${skillName}/`.length);
			const destPath = join(skillDir, relativePath);
			const destDir = join(destPath, '..');
			await mkdir(destDir, { recursive: true });
			await writeFile(destPath, content, 'utf-8');
		}
		console.log(`  Installed ${skillName}`);
		installed++;
	}

	console.log(`\nDone. ${installed} skill(s) installed.`);
}

async function updateSkill(userRepo) {
	const parts = userRepo.split('/');
	if (parts.length !== 2) {
		console.error('Error: Expected format <github-user/repo>');
		process.exit(1);
	}
	const [user, repo] = parts;

	console.log(`Fetching skills from github.com/${user}/${repo}...`);
	const result = await fetchGitHubTree(user, repo);

	if (result.error === 'not-found') {
		console.error(`Error: Repository ${user}/${repo} not found.`);
		process.exit(1);
	}
	if (result.error) {
		console.error(`Error: ${result.error}`);
		process.exit(1);
	}

	const skills = extractSkillsFromTree(result.tree);
	if (skills.size === 0) {
		console.error(`Error: No skills found in ${user}/${repo}.`);
		process.exit(1);
	}

	// Only update skills that are already installed locally
	let updated = 0;
	for (const [skillName, files] of skills) {
		const skillDir = join(SKILLS_DIR, skillName);
		if (!(await dirExists(skillDir))) continue;

		for (const filePath of files) {
			const content = await fetchFileContent(user, repo, filePath);
			if (content === null) {
				console.error(`  Warning: Could not fetch ${filePath}`);
				continue;
			}
			const relativePath = filePath.slice(`.claude/skills/${skillName}/`.length);
			const destPath = join(skillDir, relativePath);
			const destDir = join(destPath, '..');
			await mkdir(destDir, { recursive: true });
			await writeFile(destPath, content, 'utf-8');
		}
		console.log(`  Updated ${skillName}`);
		updated++;
	}

	if (updated === 0) {
		console.log('No matching skills are installed locally. Use "add-skill" to install first.');
	} else {
		console.log(`\nDone. ${updated} skill(s) updated.`);
	}
}

async function removeSkill(name) {
	if (BUILT_IN_SKILLS.includes(name)) {
		console.error(`Error: Cannot remove the built-in "${name}" skill.`);
		process.exit(1);
	}

	const skillDir = join(SKILLS_DIR, name);
	if (!(await dirExists(skillDir))) {
		console.error(`Error: Skill "${name}" is not installed.`);
		process.exit(1);
	}

	await rm(skillDir, { recursive: true });
	console.log(`Removed skill "${name}".`);
}

async function listSkills() {
	if (!(await dirExists(SKILLS_DIR))) {
		console.log('No skills installed.');
		return;
	}

	const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
	const dirs = entries.filter((e) => e.isDirectory());

	if (dirs.length === 0) {
		console.log('No skills installed.');
		return;
	}

	for (const dir of dirs) {
		const skillFile = join(SKILLS_DIR, dir.name, 'SKILL.md');
		let name = dir.name;
		let description = '';

		if (await exists(skillFile)) {
			const content = await readFile(skillFile, 'utf-8');
			const fm = parseFrontmatter(content);
			if (fm.name) name = fm.name;
			if (fm.description) description = fm.description;
		}

		const label = BUILT_IN_SKILLS.includes(dir.name) ? `${name} (built-in)` : name;
		console.log(`  ${label}${description ? ` — ${description}` : ''}`);
	}
}

function printHelp() {
	console.log(`reslides — CLI for the reslides presentation framework

Usage:
  reslides <command> [args]

Commands:
  add-skill <user/repo>      Install skills from a GitHub repository
  update-skill <user/repo>   Update previously installed skills from GitHub
  remove-skill <name>        Remove an installed skill
  list-skills                List all installed skills

Options:
  --help                     Show this help message`);
}

// --- Main ---

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help') {
	printHelp();
} else if (command === 'add-skill') {
	if (!args[1]) {
		console.error('Error: Missing argument. Usage: reslides add-skill <user/repo>');
		process.exit(1);
	}
	await addSkill(args[1]);
} else if (command === 'update-skill') {
	if (!args[1]) {
		console.error('Error: Missing argument. Usage: reslides update-skill <user/repo>');
		process.exit(1);
	}
	await updateSkill(args[1]);
} else if (command === 'remove-skill') {
	if (!args[1]) {
		console.error('Error: Missing argument. Usage: reslides remove-skill <name>');
		process.exit(1);
	}
	await removeSkill(args[1]);
} else if (command === 'list-skills') {
	await listSkills();
} else {
	console.error(`Unknown command: ${command}`);
	printHelp();
	process.exit(1);
}
