import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch, ApiError, query } from "../../services/api";
import { BACKEND_URL } from "../../helpers/constants";

const auth = vi.hoisted(() => ({ getUser: vi.fn(), signOut: vi.fn() }));
vi.mock("../../../lib/supabase", () => ({ supabase: { auth } }));

const respond = (status: number, body?: unknown) =>
    ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe("apiFetch", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("sends the bearer token and JSON content type only when there is a body", async () => {
        const fetchMock = vi.fn().mockResolvedValue(respond(200, { ok: 1 }));
        vi.stubGlobal("fetch", fetchMock);

        await apiFetch("tok", "/vehicles");
        expect(fetchMock).toHaveBeenLastCalledWith(`${BACKEND_URL}/vehicles`, { headers: { Authorization: "Bearer tok" } });

        await apiFetch("tok", "/vehicles", { method: "POST", body: "{}" });
        expect(fetchMock.mock.lastCall?.[1].headers).toEqual({ Authorization: "Bearer tok", "Content-Type": "application/json" });
    });

    it("returns null for 204", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(204)));
        await expect(apiFetch("tok", "/vehicles/1", { method: "DELETE" })).resolves.toBeNull();
    });

    it("throws the backend's first validation message", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(400, { message: ["plate must be longer", "x"] })));
        const error = await apiFetch("tok", "/vehicles").catch((e) => e);
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 400, message: "plate must be longer" });
    });

    it("signs out locally on 401 when Supabase says the session is gone", async () => {
        const { AuthSessionMissingError } = await import("@supabase/supabase-js");
        auth.getUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() });
        auth.signOut.mockResolvedValue({ error: null });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(401, { message: "Invalid or expired token" })));

        await expect(apiFetch("tok", "/dashboard")).rejects.toMatchObject({ status: 401 });
        expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("keeps the session on 401 when Supabase can't be reached", async () => {
        const { AuthRetryableFetchError } = await import("@supabase/supabase-js");
        auth.getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError("Failed to fetch", 0) });
        auth.signOut.mockClear();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(401, {})));

        await expect(apiFetch("tok", "/dashboard")).rejects.toMatchObject({ status: 401 });
        expect(auth.signOut).not.toHaveBeenCalled();
    });

    it("builds query strings without empty params", () => {
        expect(query({ from: "2026-11-01", to: undefined, vehicleId: "" })).toBe("?from=2026-11-01");
        expect(query({})).toBe("");
    });
});
