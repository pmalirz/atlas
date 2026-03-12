/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: "::",
        port: 8081,
        proxy: {
            '/api': {
                target: process.env.API_BASE_URL || 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: "::",
        port: 4173,
        proxy: {
            '/api': {
                target: process.env.API_BASE_URL || 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Split vendor libraries into separate chunks
                    if (id.includes('react') && id.includes('node_modules')) {
                        if (id.includes('react-dom') || id.includes('react-router-dom')) {
                            return 'react-vendor';
                        }
                        return 'react-core';
                    }

                    // All @radix-ui packages
                    if (id.includes('@radix-ui/')) {
                        return 'ui-vendor';
                    }

                    // Other specific vendors
                    if (id.includes('@tanstack/react-query')) return 'query-vendor';
                    if (id.includes('@hookform/resolvers') || id.includes('react-hook-form')) return 'form-vendor';
                    if (id.includes('lucide-react')) return 'icons-vendor';
                    if (id.includes('date-fns') || id.includes('react-day-picker')) return 'date-vendor';
                    if (id.includes('next-themes')) return 'theme-vendor';
                    if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('tailwindcss-animate')) return 'utils-vendor';
                    if (id.includes('sonner')) return 'notification-vendor';
                },
            },
        },
        chunkSizeWarningLimit: 1000, // Increase limit to reduce warnings
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'lcov'],
            reportsDirectory: '../coverage/ui' // different from server to avoid clashes
        }
    }
});
