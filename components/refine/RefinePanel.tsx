'use client';

import React, { useState } from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRefine } from '@/hooks/useRefine';
import { TypingIndicator } from '@/components/ui/TypingIndicator';

export function RefinePanel() {
    const [request, setRequest] = useState('');
    const { loading, refineTeam } = useRefine();
    const { refineHistory, generatedAgents } = useAgentSparkStore((state: any) => ({
        refineHistory: state.refineHistory,
        generatedAgents: state.generatedAgents
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!request.trim() || loading) return;
        refineTeam(request);
        setRequest('');
    };

    return (
        <Card className="flex flex-col h-[600px] border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Iterative Refinement</h3>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin">
                {refineHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                        <span className="text-4xl mb-4">✨</span>
                        <p className="text-xs uppercase tracking-widest font-mono">Request changes to roles,<br />skills, or documentation.</p>
                    </div>
                )}

                {refineHistory.map((m: any, i: number) => (
                    <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div className={`
              max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed
              ${m.role === 'user'
                                ? 'bg-accent/10 border border-accent/20 text-text rounded-tr-none'
                                : 'bg-white/5 border border-white/10 text-muted rounded-tl-none'}
            `}>
                            {m.text}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <TypingIndicator statusText="Re-architecting team..." />
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/5">
                <div className="relative group">
                    <input
                        type="text"
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        placeholder="Type your request (e.g. Add a security specialist)..."
                        className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 pr-12 text-xs outline-none focus:border-accent transition-all pl-4"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !request.trim()}
                        className="absolute right-2 top-2 p-1.5 rounded-lg bg-accent text-bg disabled:opacity-30 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {['Add Expert', 'Remove Agent', 'Change Language', 'Deepen Architecture'].map(hint => (
                        <button
                            key={hint}
                            type="button"
                            onClick={() => setRequest(hint)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-mono uppercase tracking-tighter text-muted hover:text-accent hover:border-accent/40 transition-all"
                        >
                            {hint}
                        </button>
                    ))}
                </div>
            </form>
        </Card>
    );
}
