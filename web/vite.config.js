import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const extPackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../chrome-extension/package.json'), 'utf-8'));

export default defineConfig({
    define: {
        '__EXTENSION_VERSION__': JSON.stringify(extPackageJson.version),
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
});
