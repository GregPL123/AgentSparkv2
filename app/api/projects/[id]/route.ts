import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthToken } from '@/lib/firebase/admin';
import { logger } from '@/server/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await verifyAuthToken(req);
        const doc = await adminDb.collection('projects').doc(params.id).get();

        if (!doc.exists || doc.data()?.userId !== user.uid) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        logger.error({ event: 'get_project_detail_error', error, id: params.id });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await verifyAuthToken(req);
        const body = await req.json();

        const docRef = adminDb.collection('projects').doc(params.id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== user.uid) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const updateData = {
            ...body,
            updatedAt: new Date(),
        };

        await docRef.update(updateData);
        return NextResponse.json({ id: params.id, ...updateData });
    } catch (error) {
        logger.error({ event: 'update_project_error', error, id: params.id });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await verifyAuthToken(req);
        const docRef = adminDb.collection('projects').doc(params.id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== user.uid) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await docRef.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ event: 'delete_project_error', error, id: params.id });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
