import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
    const checks: Record<string, 'ok' | 'error'> = {};

    try {
        await adminDb.collection('_health').doc('ping').set({ ts: Date.now() });
        checks.firestore = 'ok';
    } catch {
        checks.firestore = 'error';
    }

    checks.gemini_key = process.env.GEMINI_API_KEY ? 'ok' : 'error';
    checks.openai_key = process.env.OPENAI_API_KEY ? 'ok' : 'error';
    checks.anthropic_key = process.env.ANTHROPIC_API_KEY ? 'ok' : 'error';
    checks.mistral_key = process.env.MISTRAL_API_KEY ? 'ok' : 'error';
    checks.groq_key = process.env.GROQ_API_KEY ? 'ok' : 'error';

    const allOk = Object.values(checks).every(v => v === 'ok');

    return NextResponse.json(
        { status: allOk ? 'ok' : 'degraded', checks, ts: new Date().toISOString() },
        { status: allOk ? 200 : 207 }
    );
}
