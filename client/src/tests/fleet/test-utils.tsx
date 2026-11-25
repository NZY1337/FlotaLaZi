import type { ReactNode } from "react";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { BACKEND_URL } from "../../helpers/constants";
import type { FleetDocument } from "../../services/documents";
import type { Vehicle } from "../../services/vehicles";

export const TOKEN = "test-token";
export const session = { access_token: TOKEN } as Session;

/** Routes fetch calls by "METHOD /path" to canned JSON responses. */
export const mockApi = (routes: Record<string, unknown>) => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        const path = url.replace(BACKEND_URL, "").split("?")[0];
        const key = `${init?.method ?? "GET"} ${path}`;
        if (!(key in routes)) return { ok: false, status: 404, json: async () => ({ message: `no mock for ${key}` }) } as Response;
        const body = routes[key];
        return { ok: true, status: body === null ? 204 : 200, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

export const renderPage = (ui: ReactNode) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <HelmetProvider>
                <MemoryRouter>{ui}</MemoryRouter>
            </HelmetProvider>
        </QueryClientProvider>,
    );
};

export const buildDocument = (o: Partial<FleetDocument> = {}): FleetDocument => ({
    id: "doc-1", vehicleId: "truck-1", driverId: null, type: "ITP", expiresOn: "2026-12-02", alertDays: 30, notes: "",
    daysLeft: 7, level: "yellow", subject: "NT 08 RGT", ...o,
});

export const buildVehicle = (o: Partial<Vehicle> = {}): Vehicle => ({
    id: "truck-1", kind: "TRUCK", plate: "NT 08 RGT", name: "Scania R500", vin: "", notes: "", trailerType: null,
    attachedTrailerId: null, km: 412000, lastOilKm: 380000, oilIntervalKm: 50000, lastOilDate: null, oilIntervalMonths: 12,
    oil: { configured: true, nextKm: 430000, kmLeft: 18000, dueDate: null, daysLeft: null, usedPct: 64, level: "green" },
    attachedTrailer: null, ...o,
});
