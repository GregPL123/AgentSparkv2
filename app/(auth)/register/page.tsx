'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 glass neo-glow border-accent/20 space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Join AgentSpark</h1>
                    <p className="text-muted text-sm italic">"The best way to predict the future is to architect it."</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-accent">Full Name</label>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm"
                            placeholder="Elon Musk"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-accent">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm"
                            placeholder="elon@spacex.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-accent">Master Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-xs text-danger font-bold text-center mt-2">{error}</p>}

                    <Button className="w-full h-12" loading={loading} type="submit">
                        Create Architect Account
                    </Button>
                </form>

                <div className="text-center text-xs text-muted">
                    Already have an account? <Link href="/login" className="text-accent hover:underline">Sign In</Link>
                </div>
            </Card>
        </div>
    );
}
