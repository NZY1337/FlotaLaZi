import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import Masina from "../../components/Landing/Masina";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "../auth/test-utils";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));
vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });

describe("Personal-car page", () => {
    it("pitches free reminders for one car and leads to sign-up or the firm page", () => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session: null }));
        document.head.innerHTML = '<meta name="description" content="firme">';
        const { unmount } = render(<HelmetProvider><MemoryRouter><Masina /></MemoryRouter></HelmetProvider>);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ITP, RCA și rovinietă");
        expect(screen.getAllByRole("link", { name: "Creează cont gratuit" })[0]).toHaveAttribute("href", "/signup");
        expect(screen.getByRole("link", { name: /Ai o firmă de transport/ })).toHaveAttribute("href", "/");
        // The app still says "camion": the page says so instead of hiding it.
        expect(screen.getByText(/De ce scrie „camion” în aplicație/)).toBeInTheDocument();
        // PageMeta writes this page's description and puts the site's back on the way out.
        expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", expect.stringContaining("Gratuit pentru o mașină"));
        unmount();
        expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", "firme");
    });
});
