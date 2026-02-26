'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import ReactMarkdown from 'react-markdown';
import { Button } from './Button';

interface MarkdownPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: Record<string, string>;
}

export function MarkdownPreviewModal({ isOpen, onClose, files }: MarkdownPreviewModalProps) {
    const fileNames = Object.keys(files);
    const [activeFile, setActiveFile] = useState(fileNames[0] || null);

    if (!activeFile) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Documentation Preview" maxWidth="max-w-5xl">
            <div className="flex h-[70vh] gap-6">
                <div className="w-64 flex flex-col border-r border-white/5 pr-6">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4 px-2">Files</h3>
                    <div className="flex-grow overflow-y-auto space-y-1">
                        {fileNames.map(name => (
                            <button
                                key={name}
                                onClick={() => setActiveFile(name)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeFile === name ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="flex-grow overflow-y-auto pr-4">
                        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-accent prose-strong:text-text prose-code:text-accent">
                            <ReactMarkdown>{files[activeFile]}</ReactMarkdown>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                const element = document.createElement('a');
                                const file = new Blob([files[activeFile]], { type: 'text/markdown' });
                                element.href = URL.createObjectURL(file);
                                element.download = activeFile;
                                document.body.appendChild(element);
                                element.click();
                            }}
                        >
                            📥 Download {activeFile}
                        </Button>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
