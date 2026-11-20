import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [svelte()],
    // Par défaut Vite vise Chrome 111. Si le plus vieux téléphone est plus ancien
    // (voir chrome://version), baisser ici, par ex. build: { target: 'chrome87' }.
    server: {
      // Même chemin qu'en prod (nginx) : /db → CouchDB
      proxy: {
        '/db': {
          target: env.COUCHDB_URL || 'http://localhost:5984',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/db/, ''),
        },
      },
    },
  }
})
