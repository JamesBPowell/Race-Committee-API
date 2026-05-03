import { API_BASE_URL } from './constants';

const inFlight = new Map<string, Promise<any>>();

export const apiClient = {
    async get<T>(endpoint: string): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        
        // Deduplicate in-flight GET requests
        if (inFlight.has(url)) {
            return inFlight.get(url) as Promise<T>;
        }

        const fetchPromise = (async () => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`API GET request failed: ${response.statusText}`);
                }
                return await response.json();
            } finally {
                // Remove from in-flight map once finished (success or failure)
                inFlight.delete(url);
            }
        })();

        inFlight.set(url, fetchPromise);
        return fetchPromise;
    },

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            throw new Error(`API POST request failed: ${res.statusText}`);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : {} as T;
    },

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            throw new Error(`API PUT request failed: ${res.statusText}`);
        }
        // Handle 204 No Content which doesn't return JSON
        if (res.status === 204) {
            return {} as T;
        }
        return res.json();
    },

    async delete(endpoint: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `API DELETE request failed: ${response.statusText}`);
        }
    }
};
