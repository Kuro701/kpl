import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  // Served from a sub-path of kurolabs.net, not the root of its own domain.
  // Anything pointing at public/ must go through src/lib/asset.ts — Vite cannot
  // rewrite a path that has been baked into a string.
  base: '/games/mytheder/',
  plugins: [svelte()],
})
