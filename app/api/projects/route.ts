import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthToken } from '@/lib/firebase/admin';
import { logger } from '@/server/logger';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuthToken(req);
        const snapshot = await adminDb.collection('projects')
            .where('userId', '==', user.uid)
            .orderBy('updatedAt', 'desc')
            .get();

        const projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(projects);
    } catch (error) {
        logger.error({ event: 'get_projects_error', error });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuthToken(req);
        const body = await req.json();

        const newProject = {
            ...body,
            userId: user.uid,
            versionHistory: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await adminDb.collection('projects').add(newProject);
        return NextResponse.json({ id: docRef.id, ...newProject });
    } catch (error) {
        logger.error({ event: 'create_project_error', error });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
