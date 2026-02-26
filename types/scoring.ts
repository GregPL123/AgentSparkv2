import { ProjectLevel } from './project'

export interface ScoreMetric {
    label: string
    value: number        // 0-100
    color: string
}

export interface ScoreResult {
    overallScore: number
    overallLabel: string
    metrics: ScoreMetric[]
    risks: string[]
    levelMatch: 'ok' | 'upgrade' | 'downgrade'
    levelSuggestion: string
    suggestedLevel: ProjectLevel
}
