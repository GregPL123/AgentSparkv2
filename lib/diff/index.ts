import { Agent, AgentDiff } from '@/types/agent';

export function computeAgentDiff(before: Agent[], after: Agent[]): AgentDiff {
    const added: Agent[] = [];
    const removed: Agent[] = [];
    const changed: { id: string; before: Agent; after: Agent }[] = [];

    const beforeMap = new Map(before.map(a => [a.id, a]));
    const afterMap = new Map(after.map(a => [a.id, a]));

    // Find added and changed
    for (const [id, agentAfter] of afterMap) {
        const agentBefore = beforeMap.get(id);
        if (!agentBefore) {
            added.push(agentAfter);
        } else {
            const isDifferent =
                agentBefore.name !== agentAfter.name ||
                agentBefore.type !== agentAfter.type ||
                agentBefore.role !== agentAfter.role ||
                agentBefore.description !== agentAfter.description ||
                agentBefore.agentMd !== agentAfter.agentMd ||
                agentBefore.skillMd !== agentAfter.skillMd;

            if (isDifferent) {
                changed.push({ id, before: agentBefore, after: agentAfter });
            }
        }
    }

    // Find removed
    for (const [id, agentBefore] of beforeMap) {
        if (!afterMap.has(id)) {
            removed.push(agentBefore);
        }
    }

    return { added, removed, changed };
}
