export default function ProjectLoading() {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <div className="text-muted text-xs font-mono">Loading project architecture…</div>
            </div>
        </div>
    )
}
