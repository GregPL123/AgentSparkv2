import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/server/ai-service';
import { getInterviewSystemPrompt } from '@/lib/ai/prompts';
import { InterviewRequestSchema } from '@/lib/validators';
import { verifyAuthToken } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/server/rate-limit';
import { logger } from '@/server/logger';

const aiService = new AIService();

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuthToken(req);

        // Rate limit check
        const rateLimit = await checkRateLimit(user.uid);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
        }

        const body = await req.json();
        const result = InterviewRequestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { topic, level, lang, chatHistory, userAnswer, modelTag, projectId } = result.data;

        // Max questions mapping
        const maxQs = level === 'iskra' ? 4 : level === 'plomien' ? 5 : level === 'pozar' ? 6 : 7;
        const focus = level === 'iskra' ? 'simple features' : level === 'plomien' ? 'balanced' : level === 'pozar' ? 'technical' : 'enterprise';

        const systemPrompt = getInterviewSystemPrompt({
            topic, level, lang,
            maxQuestions: maxQs,
            agentCount: level === 'iskra' ? '3' : '5+',
            focus
        });

        const aiRes = await aiService.callWithFallback({
            systemPrompt,
            userMessage: userAnswer,
            modelTag,
            userId: user.uid,
            projectId,
            operation: 'interview',
        });

        return NextResponse.json(aiRes);
    } catch (error: any) {
        logger.error({ event: 'interview_api_error', error: error.message || error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
