import { AICallResult, ModelConfig, AIUsageRecord, ModelProvider } from '@/types/ai';
import { getFallbackChain, isFallbackable } from '@/lib/ai/provider';
import { estimateCost, recordUsage } from '@/lib/cost-tracker';
import { logger } from '@/server/logger';
import { adminDb } from '@/lib/firebase/admin';

export interface InterviewParams {
    topic: string;
    level: string;
    lang: string;
    chatHistory: { role: 'user' | 'ai', text: string }[];
    modelTag: string;
    userId: string;
    projectId: string;
}

export class AIService {
    async callWithFallback(params: {
        systemPrompt: string;
        userMessage: string;
        modelTag: string;
        userId: string;
        projectId: string;
        operation: AIUsageRecord['operation'];
        maxRetries?: number;
    }): Promise<AICallResult> {
        const { systemPrompt, userMessage, modelTag, userId, projectId, operation, maxRetries = 2 } = params;
        const chain = getFallbackChain(modelTag);

        let lastError: any = null;

        for (const config of chain) {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const startTime = Date.now();
                    const result = await this.callSingleModel(config, systemPrompt, userMessage);
                    const durationMs = Date.now() - startTime;

                    const finalResult = { ...result, durationMs };

                    // Record usage and log
                    const cost = estimateCost(result.model, result.inputTokens || 0, result.outputTokens || 0);
                    await recordUsage(adminDb, {
                        userId,
                        projectId,
                        model: result.model,
                        provider: result.provider,
                        inputTokens: result.inputTokens || 0,
                        outputTokens: result.outputTokens || 0,
                        estimatedCostUsd: cost,
                        operation,
                        timestamp: new Date(),
                    });

                    logger.info({
                        event: 'ai_call',
                        userId,
                        projectId,
                        model: result.model,
                        operation,
                        durationMs,
                        tokens: (result.inputTokens || 0) + (result.outputTokens || 0),
                        costUsd: cost,
                    });

                    return finalResult;
                } catch (error: any) {
                    lastError = error;
                    const status = error.status || 500;
                    const message = error.message || 'Unknown error';

                    logger.warn({
                        event: 'ai_error_attempt',
                        model: config.model,
                        attempt,
                        status,
                        message,
                    });

                    if (!isFallbackable(status, message)) {
                        throw error; // Don't retry for fatal errors (e.g., 401, 400 validation)
                    }

                    if (attempt === maxRetries) {
                        logger.warn(`Max retries reached for ${config.model}, moving to next in chain.`);
                    }
                }
            }
        }

        throw lastError || new Error(`All models failed for tag ${modelTag}`);
    }

    private async callSingleModel(config: ModelConfig, systemPrompt: string, userMessage: string): Promise<AICallResult> {
        switch (config.provider) {
            case 'gemini':
                return this.callGemini(config, systemPrompt, userMessage);
            case 'openai':
            case 'mistral':
            case 'groq':
                return this.callOpenAICompatible(config, systemPrompt, userMessage);
            case 'anthropic':
                return this.callAnthropic(config, systemPrompt, userMessage);
            default:
                throw new Error(`Unsupported provider: ${config.provider}`);
        }
    }

    private async callGemini(config: ModelConfig, system: string, user: string): Promise<AICallResult> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY missing');

        const url = config.endpoint.replace('{model}', config.model) + `?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: system }] },
                contents: [{ role: 'user', parts: [{ text: user }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw { status: response.status, message: JSON.stringify(err) };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            text,
            inputTokens: data.usageMetadata?.promptTokenCount || 0,
            outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata?.totalTokenCount || 0,
            model: config.model,
            provider: config.provider,
            durationMs: 0, // set by caller
        };
    }

    private async callOpenAICompatible(config: ModelConfig, system: string, user: string): Promise<AICallResult> {
        const envKey = `${config.provider.toUpperCase()}_API_KEY`;
        const apiKey = process.env[envKey];
        if (!apiKey) throw new Error(`${envKey} missing`);

        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw { status: response.status, message: JSON.stringify(err) };
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        return {
            text,
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
            model: config.model,
            provider: config.provider,
            durationMs: 0,
        };
    }

    private async callAnthropic(config: ModelConfig, system: string, user: string): Promise<AICallResult> {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');

        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: config.model,
                system,
                messages: [{ role: 'user', content: user }],
                max_tokens: 4096,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw { status: response.status, message: JSON.stringify(err) };
        }

        const data = await response.json();
        const text = data.content?.[0]?.text || '';

        return {
            text,
            inputTokens: data.usage?.input_tokens || 0,
            outputTokens: data.usage?.output_tokens || 0,
            totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            model: config.model,
            provider: config.provider,
            durationMs: 0,
        };
    }
}
