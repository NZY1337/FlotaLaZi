import { BACKEND_URL } from '../../helpers/constants';

export type BillingType = 'ONE_TIME' | 'SUBSCRIPTION';

// Mirrors the backend's Service entity (server/src/catalog). Prices are
// integers in minor units (cents) — the backend owns all pricing logic.
export type Service = {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    currency: string;
    billingType: BillingType;
    recurringPrice: number | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

// Both endpoints are public (CLAUDE.md §14) — no token.
export const getServices = async (): Promise<Service[]> => {
    const response = await fetch(BACKEND_URL + '/services');
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
};

// A 404 resolves to null (not an error) so the page can tell "no such
// service" apart from a request that actually failed.
export const getServiceBySlug = async (slug: string): Promise<Service | null> => {
    const response = await fetch(BACKEND_URL + `/services/${encodeURIComponent(slug)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch service');
    return response.json();
};
