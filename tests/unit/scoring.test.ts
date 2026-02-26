import { describe, it, expect } from 'vitest';
import { scoreProject } from '@/lib/scoring';

describe('scoreProject', () => {
    it('should calculate accurate score for basic project', () => {
        const project = {
            topic: 'Simple Blog',
            level: 'iskra',
            agents: [
                { id: '1', name: 'Author' },
                { id: '2', name: 'Editor' }
            ]
        };

        // @ts-ignore
        const result = scoreProject(project);
        expect(result.score).toBeGreaterThan(0);
        expect(result.metrics.length).toBeGreaterThan(0);
    });

    it('should increase complexity for higher levels', () => {
        const agents = [{ id: '1', name: 'A' }];

        // @ts-ignore
        const lowRes = scoreProject({ topic: 'T', level: 'iskra', agents });
        // @ts-ignore
        const highRes = scoreProject({ topic: 'T', level: 'inferno', agents });

        expect(highRes.score).toBeGreaterThan(lowRes.score);
    });
});
