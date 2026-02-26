'use client';

import React from 'react';

interface TypingIndicatorProps {
    statusText?: string;
}

export function TypingIndicator({ statusText }: TypingIndicatorProps) {
    return (
        <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {statusText && (
                <p className="text-[10px] font-mono text-muted uppercase tracking-widest pl-1">
                    {statusText}
                </p>
            )}
        </div>
    );
}
