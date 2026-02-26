'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FRAMEWORKS } from '@/lib/frameworks/index';

interface FrameworkExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    topic: string;
    agents: any[];
}

export function FrameworkExportModal({ isOpen, onClose, topic, agents }: FrameworkExportModalProps) {
    const [activeTab, setActiveTab] = useState(FRAMEWORKS[0].id);

    const selectedFramework = FRAMEWORKS.find(f => f.id === activeTab);
    const code = selectedFramework?.generate(topic, agents) || '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export AI Framework Code">
            <div className="flex flex-col h-full">
                <div className="flex gap-4 border-b border-white/5 mb-6 overflow-x-auto pb-1">
                    {FRAMEWORKS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveTab(f.id)}
                            className={`pb-2 px-1 text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-colors ${activeTab === f.id ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-muted">
                                {selectedFramework?.pip}
                            </span>
                        </div>
                        <a
                            href={selectedFramework?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-accent hover:underline font-mono uppercase"
                        >
                            Documentation ↗
                        </a>
                    </div>

                    <div className="relative group">
                        <pre className="p-6 rounded-xl bg-bg/50 border border-white/5 text-[11px] font-mono text-muted overflow-auto max-h-[50vh] scrollbar-thin">
                            <code>{code}</code>
                        </pre>
                        <button
                            onClick={() => navigator.clipboard.writeText(code)}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                            title="Copy code"
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
                            const file = new Blob([code], { type: 'text/x-python' });
                            element.href = URL.createObjectURL(file);
                            element.download = `agentspark-${activeTab}.py`;
                            document.body.appendChild(element);
                            element.click();
                        }}
                    >
                        📥 Download .py
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}
