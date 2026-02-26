'use client';

import React from 'react';

interface OptionButtonProps {
    id: string; // A, B, C, D
    label: string;
    impact: string;
    onClick: () => void;
    disabled?: boolean;
}

export const OptionButton = ({ id, label, impact, onClick, disabled }: OptionButtonProps) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        group relative w-full text-left p-4 rounded-xl glass border border-border
        transition-all duration-300 hover:border-accent hover:bg-accent-dim/20
        active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
        animate-slide-up
      `}
        >
            <div className="flex items-start gap-4">
                <div className={`
          flex-shrink-0 w-8 h-8 rounded-lg bg-card border border-border
          flex items-center justify-center font-mono font-bold text-sm
          group-hover:border-accent group-hover:text-accent transition-colors
        `}>
                    {id}
                </div>

                <div className="flex-grow">
                    <div className="text-sm font-bold text-text mb-1 group-hover:text-accent transition-colors">
                        {label}
                    </div>
                    <div className="text-[11px] text-muted leading-tight font-mono uppercase tracking-wider">
                        <span className="text-accent opacity-70">Impact:</span> {impact}
                    </div>
                </div>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
};
