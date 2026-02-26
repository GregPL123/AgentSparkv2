import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Notification } from '@/components/ui/Notification';
import { PWAManager } from '@/components/ui/PWAManager';
import { TracePanel } from '@/components/ui/TracePanel';

const sans = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' });
const mono = Space_Mono({ subsets: ['latin'], weight: '400', variable: '--font-mono' });

export const metadata: Metadata = {
    title: 'AgentSpark | AI Team Builder',
    description: 'Design and generate high-fidelity AI agent teams.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'AgentSpark',
    },
};

export const viewport: Viewport = {
    themeColor: '#00e5ff',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
            <head>
                <meta name="theme-color" content="#00e5ff" />
            </head>
            <body className="bg-bg text-text selection:bg-accent selection:text-bg font-sans">
                <div className="flex min-h-screen">
                    <Sidebar />
                    <main className="flex-1 pl-64 overflow-x-hidden relative">
                        <div className="max-w-7xl mx-auto px-8 py-10">
                            {children}
                        </div>
                        <Notification />
                        <TracePanel />
                        <PWAManager />
                    </main>
                </div>
            </body>
        </html>
    );
}
