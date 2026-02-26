import { Project } from '@/types/project';
import { ScoreResult } from '@/types/scoring';

/**
 * Pure function — zero dependencies on UI, zero side effects
 * Calculates heuristic scoring if AI scoring is not available.
 */
export function scoreProject(project: Project): ScoreResult {
    // Heuristic calculation
    const agentCount = project.agents.length;
    const levelWeights = { iskra: 1, plomien: 1.5, pozar: 2, inferno: 2.5 };
    const levelWeight = levelWeights[project.level] || 1;

    const technicalScore = Math.min(100, (agentCount * 15 * levelWeight));
    const businessScore = Math.min(100, (agentCount * 12 * levelWeight));

    const overallScore = Math.round((technicalScore + businessScore) / 2);

    return {
        overallScore,
        overallLabel: overallScore > 75 ? 'Enterprise Complexity' : overallScore > 40 ? 'Medium Complexity' : 'Small Scale',
        metrics: [
            { label: 'Technical Complexity', value: technicalScore, color: '#7c3aff' },
            { label: 'Business Complexity', value: businessScore, color: '#ff6b35' },
            { label: 'Integration Needs', value: Math.min(100, agentCount * 10), color: '#00e5ff' },
            { label: 'Scalability Demand', value: Math.min(100, levelWeight * 30), color: '#00ff88' }
        ],
        risks: agentCount > 5 ? ['High coordination overhead', 'Architecture complexity'] : ['No significant risks identified'],
        levelMatch: 'ok',
        levelSuggestion: 'Current level matches project complexity',
        suggestedLevel: project.level
    };
}
