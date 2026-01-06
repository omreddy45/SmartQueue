import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for the geminiService if needed, though VITE_ prefix is preferred
    'process.env': {}
  }
});