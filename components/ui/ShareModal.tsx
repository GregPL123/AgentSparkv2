'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

export function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
    const [password, setPassword] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [sizeWarning, setSizeWarning] = useState(false);

    const generateLink = async (isProtected: boolean) => {
        setLoading(true);
        setSizeWarning(false);
        try {
            let payload = JSON.stringify(data);

            // Compression
            const stream = new Blob([payload]).stream();
            const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
            const compressedBlob = await new Response(compressedStream).blob();
            const arrayBuffer = await compressedBlob.arrayBuffer();

            let finalData: ArrayBuffer = arrayBuffer;

            // Encryption
            if (isProtected && password) {
                const enc = new TextEncoder();
                const pwHash = await crypto.subtle.digest('SHA-256', enc.encode(password));
                const key = await crypto.subtle.importKey(
                    'raw', pwHash, 'AES-GCM', false, ['encrypt']
                );
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const ciphertext = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv }, key, arrayBuffer
                );

                const combined = new Uint8Array(iv.length + ciphertext.byteLength);
                combined.set(iv);
                combined.set(new Uint8Array(ciphertext), iv.length);
                finalData = combined.buffer;
            }

            // Encode to base64url
            const base64 = btoa(String.fromCharCode(...new Uint8Array(finalData)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const url = `${window.location.origin}/import?data=${base64}${isProtected ? '&p=1' : ''}`;

            if (url.length > 2000) {
                setSizeWarning(true);
            }

            setShareUrl(url);
        } catch (err) {
            console.error('Share link generation failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Agent Team">
            <div className="space-y-6">
                <p className="text-sm text-muted">
                    Generates a self-contained link including all agent data.
                    Use a password for client-side AES-256 encryption.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Password (Optional)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank for no encryption"
                            className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1"
                            loading={loading}
                            onClick={() => generateLink(!!password)}
                        >
                            Generate Link
                        </Button>
                    </div>
                </div>

                {shareUrl && (
                    <div className="space-y-3 animate-slide-up">
                        <div className="relative group">
                            <input
                                readOnly
                                value={shareUrl}
                                className="w-full bg-bg/50 border border-accent/20 rounded-xl px-4 py-3 pr-12 text-[10px] font-mono outline-none"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(shareUrl)}
                                className="absolute right-3 top-2.5 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy link"
                            >
                                📋
                            </button>
                        </div>

                        {sizeWarning && (
                            <p className="text-[10px] text-danger font-bold uppercase tracking-tighter">
                                ⚠️ Warning: Link length exceeds 2000 chars. May not work in all browsers.
                            </p>
                        )}

                        <p className="text-[10px] text-accent font-mono text-center">
                            Link contains {Math.round(shareUrl.length / 1024 * 10) / 10} KB of data
                        </p>
                    </div>
                )}

                <div className="pt-4 border-t border-white/5 flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Done</Button>
                </div>
            </div>
        </Modal>
    );
}
