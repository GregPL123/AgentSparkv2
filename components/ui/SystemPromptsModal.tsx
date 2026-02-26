'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface SystemPromptsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SystemPromptsModal({ isOpen, onClose }: SystemPromptsModalProps) {
    const [activeTab, setActiveTab] = useState<'interview' | 'generate' | 'refine' | 'scoring'>('interview');

    // These would ideally be fetched from the API or shared via a constant
    const prompts = {
        interview: 'You are an Expert AI Architect... (Interview Prompt)',
        generate: 'You are an Expert AI Architect... (Generation Prompt)',
        refine: 'You are an Expert AI Architect... (Refine Prompt)',
        scoring: 'You are an Expert AI Architect... (Scoring Prompt)',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI System Instructions">
            <div className="flex flex-col h-full">
                <div className="flex gap-4 border-b border-white/5 mb-6">
                    {(['interview', 'generate', 'refine', 'scoring'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-2 px-1 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <p className="text-xs text-muted">
                        Internal instructions sent to the model to regulate behavior and output format.
                    </p>
                    <div className="relative group">
                        <textarea
                            readOnly
                            value={prompts[activeTab]}
                            className="w-full h-80 bg-bg/50 border border-white/5 rounded-xl p-6 text-[11px] font-mono text-muted resize-none outline-none focus:border-accent/40"
                        />
                        <button
                            onClick={() => navigator.clipboard.writeText(prompts[activeTab])}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                            title="Copy prompt"
                        >
                            📋
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            const element = document.createElement('a');
                            const file = new Blob([prompts[activeTab]], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = `system-prompt-${activeTab}.txt`;
                            document.body.appendChild(element);
                            element.click();
                        }}
                    >
                        📥 Download .txt
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}
