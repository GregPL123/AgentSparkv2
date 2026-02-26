'use client';

import { useState, useCallback } from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { apiFetch } from '@/lib/api-client';

export function useRefine() {
    const [loading, setLoading] = useState(false);
    const {
        currentTopic, currentLevel, lang, modelTag, currentProjectId,
        generatedAgents, addRefineMessage, setGeneratedTeam, addTraceSpan, updateTraceSpan, addVersion
    } = useAgentSparkStore((state: any) => ({
        currentTopic: state.currentTopic,
        currentLevel: state.currentLevel,
        lang: state.lang,
        modelTag: state.selectedModel.tag,
        currentProjectId: state.currentProjectId,
        generatedAgents: state.generatedAgents,
        addRefineMessage: state.addRefineMessage,
        setGeneratedTeam: state.setGeneratedTeam,
        addTraceSpan: state.addTraceSpan,
        updateTraceSpan: state.updateTraceSpan,
        addVersion: state.addVersion
    }));

    const refineTeam = useCallback(async (request: string, action: string | null = null) => {
        if (loading || !request.trim()) return;
        setLoading(true);
        addRefineMessage('user', request);

        const spanId = Date.now();
        addTraceSpan({
            id: spanId,
            label: 'System · Refine Team',
            model: modelTag,
            startMs: spanId,
            status: 'pending'
        });

        try {
            const result = await apiFetch('/api/ai/refine', {
                method: 'POST',
                body: JSON.stringify({
                    topic: currentTopic,
                    level: currentLevel,
                    lang,
                    currentAgents: generatedAgents,
                    request,
                    action,
                    modelTag
                })
            });

            addRefineMessage('ai', result.summary);
            setGeneratedTeam(result.agents, result.files);

            // Store version history
            addVersion({
                id: Date.now().toString(),
                name: `Refinement: ${request.slice(0, 20)}...`,
                agents: result.agents,
                files: result.files,
                timestamp: new Date()
            });

            updateTraceSpan(spanId, {
                status: 'ok',
                endMs: Date.now(),
                durationMs: Date.now() - spanId,
                tokens: result.tokens
            });
        } catch (err: any) {
            updateTraceSpan(spanId, { status: 'error', error: err.message });
            addRefineMessage('ai', `Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [currentTopic, currentLevel, lang, generatedAgents, modelTag, addRefineMessage, setGeneratedTeam, addTraceSpan, updateTraceSpan, addVersion, loading]);

    return { loading, refineTeam };
}
