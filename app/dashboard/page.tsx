'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

export default function DashboardPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await apiFetch('/api/projects');
                setProjects(data);
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Your Expert Teams</h2>
                    <p className="text-muted text-sm mt-1">Manage and refine your generated agent teams.</p>
                </div>
                <Link href="/">
                    <Button>+ New Project</Button>
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <span className="text-4xl mb-4">✨</span>
                    <p className="text-muted font-medium">No projects found.</p>
                    <Link href="/" className="mt-4">
                        <Button variant="secondary">Start Your First Interview</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => (
                        <Link key={p.id} href={`/project/${p.id}`}>
                            <Card hoverable className="h-full flex flex-col group border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-accent/10 text-accent border border-accent/20">
                                        {p.level}
                                    </span>
                                    <span className="text-[10px] font-mono text-muted">
                                        {p.createdAt?.toDate?.() ? new Date(p.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold group-hover:text-accent transition-colors mb-2 text-white truncate">{p.topic}</h3>
                                <p className="text-xs text-muted mb-6 flex-grow line-clamp-2">
                                    Multi-agent team generated for specialized architectural depth.
                                </p>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {p.agents?.slice(0, 4).map((a: any, i: number) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-bg border-2 border-card flex items-center justify-center text-xs shadow-lg" title={a.name}>
                                                {a.emoji}
                                            </div>
                                        ))}
                                        {(p.agents?.length || 0) > 4 && (
                                            <div className="w-8 h-8 rounded-full bg-bg border-2 border-card flex items-center justify-center text-[10px] text-muted font-mono">
                                                +{p.agents.length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-bold text-accent uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Architect →
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}

                    <Link href="/">
                        <Card hoverable className="h-full border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center text-center p-12 hover:border-accent/40 group cursor-pointer transition-colors">
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
                            <p className="text-sm font-bold text-muted group-hover:text-text">Add New Team</p>
                        </Card>
                    </Link>
                </div>
            )}
        </div>
    );
}
