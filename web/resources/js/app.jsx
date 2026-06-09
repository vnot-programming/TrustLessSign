import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

import CursorGlow from './Components/CursorGlow';
import BackgroundEffects from './Components/BackgroundEffects';

createInertiaApp({
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <BackgroundEffects />
                <App {...props} />
                <CursorGlow />
            </>
        );
    },
});
