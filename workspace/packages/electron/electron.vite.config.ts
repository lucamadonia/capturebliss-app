import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      lib: {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          preload: path.resolve(__dirname, 'src/preload/preload.ts'),
          'capture-preload': path.resolve(__dirname, 'src/capture-preload/capture-preload.ts'),
        },
      },
    },
  },
  renderer: {
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/renderer/index.html'),
      },
    },
    server: {
      port: 5173,
    },
  },
});
