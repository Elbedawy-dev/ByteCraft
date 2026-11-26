import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = process.env.VITE_DEV_API_TARGET || env.VITE_DEV_API_TARGET || 'http://localhost:5000';

  const proxyConfig = {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
    },
    '/uploads': {
      target: apiTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: proxyConfig,
    },
    preview: {
      port: 4173,
      proxy: proxyConfig,
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              id.includes('recharts') ||
              id.includes('d3-') ||
              id.includes('victory-vendor') ||
              id.includes('internmap')
            ) {
              return 'vendor-recharts';
            }
            if (
              id.includes('framer-motion') ||
              id.includes('motion-dom') ||
              id.includes('motion-utils')
            ) {
              return 'vendor-motion';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            if (
              id.includes('react-hook-form') ||
              id.includes('@hookform/resolvers') ||
              /[\\/]node_modules[\\/]zod[\\/]/.test(id)
            ) {
              return 'vendor-forms';
            }
            if (id.includes('@floating-ui')) {
              return 'vendor-floating';
            }
            if (id.includes('@fontsource')) {
              return 'vendor-fonts';
            }
            if (
              /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|@remix-run|scheduler)[\\/]/.test(
                id
              )
            ) {
              return 'vendor-react';
            }
            return undefined;
          },
        },
      },
    },
  };
});
