import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: [{ find: /^@\//, replacement: `${projectRoot}/` }] },
  server: {
    port: 3000,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3333' },
  },
  build: { outDir: 'dist', sourcemap: false },
});
