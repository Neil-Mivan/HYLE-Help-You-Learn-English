import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    fs: { allow: ['.', fileURLToPath(new URL('../styles.css', import.meta.url))] },
    proxy: { '/api': 'http://127.0.0.1:4173' },
  },
})
