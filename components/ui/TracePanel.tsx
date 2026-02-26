'use client';

import React, { useMemo } from 'react';
import { useAgentSparkStore, TraceSpan } from '@/lib/store';
import { Card } from './Card';

export function TracePanel() {
    const { traceSpans, isTraceOpen, setTraceOpen } = useAgentSparkStore((state: any) => ({
        traceSpans: state.traceSpans,
        isTraceOpen: state.isTraceOpen,
        setTraceOpen: state.setTraceOpen
    }));

    const stats = useMemo(() => {
        const ok = traceSpans.filter((s: any) => s.status === 'ok');
        return {
            totalCalls: traceSpans.length,
            totalTokens: ok.reduce((acc: number, s: any) => acc + (s.tokens || 0), 0),
            avgDuration: ok.length ? ok.reduce((acc: number, s: any) => acc + (s.durationMs || 0), 0) / ok.length : 0,
        };
    }, [traceSpans]);

    if (!isTraceOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-4xl h-[80vh] flex flex-col glass neo-glow border-accent/20">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <span className="text-accent">⚡</span> Workspace Trace Tracing
                        </h2>
                        <p className="text-[10px] text-muted font-mono uppercase tracking-widest mt-1">
                            Live Observation · {stats.totalCalls} Calls · {stats.totalTokens} Tokens
                        </p>
                    </div>
                    <button
                        onClick={() => setTraceOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-muted hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-muted uppercase tracking-widest pb-2 border-b border-white/5">
                        <div className="col-span-4">Operation</div>
                        <div className="col-span-4">Timeline</div>
                        <div className="col-span-2 text-right">Duration</div>
                        <div className="col-span-1 text-right">Tokens</div>
                        <div className="col-span-1 text-center">Stat</div>
                    </div>

                    {traceSpans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted opacity-50">
                            <span className="text-4xl mb-4">🔍</span>
                            <p className="text-sm">No activity recorded for this session yet.</p>
                        </div>
                    ) : (
                        traceSpans.map((span: TraceSpan) => {
                            const startOffset = Math.max(0, span.startMs - (traceSpans[0]?.startMs || 0));
                            const totalDuration = Date.now() - (traceSpans[0]?.startMs || 0);
                            const leftPos = (startOffset / totalDuration) * 100;
                            const widthPos = span.durationMs ? (span.durationMs / totalDuration) * 100 : 2;

                            return (
                                <div key={span.id} className="grid grid-cols-12 gap-2 text-xs items-center group">
                                    <div className="col-span-4 font-mono truncate text-muted group-hover:text-text transition-colors">
                                        {span.label}
                                        <div className="text-[9px] opacity-40">{span.model || 'system'}</div>
                                    </div>
                                    <div className="col-span-4 relative h-4 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`absolute h-full rounded-full transition-all ${span.status === 'pending' ? 'bg-accent/40 animate-pulse' :
                                                    span.status === 'ok' ? 'bg-accent shadow-[0_0_10px_rgba(0,229,255,0.4)]' :
                                                        'bg-danger shadow-[0_0_10px_rgba(255,107,53,0.4)]'
                                                }`}
                                            style={{ left: `${leftPos}%`, width: `${Math.max(2, widthPos)}%` }}
                                        />
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-muted">
                                        {span.durationMs ? `${span.durationMs}ms` : '...'}
                                    </div>
                                    <div className="col-span-1 text-right font-mono text-muted">
                                        {span.tokens || '-'}
                                    </div>
                                    <div className="col-span-1 text-center font-mono">
                                        <span className={
                                            span.status === 'ok' ? 'text-accent' :
                                                span.status === 'error' ? 'text-danger' :
                                                    'text-muted'
                                        }>
                                            {span.status === 'ok' ? '✓' : span.status === 'error' ? '✕' : '●'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5 text-[10px] font-mono text-muted flex justify-between">
                    <span>Avg. Latency: {stats.avgDuration.toFixed(0)}ms</span>
                    <span>Build: v1.0.4-production</span>
                </div>
            </Card>
        </div>
    );
}
