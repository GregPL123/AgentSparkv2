'use client';

import React, { useState, useEffect, use } from 'react';
import { useAgentSparkStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { AgentCard } from '@/components/ai/AgentCard';
import { AgentGraph } from '@/components/ai/AgentGraph';
import { ScoringPanel } from '@/components/results/ScoringPanel';
import { VersionHistory } from '@/components/results/VersionHistory';
import { RefinePanel } from '@/components/refine/RefinePanel';
import { RefineDiff } from '@/components/refine/RefineDiff';
import { AgentModal } from '@/components/ui/AgentModal';
import { ShareModal } from '@/components/ui/ShareModal';
import { MarkdownPreviewModal } from '@/components/ui/MarkdownPreviewModal';
import { FrameworkExportModal } from '@/components/ui/FrameworkExportModal';
import { SystemPromptsModal } from '@/components/ui/SystemPromptsModal';
import { useZipExport } from '@/hooks/useZipExport';
import { useFirestoreProject } from '@/hooks/useFirestoreProject';
import { Agent } from '@/types/agent';
import { computeAgentDiff } from '@/lib/diff';

export default function ProjectPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const id = params.id;

    const { loadProject, loading: projectLoading } = useFirestoreProject();
    const { exportZip, loading: zipLoading } = useZipExport();

    const {
        currentTopic, currentLevel, generatedAgents, generatedFiles,
        setGeneratedTeam, setTraceOpen
    } = useAgentSparkStore((state: any) => ({
        currentTopic: state.currentTopic,
        currentLevel: state.currentLevel,
        generatedAgents: state.generatedAgents,
        generatedFiles: state.generatedFiles,
        setGeneratedTeam: state.setGeneratedTeam,
        setTraceOpen: state.setTraceOpen
    }));

    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [modalOpen, setModalOpen] = useState<'agent' | 'share' | 'preview' | 'framework' | 'prompts' | null>(null);

    const [prevAgents, setPrevAgents] = useState<Agent[]>([]);
    const diffs = computeAgentDiff(prevAgents, generatedAgents);

    useEffect(() => {
        if (id && id !== 'new') {
            loadProject(id);
        }
    }, [id, loadProject]);

    const handleDownload = async () => {
        await exportZip(currentTopic, generatedAgents, generatedFiles);
    };

    if (projectLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-muted font-mono text-xs uppercase tracking-widest animate-pulse">
                    Loading project data...
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] font-mono text-accent uppercase tracking-widest">
                            {currentLevel}
                        </span>
                        <h1 className="text-3xl font-bold tracking-tight text-white">{currentTopic}</h1>
                    </div>
                    <p className="text-muted text-sm max-w-2xl">
                        Multi-expert team designed for scalable architecture and autonomous operations.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={() => setModalOpen('share')}>Share</Button>
                    <Button variant="secondary" onClick={() => setModalOpen('preview')}>Docs</Button>
                    <Button variant="secondary" onClick={() => setModalOpen('framework')}>Code</Button>
                    <Button onClick={handleDownload} loading={zipLoading}>Export ZIP</Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Agent Graph Visualization */}
                    <div className="relative group">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <button
                                onClick={() => setTraceOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-bg/80 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-muted hover:text-accent transition-colors backdrop-blur-md"
                            >
                                View Trace ⚡
                            </button>
                        </div>
                        <AgentGraph agents={generatedAgents} />
                    </div>

                    {/* Agent Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedAgents.map((agent: Agent) => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                onClick={() => {
                                    setSelectedAgent(agent);
                                    setModalOpen('agent');
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <ScoringPanel />
                    <RefineDiff diffs={diffs} />
                    <RefinePanel />
                    <VersionHistory onRestore={(v) => {
                        setPrevAgents(generatedAgents);
                        setGeneratedTeam(v.agents, v.files);
                    }} />

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <button
                            onClick={() => setModalOpen('prompts')}
                            className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono uppercase tracking-widest text-muted hover:text-white transition-colors flex justify-between items-center group"
                        >
                            <span>View System Prompts</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AgentModal
                agent={selectedAgent}
                isOpen={modalOpen === 'agent'}
                onClose={() => setModalOpen(null)}
            />
            <ShareModal
                isOpen={modalOpen === 'share'}
                onClose={() => setModalOpen(null)}
                data={{ topic: currentTopic, level: currentLevel, agents: generatedAgents, files: generatedFiles }}
            />
            <MarkdownPreviewModal
                isOpen={modalOpen === 'preview'}
                onClose={() => setModalOpen(null)}
                files={generatedFiles}
            />
            <FrameworkExportModal
                isOpen={modalOpen === 'framework'}
                onClose={() => setModalOpen(null)}
                topic={currentTopic}
                agents={generatedAgents}
            />
            <SystemPromptsModal
                isOpen={modalOpen === 'prompts'}
                onClose={() => setModalOpen(null)}
            />
        </div>
    );
}
