import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Force a single React instance
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
        force: true,
    },
    server: {
        port: 5173,
        open: true, // automatically opens the browser
    },
});