'use client';

import { useState } from 'react';

export function useImport() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const decryptAndDecompress = async (base64: string, password?: string) => {
        setLoading(true);
        setError(null);
        try {
            // Decode base64url
            const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
            const buffer = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);

            let dataToDecompress: ArrayBuffer = buffer.buffer;

            // Decrypt if password provided
            if (password) {
                const iv = buffer.slice(0, 12);
                const ciphertext = buffer.slice(12);

                const enc = new TextEncoder();
                const pwHash = await crypto.subtle.digest('SHA-256', enc.encode(password));
                const key = await crypto.subtle.importKey(
                    'raw', pwHash, 'AES-GCM', false, ['decrypt']
                );

                dataToDecompress = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv }, key, ciphertext
                );
            }

            // Decompress
            const stream = new Blob([dataToDecompress]).stream();
            const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
            const decompressedBlob = await new Response(decompressedStream).blob();
            const text = await decompressedBlob.text();

            return JSON.parse(text);
        } catch (err: any) {
            setError('Decryption failed. Please check your password or the link.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, decryptAndDecompress };
}
