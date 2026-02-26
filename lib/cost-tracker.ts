import { AIUsageRecord } from '@/types/ai';

// Szacunkowe ceny per 1M tokenów (input/output)
const COST_TABLE: Record<string, { input: number; output: number }> = {
    'gemini-3-flash-preview': { input: 0.075, output: 0.30 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
    'claude-haiku-4-5-20251001': { input: 0.25, output: 1.25 },
    'mistral-large-latest': { input: 2.00, output: 6.00 },
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
    '_default': { input: 1.00, output: 3.00 },
}

export function estimateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    const rates = COST_TABLE[model] || COST_TABLE['_default'];
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;
    return inputCost + outputCost;
}

export async function recordUsage(
    db: any, // Firebase Admin Firestore
    record: AIUsageRecord
): Promise<void> {
    try {
        await db.collection('ai_usage').add({
            ...record,
            timestamp: record.timestamp || new Date(),
        });
    } catch (error) {
        console.error('Error recording AI usage:', error);
    }
}
