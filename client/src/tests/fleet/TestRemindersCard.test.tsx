import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TestRemindersCard from "../../components/fleet/TestRemindersCard";
import { useAppContext } from "../../context/AppContext";
import { buildAppContextValue } from "../auth/test-utils";
import { mockApi, renderPage, session } from "./test-utils";

vi.mock("../../context/AppContext", () => ({ useAppContext: vi.fn() }));

describe("TestRemindersCard", () => {
    beforeEach(() => vi.mocked(useAppContext).mockReturnValue(buildAppContextValue({ session })));
    afterEach(() => vi.unstubAllGlobals());

    it("sends the alerts and shows what went out and where", async () => {
        const fetchMock = mockApi({
            "POST /reminders/test": {
                alerts: ["ITP — NT 08 RGT: expiră în 7 zile (02.12.2026)"],
                email: { sent: true, to: "andrew@test.ro", error: null },
            },
        });
        renderPage(<TestRemindersCard />);

        await userEvent.click(screen.getByRole("button", { name: "Trimite-mi alertele acum" }));

        expect(await screen.findByText("• ITP — NT 08 RGT: expiră în 7 zile (02.12.2026)")).toBeInTheDocument();
        expect(screen.getByText(/Email trimis la andrew@test\.ro/)).toBeInTheDocument();
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    });

    it("explains an SMTP failure", async () => {
        mockApi({ "POST /reminders/test": { alerts: ["x"], email: { sent: false, to: "a@b.ro", error: "Invalid login" } } });
        renderPage(<TestRemindersCard />);

        await userEvent.click(screen.getByRole("button", { name: "Trimite-mi alertele acum" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Emailul nu a putut fi trimis: Invalid login");
    });

    it("says so when nothing needs attention", async () => {
        mockApi({ "POST /reminders/test": { alerts: [], email: { sent: false, to: null, error: null } } });
        renderPage(<TestRemindersCard />);

        await userEvent.click(screen.getByRole("button", { name: "Trimite-mi alertele acum" }));

        expect(await screen.findByText(/Nimic nu necesită atenție acum/)).toBeInTheDocument();
    });
});
