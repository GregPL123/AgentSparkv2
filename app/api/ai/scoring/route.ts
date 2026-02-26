import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/server/ai-service';
import { getScoringPrompt } from '@/lib/ai/prompts';
import { verifyAuthToken } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/server/rate-limit';
import { scoreProject } from '@/lib/scoring';
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
        const { topic, level, lang, interviewHistory, projectId, modelTag } = body;

        // Default to heuristic if no AI history
        if (!interviewHistory) {
            // Logic for heuristic scoring if needed, but here we expect the full context
        }

        const systemPrompt = getScoringPrompt({ topic, level, lang, interviewHistory });

        const aiRes = await aiService.callWithFallback({
            systemPrompt,
            userMessage: 'Analyze and provide scoring JSON.',
            modelTag,
            userId: user.uid,
            projectId,
            operation: 'scoring',
        });

        let jsonText = aiRes.text;
        if (jsonText.includes('```json')) {
            jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        }

        try {
            const scoring = JSON.parse(jsonText);
            return NextResponse.json({ ...aiRes, scoring });
        } catch (e) {
            return NextResponse.json({ ...aiRes, error: 'Failed to parse scoring JSON' });
        }
    } catch (error: any) {
        logger.error({ event: 'scoring_api_error', error: error.message || error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
