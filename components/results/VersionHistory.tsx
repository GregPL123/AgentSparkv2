'use client';

import React from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';

export function VersionHistory({ onRestore }: { onRestore: (version: any) => void }) {
    const versions = useAgentSparkStore((state: any) => state.versionHistory);

    if (versions.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted px-1">Iteration History</h3>
            <div className="space-y-2">
                {versions.map((v: any, i: number) => (
                    <button
                        key={v.id}
                        onClick={() => onRestore(v)}
                        className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-accent">v{versions.length - i}</span>
                            <span className="text-[9px] font-mono text-muted">{new Date(v.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-medium text-text truncate group-hover:text-accent transition-colors">
                            {v.name}
                        </p>
                        <p className="text-[9px] text-muted uppercase tracking-tighter mt-1">
                            {v.agents.length} Experts · {Object.keys(v.files).length} Files
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
