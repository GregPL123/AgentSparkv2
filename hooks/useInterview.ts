'use client';

import { useState, useCallback } from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { apiFetch } from '@/lib/api-client';
import { scoreProject } from '@/lib/scoring';

export function useInterview() {
    const [loading, setLoading] = useState(false);
    const {
        currentTopic, currentLevel, lang, chatHistory, modelTag,
        addChatMessage, addTraceSpan, updateTraceSpan, setScreen,
        currentProjectId, setGeneratedTeam, setScoringData
    } = useAgentSparkStore((state: any) => ({
        currentTopic: state.currentTopic,
        currentLevel: state.currentLevel,
        lang: state.lang,
        chatHistory: state.chatHistory,
        modelTag: state.selectedModel.tag,
        addChatMessage: state.addChatMessage,
        addTraceSpan: state.addTraceSpan,
        updateTraceSpan: state.updateTraceSpan,
        setScreen: state.setScreen,
        currentProjectId: state.currentProjectId,
        setGeneratedTeam: state.setGeneratedTeam,
        setScoringData: state.setScoringData
    }));

    const startInterview = useCallback(async () => {
        setLoading(true);
        const spanId = Date.now();
        addTraceSpan({
            id: spanId,
            label: 'Interview · Start',
            model: modelTag,
            startMs: spanId,
            status: 'pending'
        });

        try {
            const result = await apiFetch('/api/ai/interview', {
                method: 'POST',
                body: JSON.stringify({
                    topic: currentTopic,
                    level: currentLevel,
                    lang,
                    chatHistory: [],
                    userAnswer: 'START',
                    modelTag
                })
            });

            addChatMessage('ai', result.reply);
            updateTraceSpan(spanId, {
                status: 'ok',
                endMs: Date.now(),
                durationMs: Date.now() - spanId,
                tokens: result.tokens
            });
        } catch (err: any) {
            updateTraceSpan(spanId, { status: 'error', error: err.message });
        } finally {
            setLoading(false);
        }
    }, [currentTopic, currentLevel, lang, modelTag, addChatMessage, addTraceSpan, updateTraceSpan]);

    const sendAnswer = useCallback(async (answer: string) => {
        setLoading(true);
        addChatMessage('user', answer);
        const spanId = Date.now();
        addTraceSpan({
            id: spanId,
            label: 'Interview · Step',
            model: modelTag,
            startMs: spanId,
            status: 'pending'
        });

        try {
            const result = await apiFetch('/api/ai/interview', {
                method: 'POST',
                body: JSON.stringify({
                    topic: currentTopic,
                    level: currentLevel,
                    lang,
                    chatHistory: [...chatHistory, { role: 'user', text: answer }],
                    userAnswer: answer,
                    modelTag
                })
            });

            addChatMessage('ai', result.reply);
            updateTraceSpan(spanId, {
                status: 'ok',
                endMs: Date.now(),
                durationMs: Date.now() - spanId,
                tokens: result.tokens
            });

            if (result.isComplete) {
                await triggerGenerate();
            }
        } catch (err: any) {
            updateTraceSpan(spanId, { status: 'error', error: err.message });
        } finally {
            setLoading(false);
        }
    }, [currentTopic, currentLevel, lang, chatHistory, modelTag, addChatMessage, addTraceSpan, updateTraceSpan]);

    const triggerGenerate = async () => {
        const spanId = Date.now();
        addTraceSpan({
            id: spanId,
            label: 'System · Generate Team',
            model: modelTag,
            startMs: spanId,
            status: 'pending'
        });

        try {
            // Parallel generate and scoring via allSettled
            const [genRes, scoreRes] = await Promise.allSettled([
                apiFetch('/api/ai/generate', {
                    method: 'POST',
                    body: JSON.stringify({ topic: currentTopic, level: currentLevel, lang, chatHistory, modelTag })
                }),
                apiFetch('/api/ai/scoring', {
                    method: 'POST',
                    body: JSON.stringify({ topic: currentTopic, agents: [], level: currentLevel }) // Agents populated server-side or after gen
                })
            ]);

            if (genRes.status === 'fulfilled') {
                const data = genRes.value;
                setGeneratedTeam(data.agents, data.files);

                // Handle scoring fallback
                if (scoreRes.status === 'fulfilled') {
                    setScoringData(scoreRes.value);
                } else {
                    // Fallback to pure heuristic function
                    const fallbackScore = scoreProject({
                        topic: currentTopic,
                        level: currentLevel as any,
                        agents: data.agents
                    } as any);
                    setScoringData(fallbackScore);
                }

                setScreen('results');
                updateTraceSpan(spanId, {
                    status: 'ok',
                    endMs: Date.now(),
                    durationMs: Date.now() - spanId,
                    tokens: data.tokens
                });
            } else {
                throw new Error(genRes.reason.message);
            }
        } catch (err: any) {
            updateTraceSpan(spanId, { status: 'error', error: err.message });
        }
    };

    return { loading, startInterview, sendAnswer };
}
