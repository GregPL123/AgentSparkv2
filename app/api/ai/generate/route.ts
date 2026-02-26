import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/server/ai-service';
import { getGenerationSystemPrompt } from '@/lib/ai/prompts';
import { GenerateRequestSchema } from '@/lib/validators';
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
        const result = GenerateRequestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { topic, level, lang, chatHistory, modelTag, projectId } = result.data;
        const historyText = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

        const systemPrompt = getGenerationSystemPrompt({
            topic, level, lang,
            maxQuestions: 0, // not used for generation prompt logic here
            agentCount: level === 'iskra' ? '3' : '5+',
            focus: level
        });

        const aiRes = await aiService.callWithFallback({
            systemPrompt,
            userMessage: `Interview history:\n${historyText}\n\nGenerate the final team JSON now.`,
            modelTag,
            userId: user.uid,
            projectId,
            operation: 'generate',
        });

        // Try to parse JSON from AI response if it's wrapped in markdown
        let jsonText = aiRes.text;
        if (jsonText.includes('```json')) {
            jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
            jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }

        try {
            const teamData = JSON.parse(jsonText);
            return NextResponse.json({ ...aiRes, team: teamData });
        } catch (e) {
            logger.error({ event: 'generate_json_parse_error', text: aiRes.text });
            return NextResponse.json({ ...aiRes, error: 'Failed to parse AI response as JSON' });
        }
    } catch (error: any) {
        logger.error({ event: 'generate_api_error', error: error.message || error });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
