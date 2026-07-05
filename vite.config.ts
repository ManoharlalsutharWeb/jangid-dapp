import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'wagmi-vendor': ['wagmi', 'viem', '@tanstack/react-query'],
          'rainbowkit-vendor': ['@rainbow-me/rainbowkit'],
          'ethers-vendor': ['ethers'],
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
});
