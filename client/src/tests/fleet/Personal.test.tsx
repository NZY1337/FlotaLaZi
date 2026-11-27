import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Fleet from "../../pages/Fleet/Fleet";
import Home from "../../pages/Dashboard/Home";
import Settings from "../../pages/Settings/Settings";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "../auth/test-utils";
import { buildVehicle, mockApi, renderPage, session } from "./test-utils";
import { BACKEND_URL } from "../../helpers/constants";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));

const emptyDashboard = {
    today: "2026-11-27",
    month: { from: "2026-11-01", to: "2026-11-30", totals: { income: 0, expense: 0, profit: 0, byCurrency: { RON: { income: 0, expense: 0 }, EUR: { income: 0, expense: 0 } } } },
    documentAlerts: [], urgentDocumentCount: 0, oil: [], recentExpenses: [],
    counts: { trucks: 0, trailers: 0, cars: 0, drivers: 0 },
};

const patchBody = (fetchMock: ReturnType<typeof mockApi>) => {
    const call = fetchMock.mock.calls.find(([url, init]) => url === `${BACKEND_URL}/settings` && init?.method === "PATCH");
    return call ? JSON.parse(call[1]!.body as string) : undefined;
};

describe("Personal accounts", () => {
    beforeEach(() => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session }));
        localStorage.clear();
    });
    afterEach(() => vi.unstubAllGlobals());

    it("see 'Mașinile mele' with their cars only, and add a car with car defaults", async () => {
        const fetchMock = mockApi({
            "GET /settings": { accountType: "PERSONAL", docAlertDays: 30 },
            "GET /vehicles": [buildVehicle({ id: "car-1", kind: "CAR", plate: "B 123 ABC", name: "Dacia Logan" })],
            "GET /documents": [],
            "GET /drivers": [],
            "POST /vehicles": buildVehicle({ id: "car-2", kind: "CAR" }),
        });
        renderPage(<Fleet />);

        expect(await screen.findByRole("heading", { name: "Mașinile mele" })).toBeInTheDocument();
        expect(await screen.findByRole("heading", { name: "B 123 ABC" })).toBeInTheDocument();
        expect(screen.queryByText(/Remorci/)).not.toBeInTheDocument();
        expect(screen.queryByText(/fără remorcă/)).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "+ Mașină" }));
        expect(screen.getByText("Adaugă mașină")).toBeInTheDocument();
        expect(screen.queryByLabelText("Remorcă cuplată")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Interval schimb (km)")).toHaveValue("15000");
        await userEvent.type(screen.getByLabelText("Nr. înmatriculare *"), "B 77 XYZ");
        await userEvent.click(screen.getByRole("button", { name: "Salvează" }));

        await waitFor(() => {
            const call = fetchMock.mock.calls.find(([url, init]) => url === `${BACKEND_URL}/vehicles` && init?.method === "POST");
            expect(JSON.parse(call![1]!.body as string)).toMatchObject({ kind: "CAR", plate: "B 77 XYZ", oilIntervalKm: 15000 });
            expect(JSON.parse(call![1]!.body as string)).not.toHaveProperty("attachedTrailerId");
        });
    });

    it("a new account is asked what it is for, and the answer is saved", async () => {
        const fetchMock = mockApi({
            "GET /settings": { accountType: null, docAlertDays: 30 },
            "GET /dashboard": emptyDashboard,
            "PATCH /settings": { accountType: "PERSONAL", docAlertDays: 30 },
        });
        renderPage(<Home />);

        await userEvent.click(await screen.findByRole("button", { name: /Mașina mea/ }));
        await waitFor(() => expect(patchBody(fetchMock)).toEqual({ accountType: "PERSONAL" }));
    });

    it("coming from /masina, the choice is applied without asking", async () => {
        localStorage.setItem("flotalazi.accountType", "PERSONAL");
        const fetchMock = mockApi({
            "GET /settings": { accountType: null, docAlertDays: 30 },
            "GET /dashboard": emptyDashboard,
            "PATCH /settings": { accountType: "PERSONAL", docAlertDays: 30 },
        });
        renderPage(<Home />);

        await waitFor(() => expect(patchBody(fetchMock)).toEqual({ accountType: "PERSONAL" }));
        expect(localStorage.getItem("flotalazi.accountType")).toBeNull();
    });

    it("the personal dashboard shows no money", async () => {
        mockApi({
            "GET /settings": { accountType: "PERSONAL", docAlertDays: 30 },
            "GET /dashboard": { ...emptyDashboard, counts: { trucks: 0, trailers: 0, cars: 1, drivers: 0 } },
        });
        renderPage(<Home />);

        expect(await screen.findByText("Ce expiră și când e schimbul de ulei.")).toBeInTheDocument();
        await screen.findByText(/Acte care necesită atenție/);
        expect(screen.queryByText(/Încasări/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Ultimele cheltuieli/)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "+ Încasare" })).not.toBeInTheDocument();
    });
    it("can switch the account type in Setări only while the account is empty", async () => {
        mockApi({
            "GET /settings": { accountType: "PERSONAL", docAlertDays: 30, oilAlertKm: 5000, eurRate: 4.97, emailAlerts: true },
            "GET /dashboard": emptyDashboard,
        });
        const empty = renderPage(<Settings />);
        expect(await screen.findByLabelText("Folosesc FlotaLaZi pentru")).toBeInTheDocument();
        empty.unmount();

        mockApi({
            "GET /settings": { accountType: "PERSONAL", docAlertDays: 30, oilAlertKm: 5000, eurRate: 4.97, emailAlerts: true },
            "GET /dashboard": { ...emptyDashboard, counts: { trucks: 0, trailers: 0, cars: 1, drivers: 0 } },
        });
        renderPage(<Settings />);
        expect(await screen.findByText("🚗 Mașina mea (persoană fizică)")).toBeInTheDocument();
        expect(screen.queryByLabelText("Folosesc FlotaLaZi pentru")).not.toBeInTheDocument();
    });
});
