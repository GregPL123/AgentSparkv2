'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { label: 'New Project', href: '/', icon: '✨' },
        { label: 'Usage', href: '/usage', icon: '📊' },
    ];

    return (
        <aside className="w-64 h-screen bg-card border-r border-border flex flex-col glass fixed left-0 top-0 z-40">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-bg text-xl neo-glow transition-transform group-hover:scale-110">
                        ⚡
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-text tracking-tighter">AgentSpark</h1>
                        <p className="text-[10px] text-accent font-mono uppercase tracking-widest">v2.0 Beta</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-grow px-4 mt-4">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive
                                            ? 'bg-accent-dim text-accent border border-accent/20'
                                            : 'text-muted hover:bg-card/50 hover:text-text'}
                  `}
                                >
                                    <span className={`text-lg transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-bold text-sm">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-border mt-auto bg-bg/20">
                <div className="p-4 rounded-xl glass border border-border/50">
                    <p className="text-[10px] text-muted font-mono uppercase mb-2">Authenticated as</p>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs">
                            👤
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-bold text-text truncate">User Account</p>
                            <button className="text-[10px] text-accent hover:underline">Sign out</button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
