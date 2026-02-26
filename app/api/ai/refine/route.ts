import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/server/ai-service';
import { getRefineSystemPrompt } from '@/lib/ai/prompts';
import { RefineRequestSchema } from '@/lib/validators';
import { verifyAuthToken } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/server/rate-limit';
import { logger } from '@/server/logger';

const aiService = new AIService();

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuthToken(req);

        const rateLimit = await checkRateLimit(user.uid);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
        }

        const body = await req.json();
        const result = RefineRequestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { topic, level, lang, currentAgents, request, modelTag, projectId } = result.data;

        const systemPrompt = getRefineSystemPrompt({ topic, level, lang, currentAgents });

        const aiRes = await aiService.callWithFallback({
            systemPrompt,
            userMessage: request,
            modelTag,
            userId: user.uid,
            projectId,
            operation: 'refine',
        });

        // Split response into summary and JSON
        const parts = aiRes.text.split('[UPDATED_TEAM]');
        const summary = parts[0].trim();
        let jsonText = parts[1] || '';

        if (jsonText.includes('```json')) {
            jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        }

        try {
            const updatedAgents = JSON.parse(jsonText);
            return NextResponse.json({ ...aiRes, summary, agents: updatedAgents });
        } catch (e) {
            return NextResponse.json({ ...aiRes, summary, error: 'Failed to parse updated team JSON' });
        }
    } catch (error: any) {
        logger.error({ event: 'refine_api_error', error: error.message || error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
