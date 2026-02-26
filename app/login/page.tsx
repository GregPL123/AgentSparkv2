'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] animate-fade-in">
            <Card className="w-full max-w-md p-8 glass neo-glow">
                <h2 className="text-2xl font-bold mb-6 text-center text-gradient">
                    {isLogin ? 'Welcome Back' : 'Join AgentSpark'}
                </h2>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-accent"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:border-accent"
                            required
                        />
                    </div>

                    {error && <p className="text-xs text-danger font-bold text-center">{error}</p>}

                    <Button type="submit" className="w-full py-4 text-base" loading={loading}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs text-muted hover:text-accent font-bold uppercase tracking-widest transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </Card>
        </div>
    );
}
