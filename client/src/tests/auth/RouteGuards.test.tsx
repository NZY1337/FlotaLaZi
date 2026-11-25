import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router";
import type { Session } from "@supabase/supabase-js";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import RedirectIfAuthenticated from "../../components/common/RedirectIfAuthenticated";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "./test-utils";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));

// Same shape as App.tsx: "/" redirects to the dashboard, which is protected.
const renderAt = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<p>Panou</p>} />
                </Route>
                <Route element={<RedirectIfAuthenticated />}>
                    <Route path="/signin" element={<p>Sign in page</p>} />
                </Route>
            </Routes>
        </MemoryRouter>,
    );

describe("route guards", () => {
    beforeEach(() => vi.clearAllMocks());

    it("sends a signed-out visitor from / to the sign-in page (no redirect loop)", () => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session: null }));
        renderAt("/");
        expect(screen.getByText("Sign in page")).toBeInTheDocument();
    });

    it("shows the dashboard to a signed-in user", () => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session: { access_token: "t" } as Session }));
        renderAt("/");
        expect(screen.getByText("Panou")).toBeInTheDocument();
    });

    it("sends a signed-in user away from the sign-in page", () => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session: { access_token: "t" } as Session }));
        renderAt("/signin");
        expect(screen.getByText("Panou")).toBeInTheDocument();
    });
});
