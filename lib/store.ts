import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Agent } from '@/types/agent'
import { ProjectLevel, ProjectLang, ProjectVersion } from '@/types/project'
import { ScoreResult } from '@/types/scoring'

type Screen = 'topic' | 'chat' | 'results' | 'dashboard'

interface SelectedModel {
    provider: string
    model: string
    tag: string
    label: string
}

export interface TraceSpan {
    id: number
    label: string
    model: string
    provider: string
    startMs: number
    endMs: number | null
    durationMs: number | null
    status: 'pending' | 'ok' | 'fallback' | 'error'
    isFallback: boolean
    tokens: number | null
    error: string | null
}

const LEVEL_QUESTIONS: Record<ProjectLevel, number> = {
    iskra: 4, plomien: 5, pozar: 6, inferno: 7
}

interface AgentSparkStore {
    screen: Screen
    setScreen: (s: Screen) => void

    currentProjectId: string | null
    currentTopic: string
    currentLevel: ProjectLevel
    lang: ProjectLang
    setTopic: (t: string) => void
    setLevel: (l: ProjectLevel) => void
    setLang: (l: ProjectLang) => void

    selectedModel: SelectedModel
    setSelectedModel: (m: SelectedModel) => void

    chatHistory: { role: 'user' | 'ai'; text: string }[]
    questionCount: number
    maxQuestions: number
    isInterviewing: boolean
    addChatMessage: (role: 'user' | 'ai', text: string) => void
    resetChat: () => void

    generatedAgents: Agent[]
    generatedFiles: Record<string, string>
    setGeneratedTeam: (agents: Agent[], files: Record<string, string>) => void

    versionHistory: ProjectVersion[]
    addVersion: (v: ProjectVersion) => void
    restoreVersion: (v: ProjectVersion) => void

    refineHistory: { role: 'user' | 'ai'; text: string }[]
    isRefining: boolean
    selectedRefineAction: string | null
    addRefineMessage: (role: 'user' | 'ai', text: string) => void
    setRefineAction: (a: string | null) => void

    scoringData: ScoreResult | null
    setScoringData: (d: ScoreResult | null) => void

    traceSpans: TraceSpan[]
    traceSessionStart: number | null
    addTraceSpan: (s: TraceSpan) => void
    updateTraceSpan: (id: number, update: Partial<TraceSpan>) => void
    resetTrace: () => void

    notif: { text: string; isError: boolean } | null
    showNotif: (text: string, isError?: boolean) => void
    clearNotif: () => void

    resetAll: () => void
}

export const useAgentSparkStore = create<AgentSparkStore>()(
    devtools((set) => ({
        screen: 'topic',
        setScreen: (s) => set({ screen: s }),

        currentProjectId: null,
        currentTopic: '',
        currentLevel: 'iskra',
        lang: 'en',
        setTopic: (t) => set({ currentTopic: t }),
        setLevel: (l) => set({ currentLevel: l, maxQuestions: LEVEL_QUESTIONS[l] }),
        setLang: (l) => set({ lang: l }),

        selectedModel: {
            provider: 'gemini',
            model: 'gemini-3-flash-preview',
            tag: 'gemini',
            label: 'Gemini 3 Flash Preview',
        },
        setSelectedModel: (m) => set({ selectedModel: m }),

        chatHistory: [],
        questionCount: 0,
        maxQuestions: 4,
        isInterviewing: false,
        addChatMessage: (role, text) => set((state) => ({
            chatHistory: [...state.chatHistory, { role, text }],
            questionCount: role === 'ai' ? state.questionCount + 1 : state.questionCount
        })),
        resetChat: () => set({ chatHistory: [], questionCount: 0 }),

        generatedAgents: [],
        generatedFiles: {},
        setGeneratedTeam: (agents, files) => set({ generatedAgents: agents, generatedFiles: files }),

        versionHistory: [],
        addVersion: (v) => set((state) => {
            const history = [v, ...state.versionHistory].slice(0, 20);
            return { versionHistory: history };
        }),
        restoreVersion: (v) => set({
            generatedAgents: v.agents,
            generatedFiles: v.files
        }),

        refineHistory: [],
        isRefining: false,
        selectedRefineAction: null,
        addRefineMessage: (role, text) => set((state) => ({
            refineHistory: [...state.refineHistory, { role, text }]
        })),
        setRefineAction: (a) => set({ selectedRefineAction: a }),

        scoringData: null,
        setScoringData: (d) => set({ scoringData: d }),

        traceSpans: [],
        traceSessionStart: null,
        addTraceSpan: (s) => set((state) => ({
            traceSpans: [...state.traceSpans, s],
            traceSessionStart: state.traceSessionStart || Date.now()
        })),
        updateTraceSpan: (id, update) => set((state) => ({
            traceSpans: state.traceSpans.map(s => s.id === id ? { ...s, ...update } : s)
        })),
        resetTrace: () => set({ traceSpans: [], traceSessionStart: null }),

        notif: null,
        showNotif: (text, isError = false) => {
            set({ notif: { text, isError } });
            setTimeout(() => set({ notif: null }), 3000);
        },
        clearNotif: () => set({ notif: null }),

        resetAll: () => set({
            chatHistory: [],
            generatedAgents: [],
            generatedFiles: {},
            versionHistory: [],
            refineHistory: [],
            traceSpans: [],
            scoringData: null,
            questionCount: 0,
            currentProjectId: null,
            screen: 'topic'
        })
    }))
)
