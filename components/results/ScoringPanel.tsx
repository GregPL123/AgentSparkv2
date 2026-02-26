'use client';

import React from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';

export function ScoringPanel() {
    const scoringData = useAgentSparkStore((state: any) => state.scoringData);

    if (!scoringData) return null;

    const { score, metrics, analysis } = scoringData;

    const getScoreColor = (s: number) => {
        if (s > 80) return 'text-danger';
        if (s > 50) return 'text-accent';
        return 'text-success';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Architectural Score</h3>
                <span className={`text-2xl font-bold font-mono ${getScoreColor(score)}`}>{score}</span>
            </div>

            <div className="space-y-3">
                {metrics.map((m: any) => (
                    <div key={m.label} className="space-y-1">
                        <div className="flex justify-between text-[10px] items-center">
                            <span className="text-muted uppercase tracking-tighter">{m.label}</span>
                            <span className="font-mono text-text">{m.value}/100</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${getScoreColor(m.value).replace('text-', 'bg-')}`}
                                style={{ width: `${m.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                <p className="text-[11px] leading-relaxed text-muted italic">
                    "{analysis}"
                </p>
            </div>
        </div>
    );
}
