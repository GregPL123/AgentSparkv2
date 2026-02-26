'use client';

import React from 'react';
import { useAgentSparkStore } from '@/lib/store';

export const Notification = () => {
    const notif = useAgentSparkStore((state) => state.notif);
    const clearNotif = useAgentSparkStore((state) => state.clearNotif);

    if (!notif) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
            <div
                className={`
          flex items-center gap-3 px-6 py-3 rounded-xl glass shadow-2xl
          ${notif.isError ? 'border-danger/50 text-danger' : 'border-success/50 text-success'}
        `}
            >
                <div className={`w-2 h-2 rounded-full ${notif.isError ? 'bg-danger animate-pulse' : 'bg-success animate-pulse'}`} />
                <span className="text-sm font-bold text-text">{notif.text}</span>
                <button
                    onClick={clearNotif}
                    className="ml-2 hover:opacity-70 transition-opacity"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
