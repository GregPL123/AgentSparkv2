'use client';

import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import JSZip from 'jszip';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any | null>(null);

    const processFile = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            if (file.name.endsWith('.json')) {
                const text = await file.text();
                const data = JSON.parse(text);
                setPreview(data);
            } else if (file.name.endsWith('.zip')) {
                const zip = new JSZip();
                const content = await zip.loadAsync(file);

                let projectData: any = null;

                // Strategy 1: agentspark.json
                const manifest = content.file('agentspark.json');
                if (manifest) {
                    projectData = JSON.parse(await manifest.async('text'));
                } else {
                    // Strategy 2: any .json
                    const jsonFiles = Object.keys(content.files).filter(f => f.endsWith('.json'));
                    if (jsonFiles.length > 0) {
                        projectData = JSON.parse(await content.files[jsonFiles[0]].async('text'));
                    }
                }

                if (!projectData) throw new Error('No valid project metadata found in ZIP.');
                setPreview(projectData);
            } else {
                throw new Error('Unsupported file format. Please use .json or .zip');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Expert Team">
            <div className="space-y-6">
                {!preview ? (
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop}
                        className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-accent/40 transition-colors cursor-pointer group"
                    >
                        <input
                            type="file"
                            accept=".json,.zip"
                            className="hidden"
                            id="import-input"
                            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        />
                        <label htmlFor="import-input" className="cursor-pointer">
                            <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">📂</span>
                            <p className="text-sm font-medium">Drag & drop your .json or .zip here</p>
                            <p className="text-[10px] text-muted uppercase tracking-widest mt-2">or click to browse</p>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-accent mb-1">{preview.topic}</h3>
                            <p className="text-[10px] text-muted uppercase tracking-widest">
                                Level: {preview.level} · {preview.agents?.length || 0} Agents
                            </p>
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                            {preview.agents?.map((a: any) => (
                                <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg/50 border border-white/5 text-[10px]">
                                    <span>{a.emoji}</span>
                                    <span className="font-bold">{a.name}</span>
                                    <span className="text-muted ml-auto">{a.role}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" className="flex-1" onClick={() => setPreview(null)}>Reset</Button>
                            <Button className="flex-1" onClick={() => onImport(preview)}>Confirm Import</Button>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-danger font-bold text-center bg-danger/10 p-3 rounded-lg border border-danger/20">
                        {error}
                    </p>
                )}

                <div className="pt-4 border-t border-white/5 flex justify-end">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                </div>
            </div>
        </Modal>
    );
}
