import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import Services from "../../pages/Dashboard/Services/Services";
import { useServices } from "../../hooks/useServices";
import { buildService, renderWithRouter } from "./test-utils";

vi.mock("../../hooks/useServices", () => ({
    useServices: vi.fn(),
}));

const mockServices = (state: Partial<ReturnType<typeof useServices>> = {}) =>
    vi.mocked(useServices).mockReturnValue({ services: [], isLoading: false, isError: false, ...state });

describe("Services page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders a card per service, each linking to its detail page", () => {
        mockServices({
            services: [
                buildService({ id: "1", name: "CRM Sync", slug: "crm-sync", shortDescription: "Lead-uri în CRM" }),
                buildService({ id: "2", name: "Invoice Bot", slug: "invoice-bot", shortDescription: "Facturi automate" }),
            ],
        });
        renderWithRouter(<Services />);

        const crm = screen.getByRole("link", { name: /CRM Sync/ });
        expect(crm).toHaveAttribute("href", "/services/crm-sync");
        expect(crm).toHaveTextContent("Lead-uri în CRM");

        const invoice = screen.getByRole("link", { name: /Invoice Bot/ });
        expect(invoice).toHaveAttribute("href", "/services/invoice-bot");
        expect(invoice).toHaveTextContent("Facturi automate");
    });

    it("shows each service's price on its card", () => {
        mockServices({ services: [buildService({ price: 29900 })] });
        renderWithRouter(<Services />);

        expect(screen.getByRole("link", { name: /CRM Sync/ })).toHaveTextContent(/299,00\s*€/);
    });

    it("shows a placeholder, not the empty state, while loading", () => {
        mockServices({ isLoading: true });
        renderWithRouter(<Services />);

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        expect(screen.queryByText("Niciun serviciu disponibil momentan")).not.toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows an error alert when the request fails", () => {
        mockServices({ isError: true });
        renderWithRouter(<Services />);

        expect(screen.getByRole("alert")).toHaveTextContent("Nu am putut încărca serviciile");
        expect(screen.queryByText("Niciun serviciu disponibil momentan")).not.toBeInTheDocument();
    });

    it("shows an empty state when there are no services", () => {
        mockServices({ services: [] });
        renderWithRouter(<Services />);

        expect(screen.getByText("Niciun serviciu disponibil momentan")).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});
