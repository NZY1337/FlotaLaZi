import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import ServiceDetail from "../../pages/Dashboard/Services/ServiceDetail";
import { useService } from "../../hooks/useServices";
import { buildService, renderWithRouter } from "./test-utils";

vi.mock("../../hooks/useServices", () => ({
    useService: vi.fn(),
}));

const mockService = (state: Partial<ReturnType<typeof useService>> = {}) =>
    vi.mocked(useService).mockReturnValue({ service: undefined, isLoading: false, isError: false, ...state });

// The slug comes from the route param, so render under the real route pattern.
const renderDetail = (slug = "crm-sync") =>
    renderWithRouter(
        <Routes>
            <Route path="/services/:slug" element={<ServiceDetail />} />
        </Routes>,
        [`/services/${slug}`],
    );

describe("ServiceDetail page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("looks the service up by the slug in the URL", () => {
        mockService({ service: buildService() });
        renderDetail("crm-sync");

        expect(useService).toHaveBeenCalledWith("crm-sync");
    });

    it("renders the service's name, descriptions and price", () => {
        mockService({
            service: buildService({
                name: "CRM Sync",
                shortDescription: "Lead-uri direct în CRM",
                description: "Sincronizează lead-urile direct în CRM.",
                price: 29900,
            }),
        });
        renderDetail();

        expect(screen.getByRole("heading", { level: 1, name: "CRM Sync" })).toBeInTheDocument();
        expect(screen.getByText("Lead-uri direct în CRM")).toBeInTheDocument();
        expect(screen.getByText("Sincronizează lead-urile direct în CRM.")).toBeInTheDocument();
        expect(screen.getByText(/299,00\s*€/)).toBeInTheDocument();
    });

    it("always offers a way back to the catalog", () => {
        mockService({ service: buildService() });
        renderDetail();

        expect(screen.getByRole("link", { name: /toate serviciile/i })).toHaveAttribute("href", "/services");
    });

    it("shows 'not found' when the backend says the service doesn't exist", () => {
        mockService({ service: null });
        renderDetail("nope");

        expect(screen.getByText("Serviciul nu a fost găsit")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows an error alert — not 'not found' — when the request fails", () => {
        mockService({ isError: true });
        renderDetail();

        expect(screen.getByRole("alert")).toHaveTextContent("Nu am putut încărca serviciul");
        expect(screen.queryByText("Serviciul nu a fost găsit")).not.toBeInTheDocument();
    });

    it("shows neither 'not found' nor an error while loading", () => {
        mockService({ isLoading: true });
        renderDetail();

        expect(screen.queryByText("Serviciul nu a fost găsit")).not.toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    });
});
