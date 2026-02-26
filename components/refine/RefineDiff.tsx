'use client';

import React from 'react';
import { AgentDiff } from '@/types/agent';

interface RefineDiffProps {
    diffs: AgentDiff; // Changed from AgentDiff[] to AgentDiff
}

export function RefineDiff({ diffs }: RefineDiffProps) {
    const hasChanges = diffs.added.length > 0 || diffs.removed.length > 0 || diffs.changed.length > 0;

    if (!hasChanges) return null;

    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted px-1">Architectural Changes</h3>
            <div className="space-y-2">
                {diffs.added.map(agent => (
                    <div key={agent.id} className="p-3 rounded-xl border bg-success/5 border-success/20 text-success flex items-center gap-3">
                        <span className="text-lg">⊕</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{agent.name}</p>
                            <p className="text-[9px] uppercase tracking-widest opacity-70">Added · {agent.role}</p>
                        </div>
                    </div>
                ))}

                {diffs.changed.map(change => (
                    <div key={change.id} className="p-3 rounded-xl border bg-accent/5 border-accent/20 text-accent flex items-center gap-3">
                        <span className="text-lg">±</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{change.after.name}</p>
                            <p className="text-[9px] uppercase tracking-widest opacity-70">Modified · {change.after.role}</p>
                        </div>
                    </div>
                ))}

                {diffs.removed.map(agent => (
                    <div key={agent.id} className="p-3 rounded-xl border bg-danger/5 border-danger/20 text-danger flex items-center gap-3">
                        <span className="text-lg">⊖</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{agent.name}</p>
                            <p className="text-[9px] uppercase tracking-widest opacity-70">Removed · {agent.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
