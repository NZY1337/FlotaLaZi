import { BACKEND_URL } from '../../helpers/constants';

/** Error carrying the backend's status and (first) validation message. */
export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

// One fetch wrapper for the authenticated fleet API: adds the bearer token and
// JSON headers, throws ApiError on non-2xx, returns null for 204.
export const apiFetch = async <T>(token: string, path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(BACKEND_URL + path, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            ...init.headers,
        },
    });
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const body = await response.json();
            message = Array.isArray(body?.message) ? body.message[0] : body?.message ?? message;
        } catch { /* not JSON */ }
        throw new ApiError(response.status, message);
    }
    if (response.status === 204) return null as T;
    return response.json();
};

export const jsonBody = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const query = (params: Record<string, string | undefined>) => {
    const entries = Object.entries(params).filter(([, v]) => v);
    return entries.length ? `?${new URLSearchParams(entries as [string, string][]).toString()}` : '';
};
