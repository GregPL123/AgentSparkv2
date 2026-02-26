import { NextResponse } from 'next/server';
import { adminDb, verifyAuthToken } from '@/lib/firebase/admin';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyAuthToken(token);
        if (!decodedToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = decodedToken.uid;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const snapshot = await adminDb.collection('ai_usage')
            .where('userId', '==', userId)
            .where('timestamp', '>=', thirtyDaysAgo)
            .orderBy('timestamp', 'desc')
            .get();

        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
        }));

        // Aggregate summary
        const summary = records.reduce((acc, r) => {
            acc.totalCost += r.cost || 0;
            acc.totalTokens += r.tokens || 0;
            acc.totalCalls += 1;

            const model = r.model || 'unknown';
            acc.byModel[model] = (acc.byModel[model] || 0) + (r.cost || 0);

            const op = r.type || 'unknown';
            acc.byOperation[op] = (acc.byOperation[op] || 0) + 1;

            return acc;
        }, {
            totalCost: 0,
            totalTokens: 0,
            totalCalls: 0,
            byModel: {} as Record<string, number>,
            byOperation: {} as Record<string, number>
        });

        return NextResponse.json({ records, summary });

    } catch (error: any) {
        console.error('Usage API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
