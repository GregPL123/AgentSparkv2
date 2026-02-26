'use client';

import React from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { T } from '@/lib/i18n';

export function TopicSelector({ onStart, loading }: { onStart: () => void; loading: boolean }) {
    const {
        currentTopic, setTopic, currentLevel, setLevel, lang, setLang
    } = useAgentSparkStore((state: any) => ({
        currentTopic: state.currentTopic,
        setTopic: state.setTopic,
        currentLevel: state.currentLevel,
        setLevel: state.setLevel,
        lang: state.lang,
        setLang: state.setLang
    }));

    const t = (T as any)[lang];

    return (
        <div className="max-w-3xl mx-auto space-y-12 animate-fade-in">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-bold tracking-tighter text-gradient pb-2">{t.interview.topicTitle}</h2>
                <p className="text-muted text-lg">Define your project vision and let AgentSpark design your expert team.</p>
            </div>

            <Card className="p-8 space-y-8 glass neo-glow border-accent/20">
                <div className="space-y-3">
                    <label className="text-xs font-mono uppercase tracking-widest text-accent">Project Topic</label>
                    <input
                        type="text"
                        value={currentTopic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={t.interview.topicPlaceholder}
                        className="w-full bg-bg border border-white/10 rounded-xl px-6 py-4 text-xl font-bold focus:border-accent outline-none transition-all placeholder:opacity-30"
                    />
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-mono uppercase tracking-widest text-accent">{t.interview.levelTitle}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['iskra', 'plomien', 'pozar', 'inferno'] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLevel(l)}
                                    className={`
                                        px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all
                                        ${currentLevel === l
                                            ? 'bg-accent text-bg border-accent shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                                            : 'bg-card text-muted border-border hover:border-accent/40'}
                                    `}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-mono uppercase tracking-widest text-accent">Language</label>
                        <div className="flex gap-2">
                            {(['en', 'pl'] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`
                                        flex-grow px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border
                                        ${lang === l
                                            ? 'bg-accent text-bg border-accent'
                                            : 'bg-card text-muted border-border hover:border-accent/40'}
                                    `}
                                >
                                    {l === 'en' ? '🇺🇸 EN' : '🇵🇱 PL'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="w-full h-16 text-lg"
                    disabled={currentTopic.length < 3 || loading}
                    onClick={onStart}
                    loading={loading}
                >
                    {t.interview.start} →
                </Button>
            </Card>
        </div>
    );
}
