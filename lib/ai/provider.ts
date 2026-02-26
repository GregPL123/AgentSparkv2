import { ModelConfig, ModelProvider } from '@/types/ai';

export const MODEL_CONFIGS: Record<string, ModelConfig[]> = {
    gemini: [
        {
            provider: 'gemini', tag: 'gemini', model: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
        },
        {
            provider: 'gemini', tag: 'gemini', model: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
        },
        {
            provider: 'gemini', tag: 'gemini', model: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
        },
    ],
    openai: [
        {
            provider: 'openai', tag: 'openai', model: 'gpt-4o', label: 'GPT-4o',
            endpoint: 'https://api.openai.com/v1/chat/completions'
        },
        {
            provider: 'openai', tag: 'openai', model: 'gpt-4o-mini', label: 'GPT-4o mini',
            endpoint: 'https://api.openai.com/v1/chat/completions'
        },
    ],
    anthropic: [
        {
            provider: 'anthropic', tag: 'anthropic', model: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet',
            endpoint: 'https://api.anthropic.com/v1/messages'
        },
        {
            provider: 'anthropic', tag: 'anthropic', model: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku',
            endpoint: 'https://api.anthropic.com/v1/messages'
        },
    ],
    mistral: [
        {
            provider: 'mistral', tag: 'mistral', model: 'mistral-large-latest', label: 'Mistral Large',
            endpoint: 'https://api.mistral.ai/v1/chat/completions'
        },
    ],
    groq: [
        {
            provider: 'groq', tag: 'groq', model: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions'
        },
    ],
};

export function isFallbackable(status: number, message: string): boolean {
    // Retry for specific HTTP statuses
    const fallbackStatuses = [429, 500, 502, 503, 504, 529];
    if (fallbackStatuses.includes(status)) return true;

    // Retry for common error messages
    const errorPatterns = [
        'rate limit', 'overloaded', 'capacity', 'timeout',
        'quota', 'unavailable', 'too many requests'
    ];
    const msg = message.toLowerCase();
    return errorPatterns.some(pattern => msg.includes(pattern));
}

export function getFallbackChain(tag: string): ModelConfig[] {
    return MODEL_CONFIGS[tag] || [];
}
