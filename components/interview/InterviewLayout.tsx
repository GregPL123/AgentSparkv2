'use client';

import React from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { ChatMessages } from '@/components/ai/ChatMessages';
import { OptionButton } from '@/components/ai/OptionButton';
import { TypingIndicator } from '@/components/ui/TypingIndicator';

interface InterviewLayoutProps {
    loading: boolean;
    onSubmit: (answer: string) => void;
}

export function InterviewLayout({ loading, onSubmit }: InterviewLayoutProps) {
    const {
        currentTopic, currentLevel, chatHistory, questionCount, maxQuestions
    } = useAgentSparkStore((state: any) => ({
        currentTopic: state.currentTopic,
        currentLevel: state.currentLevel,
        chatHistory: state.chatHistory,
        questionCount: state.questionCount,
        maxQuestions: state.maxQuestions
    }));

    const lastAiMsg = chatHistory.filter((m: any) => m.role === 'ai').slice(-1)[0]?.text || '';
    const options = lastAiMsg.split('\n').filter((line: string) => /^[A-D]\)/.test(line));

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-6 animate-fade-in">
            {/* Header Info */}
            <div className="flex items-center justify-between glass px-6 py-4 rounded-2xl border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <h3 className="font-bold text-sm truncate max-w-[300px]">{currentTopic}</h3>
                </div>
                <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted">
                    <span>Level: <span className="text-accent">{currentLevel}</span></span>
                    <div className="flex items-center gap-2">
                        <span>Progress:</span>
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent transition-all duration-500"
                                style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
                            />
                        </div>
                        <span className="text-text">{questionCount}/{maxQuestions}</span>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-grow glass rounded-3xl p-6 overflow-hidden flex flex-col border-white/5">
                <div className="flex-grow overflow-y-auto mb-6 pr-2 scrollbar-thin">
                    <ChatMessages messages={chatHistory} />
                    {loading && (
                        <div className="mt-4">
                            <TypingIndicator statusText="Analyzing requirements..." />
                        </div>
                    )}
                </div>

                {/* Action Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-up">
                    {options.map((opt: string) => {
                        const [labelPart, impactPart] = opt.split('| IMPACT:');
                        const id = opt[0];
                        const label = labelPart.replace(/^[A-D]\)/, '').trim();
                        const impact = impactPart?.trim() || 'Determining strategic project direction.';

                        return (
                            <OptionButton
                                key={id}
                                id={id}
                                label={label}
                                impact={impact}
                                onClick={() => onSubmit(`${id}) ${label}`)}
                                disabled={loading}
                            />
                        );
                    })}
                </div>

                {options.length === 0 && !loading && (
                    <div className="bg-accent-dim/10 border border-accent/20 rounded-xl p-6 text-center animate-pulse">
                        <p className="text-accent font-bold text-sm font-mono uppercase tracking-widest">
                            Synthesizing Expert Architecture...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
