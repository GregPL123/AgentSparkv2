// Developer Seed Script (Session C)
// Run with: npx ts-node scripts/seed-data.ts

import { adminDb } from '../lib/firebase/admin';

async function seed() {
    const userId = 'dev-user-001';

    console.log('Seeding initial data for user:', userId);

    const projects = [
        {
            id: 'project-1',
            userId,
            name: 'AgentSpark Core',
            topic: 'Personal AI coding assistant orchestration',
            level: 'pozar',
            agents: [
                { id: 'a1', name: 'Architect', role: 'System Design', type: 'technical', emoji: '🏗️', description: 'Overall system architect.' },
                { id: 'a2', name: 'Coder', role: 'Implementation', type: 'technical', emoji: '💻', description: 'Expert software engineer.' }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    for (const p of projects) {
        await adminDb.collection('projects').doc(p.id).set(p);
    }

    const usage = [
        {
            id: 'usage-1',
            userId,
            timestamp: new Date(),
            model: 'gemini-1.5-flash',
            tokens: 1200,
            cost: 0.005,
            type: 'interview'
        }
    ];

    for (const u of usage) {
        await adminDb.collection('usage').doc(u.id).set(u);
    }

    console.log('Seeding complete!');
}

seed().catch(console.error);
