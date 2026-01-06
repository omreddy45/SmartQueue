import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Property 'cwd' does not exist on type 'Process'. Casting process to any to access cwd().
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY is replaced with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});