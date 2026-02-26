export type ModelProvider = 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'groq'

export interface ModelConfig {
    provider: ModelProvider
    model: string
    endpoint: string
    tag: string
    label: string
}

export interface AICallResult {
    text: string
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    model: string
    provider: ModelProvider
    durationMs: number
    isFallback?: boolean
}

export interface AIUsageRecord {
    userId: string
    projectId: string
    model: string
    provider: ModelProvider
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
    operation: 'interview' | 'generate' | 'refine' | 'scoring'
    timestamp: Date
}
