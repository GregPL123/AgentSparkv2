'use client';

import { useState, useCallback } from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { apiFetch } from '@/lib/api-client';

export function useFirestoreProject() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setGeneratedTeam, setCurrentProject } = useAgentSparkStore((state: any) => ({
        setGeneratedTeam: state.setGeneratedTeam,
        setCurrentProject: state.setCurrentProject
    }));

    const saveProject = useCallback(async (topic: string, agents: any[], files: any) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFetch('/api/projects', {
                method: 'POST',
                body: JSON.stringify({ topic, agents, files })
            });
            setCurrentProject(result.id);
            return result.id;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setCurrentProject]);

    const loadProject = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFetch(`/api/projects/${id}`);
            setGeneratedTeam(result.agents, result.files);
            setCurrentProject(id);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setGeneratedTeam, setCurrentProject]);

    const deleteProject = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, saveProject, loadProject, deleteProject };
}
