import { auth } from './firebase/client';

export async function apiFetch(path: string, options: any = {}) {
    const user = auth.currentUser;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (user) {
        const token = await user.getIdToken();
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(path, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}
