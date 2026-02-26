import { API_BASE_URL } from './constants';

export const apiClient = {
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`API GET request failed: ${response.statusText}`);
        }
        return response.json();
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
        return res.json();
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
