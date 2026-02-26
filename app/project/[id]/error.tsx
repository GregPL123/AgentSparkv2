'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function ProjectError({
    error, reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[AgentSpark] Project error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
                <p className="text-muted text-sm mb-6">{error.message || 'Failed to load project'}</p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset}>Try again</Button>
                    <Link href="/dashboard">
                        <Button variant="secondary">My Projects</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
