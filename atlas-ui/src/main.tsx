import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AtlasThemeProvider } from '@/themes';
import { Toaster } from '@/components/ui/sonner';
import App from './App';
import './index.css';
import '@fontsource/tektur';

// Register default components
import { registerDefaultComponents } from '@/engine/registry/register-defaults';
registerDefaultComponents();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        },
    },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AtlasThemeProvider defaultThemeId="violet-dream">
                <App />
                <Toaster position="top-right" />
            </AtlasThemeProvider>
        </QueryClientProvider>
    </StrictMode>
);

