export type AgentType = 'technical' | 'business'

export interface Agent {
    id: string           // slug, np. "auth-manager"
    name: string
    emoji: string
    type: AgentType
    role: string         // ROLE_LABEL np. "AUTH_SPECIALIST"
    description: string
    agentMd: string      // Pełny markdown pliku agenta
    skillMd: string      // Pełny markdown pliku skill
}

export interface AgentDiff {
    added: Agent[]
    removed: Agent[]
    changed: {
        id: string
        before: Agent
        after: Agent
    }[]
}

export interface GeneratedTeam {
    agents: Agent[]
    teamConfig: string   // Markdown konfiguracji zespołu
}
