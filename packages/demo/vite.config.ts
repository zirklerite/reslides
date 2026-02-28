import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { reslidesEditor } from 'reslides/editor';

export default defineConfig({
	plugins: [svelte(), reslidesEditor()],
});
