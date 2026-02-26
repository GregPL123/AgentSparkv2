import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center text-center p-8">
            <div>
                <div className="text-6xl mb-4 font-mono text-accent">404</div>
                <h1 className="text-2xl font-bold text-text mb-2">Page not found</h1>
                <p className="text-muted mb-6">This page doesn't exist or was moved.</p>
                <Link href="/" className="px-6 py-2 bg-accent text-bg font-bold rounded-lg hover:opacity-90 transition-opacity">
                    Back to AgentSpark
                </Link>
            </div>
        </div>
    )
}
