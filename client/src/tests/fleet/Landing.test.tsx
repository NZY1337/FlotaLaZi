import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import type { Session } from "@supabase/supabase-js";
import Landing from "../../components/Landing";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "../auth/test-utils";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));

// framer-motion's whileInView needs IntersectionObserver, which jsdom lacks.
vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });

const renderLanding = () =>
    render(<HelmetProvider><MemoryRouter><Landing /></MemoryRouter></HelmetProvider>);

describe("Landing page", () => {
    it("pitches FlotaLaZi and sends visitors to sign-up", () => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session: null }));
        renderLanding();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Niciun act expirat. Nicio amendă.");
        const nav = screen.getByRole("navigation");
        expect(within(nav).getByRole("link", { name: "Începe gratuit" })).toHaveAttribute("href", "/signup");
        expect(within(nav).getByRole("link", { name: "Intră în cont" })).toHaveAttribute("href", "/signin");
        expect(screen.getAllByRole("img").every((img) => img.getAttribute("alt"))).toBe(true);
    });

    it("tells visitors how to reach us", () => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session: null }));
        renderLanding();

        const footer = screen.getByRole("contentinfo");
        expect(within(footer).getByRole("link", { name: "contact@flotalazi.ro" })).toHaveAttribute("href", "mailto:contact@flotalazi.ro");
    });

    it("offers the dashboard to a signed-in user", () => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session: { access_token: "t" } as Session }));
        renderLanding();

        const nav = screen.getByRole("navigation");
        expect(within(nav).getByRole("link", { name: "Panou" })).toHaveAttribute("href", "/dashboard");
        expect(within(nav).queryByRole("link", { name: "Intră în cont" })).not.toBeInTheDocument();
    });
});
