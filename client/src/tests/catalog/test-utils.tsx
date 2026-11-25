import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import type { Service } from "../../services/services";

export const buildService = (overrides: Partial<Service> = {}): Service => ({
    id: "svc-1",
    name: "CRM Sync",
    slug: "crm-sync",
    description: "Sincronizează lead-urile direct în CRM.",
    shortDescription: "Lead-uri direct în CRM",
    price: 29900,
    currency: "EUR",
    billingType: "ONE_TIME",
    recurringPrice: null,
    active: true,
    createdAt: "2026-10-05T10:00:00.000Z",
    updatedAt: "2026-10-05T10:00:00.000Z",
    ...overrides,
});

// PageMeta uses react-helmet-async, which needs a HelmetProvider in the tree
// (the app gets one from AppWrapper in main.tsx).
export const renderWithRouter = (ui: ReactNode, initialEntries: string[] = ["/"]) =>
    render(
        <HelmetProvider>
            <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
        </HelmetProvider>,
    );
