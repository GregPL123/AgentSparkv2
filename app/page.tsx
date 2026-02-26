'use client';

import React from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { TopicSelector } from '@/components/interview/TopicSelector';
import { InterviewLayout } from '@/components/interview/InterviewLayout';
import { useInterview } from '@/hooks/useInterview';

export default function WizardPage() {
    const { screen, setScreen } = useAgentSparkStore();
    const { loading, startInterview, sendAnswer } = useInterview();

    if (screen === 'topic') {
        return (
            <TopicSelector
                loading={loading}
                onStart={() => {
                    setScreen('chat');
                    startInterview();
                }}
            />
        );
    }

    if (screen === 'chat') {
        return (
            <InterviewLayout
                loading={loading}
                onSubmit={sendAnswer}
            />
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted font-mono text-xs uppercase tracking-widest animate-pulse">
                Finalizing expert team...
            </p>
        </div>
    );
}
