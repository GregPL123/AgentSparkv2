export default function GlobalLoading() {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="text-4xl animate-pulse">⚡</div>
                <div className="text-muted text-sm font-mono">Loading AgentSpark…</div>
            </div>
        </div>
    )
}
