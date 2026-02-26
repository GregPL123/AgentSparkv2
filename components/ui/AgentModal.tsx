'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Agent } from '@/types/agent';
import ReactMarkdown from 'react-markdown';
import { Button } from './Button';

interface AgentModalProps {
    agent: Agent | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AgentModal({ agent, isOpen, onClose }: AgentModalProps) {
    const [activeTab, setActiveTab] = useState<'agent' | 'skill'>('agent');

    if (!agent) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${agent.name} Specification`}>
            <div className="flex flex-col h-full">
                <div className="flex gap-4 border-b border-white/5 mb-6">
                    <button
                        onClick={() => setActiveTab('agent')}
                        className={`pb-2 px-1 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'agent' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-white'
                            }`}
                    >
                        Agent Definition
                    </button>
                    <button
                        onClick={() => setActiveTab('skill')}
                        className={`pb-2 px-1 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'skill' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-white'
                            }`}
                    >
                        Skill Specification
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 max-h-[60vh]">
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-accent prose-strong:text-text prose-code:text-accent">
                        <ReactMarkdown>
                            {activeTab === 'agent' ? agent.agentMd : agent.skillMd}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            const element = document.createElement('a');
                            const file = new Blob([activeTab === 'agent' ? agent.agentMd : agent.skillMd], { type: 'text/markdown' });
                            element.href = URL.createObjectURL(file);
                            element.download = `${agent.name}-${activeTab}.md`;
                            document.body.appendChild(element);
                            element.click();
                        }}
                    >
                        📥 Download .md
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}
