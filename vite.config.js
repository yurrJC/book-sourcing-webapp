var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// https://vite.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // Load environment variables based on mode
    var env = loadEnv(mode, process.cwd(), '');
    var enablePwa = env.VITE_ENABLE_PWA === 'true';
    return {
        plugins: __spreadArray([
            react()
        ], (enablePwa
            ? [
                VitePWA({
                    registerType: 'autoUpdate',
                    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'vite.svg'],
                    manifest: {
                        name: 'Book Sourcing Web App',
                        short_name: 'Book Sourcer',
                        description: 'A web app for sourcing and evaluating books for resale',
                        theme_color: '#3498db',
                        icons: [
                            {
                                src: '/images/scanwise-logo.png',
                                sizes: '512x512',
                                type: 'image/png',
                                purpose: 'any maskable'
                            }
                        ]
                    },
                    workbox: {
                        runtimeCaching: [
                            {
                                urlPattern: /^https:\/\/api\..*\.*/i,
                                handler: 'NetworkFirst',
                                options: {
                                    cacheName: 'api-cache',
                                    expiration: {
                                        maxEntries: 100,
                                        maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                                    }
                                }
                            }
                        ]
                    }
                })
            ]
            : []), true),
        server: {
            proxy: {
                // Proxy API requests to the backend server in development
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3001',
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    };
});
