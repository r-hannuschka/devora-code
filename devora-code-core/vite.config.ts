import { defineConfig } from 'vite';
import { resolve } from 'path';
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/main.ts'),
      name: '@devora-code',
      formats: ['cjs'],
      fileName: () => 'devora-code.js',
    },
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: false,
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
      '@/core': resolve(import.meta.dirname, 'src/core'),
      '@/domain': resolve(import.meta.dirname, 'src/domain'),
      '@/infrastructure': resolve(import.meta.dirname, 'src/infrastructure'),
      '@/util': resolve(import.meta.dirname, 'src/util'),
      "@/test/support": resolve(import.meta.dirname, 'tests/support')
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
