import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Fleet from "../../pages/Fleet/Fleet";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "../auth/test-utils";
import { TOKEN, buildDocument, buildVehicle, mockApi, renderPage, session } from "./test-utils";
import { BACKEND_URL } from "../../helpers/constants";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));

describe("Fleet page", () => {
    let fetchMock: ReturnType<typeof mockApi>;

    beforeEach(() => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session }));
        fetchMock = mockApi({
            "GET /vehicles": [
                buildVehicle({ attachedTrailerId: "trailer-1", attachedTrailer: { id: "trailer-1", plate: "NT 83 SAT" } }),
                buildVehicle({ id: "trailer-1", kind: "TRAILER", plate: "NT 83 SAT", name: "Schmitz", trailerType: "SEMIREMORCA", km: null, oil: null, coupledTruck: { id: "truck-1", plate: "NT 08 RGT" } }),
            ],
            "GET /documents": [buildDocument()],
            "GET /drivers": [],
            "GET /settings": { docAlertDays: 30 },
            "POST /vehicles/truck-1/oil-change": buildVehicle(),
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it("shows trucks with km, oil status, coupled trailer and document chips", async () => {
        renderPage(<Fleet />);

        expect(await screen.findByRole("heading", { name: "NT 08 RGT" })).toBeInTheDocument();
        expect(screen.getByText("🚚 NT 83 SAT")).toBeInTheDocument();
        expect(screen.getByText(/mai sunt 18\.000 km/)).toBeInTheDocument();
        expect(screen.getByText("ITP · 7z")).toBeInTheDocument();
        expect(screen.getByText("Semiremorcă · Schmitz")).toBeInTheDocument();
        expect(screen.getByText("🚛 NT 08 RGT")).toBeInTheDocument();
    });

    it("records an oil change with its cost", async () => {
        renderPage(<Fleet />);
        await userEvent.click(await screen.findByRole("button", { name: "🛢️ Schimb ulei făcut" }));

        const km = screen.getByLabelText("Kilometraj din bord *");
        await userEvent.clear(km);
        await userEvent.type(km, "415000");
        await userEvent.type(screen.getByLabelText("Cost (opțional)"), "2500");
        await userEvent.click(screen.getByRole("button", { name: "Salvează" }));

        await waitFor(() => {
            const call = fetchMock.mock.calls.find(([url, init]) => url === `${BACKEND_URL}/vehicles/truck-1/oil-change` && init?.method === "POST");
            expect(call).toBeDefined();
            expect(JSON.parse(call![1]!.body as string)).toMatchObject({ km: 415000, cost: 2500, currency: "RON" });
            expect((call![1]!.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
        });
    });
});
