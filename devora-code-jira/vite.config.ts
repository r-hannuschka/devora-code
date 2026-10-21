import { defineConfig } from 'vite';
import { resolve } from 'path';
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/main.ts'),
      name: '@devora-code-jira',
      formats: ['cjs'],
      fileName: () => 'devora-code-jira.js',
    },
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      external: ['vscode', 'fs', 'path', 'crypto'],
      output: {
        preserveModules: false,
      },
    },
  },
  plugins: [commonjs()],
  resolve: {
    alias: {
      '@core': resolve(import.meta.dirname, 'src/core'),
      '@module': resolve(import.meta.dirname, 'src/module')
    },
    extensions: ['.ts', '.js'],
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  optimizeDeps: {
    exclude: ['vscode'],
  },
});
