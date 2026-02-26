'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useImport } from '@/hooks/useImport';
import { useAgentSparkStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ImportPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { decryptAndDecompress, loading, error: importError } = useImport();
    const setGeneratedTeam = useAgentSparkStore((state: any) => state.setGeneratedTeam);
    const setTopic = useAgentSparkStore((state: any) => state.setTopic);
    const setLevel = useAgentSparkStore((state: any) => state.setLevel);

    const [password, setPassword] = useState('');
    const [isProtected, setIsProtected] = useState(false);
    const [dataStr, setDataStr] = useState<string | null>(null);

    useEffect(() => {
        const data = searchParams.get('data');
        const protectedFlag = searchParams.get('p') === '1';
        setDataStr(data);
        setIsProtected(protectedFlag);
    }, [searchParams]);

    const handleImport = async () => {
        if (!dataStr) return;
        try {
            const data = await decryptAndDecompress(dataStr, isProtected ? password : undefined);

            // Seed store and redirect
            setTopic(data.topic);
            setLevel(data.level);
            setGeneratedTeam(data.agents, data.files);

            router.push('/project/new');
        } catch (err) {
            console.error('Import failed:', err);
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md p-8 glass neo-glow border-accent/20 space-y-8">
                <div className="text-center space-y-2">
                    <span className="text-4xl mb-4 block">📦</span>
                    <h1 className="text-2xl font-bold tracking-tight">Shared Expert Team</h1>
                    <p className="text-xs text-muted font-mono uppercase tracking-widest">
                        {isProtected ? '🔒 Encrypted Payload' : '🔓 Public Payload'}
                    </p>
                </div>

                <div className="space-y-4">
                    {isProtected && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-accent">Decryption Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password..."
                                className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm"
                            />
                        </div>
                    )}

                    <Button
                        className="w-full"
                        loading={loading}
                        disabled={!dataStr || (isProtected && !password)}
                        onClick={handleImport}
                    >
                        Import Into Workspace
                    </Button>

                    {importError && (
                        <p className="text-xs text-danger font-bold text-center bg-danger/10 p-3 rounded-lg border border-danger/20">
                            {importError}
                        </p>
                    )}
                </div>

                <p className="text-[10px] text-muted text-center leading-relaxed">
                    The project will be imported into your current session.
                    You can refine it, export to code, or save it to your dashboard.
                </p>
            </Card>
        </div>
    );
}
