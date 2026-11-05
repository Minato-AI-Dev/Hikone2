import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves the independent repository under /Hikone2/.
  // Vercel builds only the backend; the public React app remains on Pages.
  base: '/Hikone2/',
  plugins: [react()],
});
