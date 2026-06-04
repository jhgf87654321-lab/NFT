import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const buildId =
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      process.env.VERCEL_GIT_COMMIT_REF?.slice(0, 7) ||
      'dev';
    return {
      server: {
        // 与 `npm run dev:api`（Vercel，监听 3000）错开；前端走本端口，/api 由 proxy 转发
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:3000',
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwindcss()],
      define: {
        __APP_BUILD_ID__: JSON.stringify(buildId),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@nftt/lib': path.resolve(__dirname, 'lib'),
        }
      }
    };
});
