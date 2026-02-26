import { z } from 'zod';

export const ProjectLevelSchema = z.enum(['iskra', 'plomien', 'pozar', 'inferno']);
export const ProjectLangSchema = z.enum(['en', 'pl']);

export const InterviewRequestSchema = z.object({
    projectId: z.string(),
    topic: z.string().min(3),
    level: ProjectLevelSchema,
    lang: ProjectLangSchema,
    modelTag: z.string(),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'ai']),
        text: z.string(),
    })),
    userAnswer: z.string(),
});

export const GenerateRequestSchema = z.object({
    projectId: z.string(),
    topic: z.string(),
    level: ProjectLevelSchema,
    lang: ProjectLangSchema,
    modelTag: z.string(),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'ai']),
        text: z.string(),
    })),
});

export const RefineRequestSchema = z.object({
    projectId: z.string(),
    topic: z.string(),
    level: ProjectLevelSchema,
    lang: ProjectLangSchema,
    modelTag: z.string(),
    currentAgents: z.array(z.any()), // Agent type is complex, using any for now or refining later
    refineHistory: z.array(z.object({
        role: z.enum(['user', 'ai']),
        text: z.string(),
    })),
    request: z.string(),
    action: z.string().optional(),
});
