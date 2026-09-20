import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20 * 1024,
          maxSize: 450 * 1024,
          groups: [
            {
              name: (moduleId) => {
                const normalizedId = moduleId.replaceAll('\\', '/');
                if (/node_modules\/(?:react|react-dom|react-router|react-router-dom|scheduler)\//.test(normalizedId)) {
                  return 'vendor-react';
                }
                if (/node_modules\/(?:antd|@ant-design|@rc-component|rc-[^/]+)\//.test(normalizedId)) {
                  return 'vendor-antd';
                }
                if (/node_modules\/(?:recharts|d3-[^/]+|victory-vendor)\//.test(normalizedId)) {
                  return 'vendor-charts';
                }
                return 'vendor-common';
              },
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
