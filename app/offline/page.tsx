import React from 'react';
import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
            <div className="text-6xl mb-6">📡</div>
            <h1 className="text-3xl font-bold text-text mb-4">You are currently offline</h1>
            <p className="text-muted max-w-md mb-8">
                It looks like you've lost your internet connection. Don't worry,
                your project data is saved locally and will sync once you're back online.
            </p>
            <Link
                href="/"
                className="px-8 py-3 bg-accent text-bg font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
                Retry Connection
            </Link>
        </div>
    );
}
