import { describe, it, expect } from 'vitest';
import { computeAgentDiff } from '@/lib/diff';
import { Agent } from '@/types/agent';

describe('computeAgentDiff', () => {
    const agentA: Agent = { id: '1', name: 'A', role: 'R1', emoji: '🍎', type: 'technical', description: '', agentMd: '', skillMd: '' };
    const agentB: Agent = { id: '2', name: 'B', role: 'R2', emoji: '🍌', type: 'business', description: '', agentMd: '', skillMd: '' };

    it('should detect added agents', () => {
        const diff = computeAgentDiff([], [agentA]);
        expect(diff.added).toHaveLength(1);
        expect(diff.added[0].id).toBe('1');
    });

    it('should detect removed agents', () => {
        const diff = computeAgentDiff([agentA], []);
        expect(diff.removed).toHaveLength(1);
        expect(diff.removed[0].id).toBe('1');
    });

    it('should detect changed agents', () => {
        const agentA2 = { ...agentA, role: 'New Role' };
        const diff = computeAgentDiff([agentA], [agentA2]);
        expect(diff.changed).toHaveLength(1);
        expect(diff.changed[0].after.role).toBe('New Role');
    });
});
