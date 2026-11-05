import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Vercel serves the independent app at /; Pages builds, if manually enabled, use /Hikone2/.
  // Vercel builds only the backend; the public React app remains on Pages.
  base: process.env.VERCEL === '1' ? '/' : '/Hikone2/',
  plugins: [react()],
});
