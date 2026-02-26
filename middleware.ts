import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: Middleware runs on Edge Runtime. 
// Standard firebase-admin doesn't work here.
// We verify the presence of the token/cookie and redirect for pages.
// API routes will do the full verification via AIService/Admin SDK helpers.

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protected paths
    const protectedPaths = ['/dashboard', '/project', '/api/ai', '/api/projects'];
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));

    // Public paths
    const publicPaths = ['/login', '/register', '/api/health', '/'];
    const isPublic = publicPaths.some(path => pathname === path);

    const session = request.cookies.get('session');
    const authHeader = request.headers.get('Authorization');

    if (isProtected && !session && !authHeader) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/project/:path*', '/api/ai/:path*', '/api/projects/:path*'],
};
