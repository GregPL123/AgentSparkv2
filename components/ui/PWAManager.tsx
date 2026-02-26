'use client';

import React, { useEffect, useState } from 'react';
import { useAgentSparkStore } from '@/lib/store';

export const PWAManager = () => {
    const [isOffline, setIsOffline] = useState(false);
    const showNotif = useAgentSparkStore((state) => state.showNotif);

    useEffect(() => {
        // 1. Service Worker Registration
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('SW registered:', registration);
                    },
                    (err) => {
                        console.log('SW registration failed:', err);
                    }
                );
            });
        }

        // 2. Offline Detection
        const handleOnline = () => {
            setIsOffline(false);
            showNotif('Back online!', false);
        };
        const handleOffline = () => {
            setIsOffline(true);
            showNotif('You are offline. Some features may be unavailable.', true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [showNotif]);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-64 right-0 z-[100] animate-fade-in">
            <div className="bg-warning text-bg text-[10px] font-bold uppercase tracking-widest py-1 px-4 flex items-center justify-center gap-2">
                <span>⚠️ Offline Mode Active</span>
            </div>
        </div>
    );
};
