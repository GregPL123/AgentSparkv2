import { Agent } from './agent'

export type ProjectLevel = 'iskra' | 'plomien' | 'pozar' | 'inferno'
export type ProjectLang = 'en' | 'pl'

export interface Project {
    id: string
    userId: string
    name: string
    topic: string
    level: ProjectLevel
    lang: ProjectLang
    modelProvider: string
    modelId: string
    agents: Agent[]
    files: Record<string, string>       // filename → markdown content
    versionHistory: ProjectVersion[]
    createdAt: Date
    updatedAt: Date
}

export interface ProjectVersion {
    id: number
    label: string
    ts: Date
    agents: Agent[]
    files: Record<string, string>
    diff: {
        added: string[]
        removed: string[]
        changed: string[]
    }
    vNum: number
    isOrigin?: boolean
}

export interface RefineHistoryEntry {
    role: 'user' | 'ai'
    text: string
}
