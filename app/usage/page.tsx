'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function UsagePage() {
    const stats = [
        { label: 'Total Credits Used', val: '$12.45', trend: '+12%', color: 'text-accent' },
        { label: 'AI Operations', val: '142', trend: '+5%', color: 'text-success' },
        { label: 'Avg. Tokens/Req', val: '2.4k', trend: '-2%', color: 'text-warning' },
    ];

    const usageByModel = [
        { name: 'Gemini 3 Flash', count: 85, cost: 2.10, percentage: 65, color: 'bg-accent' },
        { name: 'GPT-4o', count: 12, cost: 8.40, percentage: 20, color: 'bg-danger' },
        { name: 'Claude 3.5 Sonnet', count: 45, cost: 1.95, percentage: 15, color: 'bg-warning' },
    ];

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">AI Usage Dashboard</h2>
                <p className="text-muted text-sm mt-1">Real-time cost tracking and token observability.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map(s => (
                    <Card key={s.label} className="glass border-border/40">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">{s.label}</p>
                        <div className="flex items-end justify-between">
                            <span className={`text-4xl font-bold tracking-tighter ${s.color}`}>{s.val}</span>
                            <span className="text-[10px] font-bold text-success mb-1">{s.trend} ↑</span>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-12">
                    <Card className="glass">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-accent mb-8">Model Cost Distribution</h3>

                        <div className="space-y-8">
                            {usageByModel.map(m => (
                                <div key={m.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-sm">{m.name}</p>
                                            <p className="text-[10px] text-muted">{m.count} calls</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-sm text-text">${m.cost.toFixed(2)}</p>
                                            <p className="text-[10px] text-muted font-mono">{m.percentage}% of total</p>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-border rounded-full overflow-hidden">
                                        <div className={`h-full ${m.color} neo-glow`} style={{ width: `${m.percentage}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-border/40 text-center">
                            <p className="text-[10px] text-muted font-mono uppercase tracking-widest">
                                Usage estimates updated every 5 minutes.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
