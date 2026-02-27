/**
 * Direct HTTP helpers for seeding test data.
 * These bypass the browser and talk straight to the API.
 */

const API_BASE_URL = 'http://localhost:5236';


export interface RegisterPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    // 200 = success, 400 might mean user already exists — both are acceptable in setup
    if (!res.ok && res.status !== 400) {
        const text = await res.text();
        throw new Error(`Registration failed (${res.status}): ${text}`);
    }
}

export async function loginUser(payload: LoginPayload): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/login?useCookies=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'manual',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed (${res.status}): ${text}`);
    }

    // Extract Set-Cookie headers
    const cookies = res.headers.getSetCookie?.() || [];
    return cookies;
}

/**
 * Make authenticated API calls using raw cookie strings.
 */
export class AuthenticatedClient {
    private cookies: string[];

    constructor(cookies: string[]) {
        this.cookies = cookies;
    }

    private get cookieHeader(): string {
        return this.cookies.join('; ');
    }

    async get<T>(endpoint: string): Promise<T> {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookieHeader,
            },
        });
        if (!res.ok) throw new Error(`GET ${endpoint} failed (${res.status})`);
        return res.json() as Promise<T>;
    }

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookieHeader,
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`POST ${endpoint} failed (${res.status}): ${text}`);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
    }

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.cookieHeader,
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`PUT ${endpoint} failed (${res.status}): ${text}`);
        }
        if (res.status === 204) return {} as T;
        return res.json() as Promise<T>;
    }

    async delete(endpoint: string): Promise<void> {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Cookie': this.cookieHeader },
        });
        if (!res.ok) throw new Error(`DELETE ${endpoint} failed (${res.status})`);
    }
}
