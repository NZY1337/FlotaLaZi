import type React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AuthPageLayout from "../../pages/AuthPages/AuthPageLayout";
import { ThemeProvider } from "../../context/ThemeContext";

// The SVG icon's own contents are intentionally not asserted on here — only
// that the layout wires it up and renders the surrounding branding/copy.
const renderLayout = (children: React.ReactNode = <div>child content</div>) =>
    render(
        <MemoryRouter>
            <ThemeProvider>
                <AuthPageLayout>{children}</AuthPageLayout>
            </ThemeProvider>
        </MemoryRouter>,
    );

describe("AuthPageLayout", () => {
    it("renders the EuroTrack wordmark and icon", () => {
        renderLayout();

        expect(screen.getByText("EuroTrack")).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "EuroTrack" })).toBeInTheDocument();
    });

    it("renders the tagline", () => {
        renderLayout();

        expect(
            screen.getByText("Actele, reviziile și profitul flotei tale — într-un singur loc."),
        ).toBeInTheDocument();
    });

    it("renders the given children", () => {
        renderLayout(<div>Sign in form goes here</div>);

        expect(screen.getByText("Sign in form goes here")).toBeInTheDocument();
    });

    it("renders the theme toggler button", () => {
        renderLayout();

        expect(document.querySelector("button")).toBeInTheDocument();
    });
});
