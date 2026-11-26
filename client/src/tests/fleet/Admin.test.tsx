import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import Admin from "../../pages/Admin/Admin";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "../auth/test-utils";
import { mockApi, renderPage, session } from "./test-utils";
import { sinceLabel } from "../../helpers/fleet";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));

const overview = {
    totals: { users: 2, newUsers7d: 1, newUsers30d: 2, activeUsers7d: 1, trucks: 3, trailers: 2, cars: 1, personalUsers: 1, drivers: 4, documents: 9, transactions: 40, alertsToday: 6 },
    clients: [
        { id: "u1", email: "ion@transport.ro", name: "Ion Popescu", role: "user", createdAt: "2026-11-20T10:00:00.000Z", lastSeenAt: new Date().toISOString(), trucks: 3, trailers: 2, cars: 0, drivers: 4, documents: 9, transactions: 40, emailAlerts: true, accountType: "FIRM" },
        { id: "u2", email: "nou@firma.ro", name: "Vasile", role: "user", createdAt: "2026-11-25T10:00:00.000Z", lastSeenAt: "2026-11-25T10:00:00.000Z", trucks: 0, trailers: 0, cars: 0, drivers: 0, documents: 0, transactions: 0, emailAlerts: false, accountType: "PERSONAL" },
    ],
};

describe("Admin page", () => {
    beforeEach(() => vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session })));
    afterEach(() => vi.unstubAllGlobals());

    it("shows the totals and one row per client, flagging who has not started", async () => {
        mockApi({ "GET /admin/overview": overview });
        renderPage(<Admin />);

        expect(await screen.findByText("Ion Popescu")).toBeInTheDocument();
        expect(screen.getByText("ion@transport.ro")).toBeInTheDocument();
        expect(screen.getByText("+1 în 7 zile · 1 persoane fizice")).toBeInTheDocument();
        expect(screen.getByText("1 mașini · 4 șoferi")).toBeInTheDocument();
        expect(screen.getByText("Persoană")).toBeInTheDocument();
        expect(screen.getByText("3 / 2")).toBeInTheDocument();
        expect(screen.getAllByText("n-a început")).toHaveLength(1);
        expect(screen.getByText("Nu")).toBeInTheDocument();
        expect(screen.getByText("azi")).toBeInTheDocument();
    });

    it("tells a non-admin the page does not exist", async () => {
        mockApi({});
        renderPage(<Admin />);
        expect(await screen.findByText("Pagina nu există")).toBeInTheDocument();
    });
});

describe("sinceLabel", () => {
    const now = new Date(2026, 10, 26, 19, 0);
    it.each([
        [new Date(2026, 10, 26, 8, 0), "azi"],
        [new Date(2026, 10, 25, 23, 0), "ieri"],
        [new Date(2026, 10, 21, 12, 0), "acum 5 zile"],
        [new Date(2026, 7, 26, 12, 0), "acum 3 luni"],
    ])("%s → %s", (date, label) => {
        expect(sinceLabel(date.toISOString(), now)).toBe(label);
    });
});
