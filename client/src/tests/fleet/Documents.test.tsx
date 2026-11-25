import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Documents from "../../pages/Documents/Documents";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "../auth/test-utils";
import { buildDocument, mockApi, renderPage, session } from "./test-utils";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));

describe("Documents page", () => {
    beforeEach(() => {
        vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session }));
        mockApi({
            "GET /documents": [
                buildDocument({ id: "a", type: "Licență Transport", subject: "Firmă", vehicleId: null, daysLeft: -3, level: "red", expiresOn: "2026-11-22" }),
                buildDocument({ id: "b" }),
                buildDocument({ id: "c", type: "Card tahograf", subject: "Ion Popescu", vehicleId: null, driverId: "drv", daysLeft: 200, level: "green" }),
            ],
            "GET /vehicles": [],
            "GET /drivers": [],
            "GET /settings": { docAlertDays: 30 },
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it("shows every document with the status computed by the backend", async () => {
        renderPage(<Documents />);

        expect(await screen.findByText("Expirat de 3 zile")).toBeInTheDocument();
        expect(screen.getByText("Mai sunt 7 zile")).toBeInTheDocument();
        expect(screen.getByText("Valabil · 200 zile")).toBeInTheDocument();
        expect(screen.getByText("— NT 08 RGT")).toBeInTheDocument();
        expect(screen.getByText("Expiră: 22.11.2026")).toBeInTheDocument();
    });

    it("filters to expired / urgent documents", async () => {
        renderPage(<Documents />);
        await screen.findByText("Mai sunt 7 zile");

        await userEvent.click(screen.getByRole("button", { name: "Expirate / urgente (2)" }));

        expect(screen.queryByText("Valabil · 200 zile")).not.toBeInTheDocument();
        expect(screen.getByText("Expirat de 3 zile")).toBeInTheDocument();
    });
});
