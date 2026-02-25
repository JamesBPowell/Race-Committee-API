import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, API_BASE_URL } from './constants';

/**
 * A wrapper around the native Web API fetch that automatically extracts the
 * .NET Identity cookie from the Next.js request headers (during SSR) and 
 * forwards it to the .NET API.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

    const headers = new Headers(options.headers || {});

    if (authCookie) {
        // Construct the raw Cookie header string for the outgoing request
        const currentCookieHeader = headers.get('Cookie') || '';
        const cookieString = `${AUTH_COOKIE_NAME}=${authCookie.value}`;

        headers.set(
            'Cookie',
            currentCookieHeader ? `${currentCookieHeader}; ${cookieString}` : cookieString
        );
    }

    // Ensure we send cookies if we happen to use this client-side as well
    const finalOptions: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // Important for local CORS
    };

    return fetch(`${API_BASE_URL}${url}`, finalOptions);
}
