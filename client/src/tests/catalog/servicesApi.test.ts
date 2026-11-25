import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getServices, getServiceBySlug } from "../../services/services";
import { BACKEND_URL } from "../../helpers/constants";
import { buildService } from "./test-utils";

const fetchMock = vi.fn();

const respond = (status: number, body?: unknown) =>
    ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe("services API", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    describe("getServices", () => {
        it("fetches the public catalog without any auth header", async () => {
            const services = [buildService()];
            fetchMock.mockResolvedValue(respond(200, services));

            await expect(getServices()).resolves.toEqual(services);
            expect(fetchMock).toHaveBeenCalledWith(`${BACKEND_URL}/services`);
        });

        it("throws when the request fails", async () => {
            fetchMock.mockResolvedValue(respond(500));

            await expect(getServices()).rejects.toThrow("Failed to fetch services");
        });
    });

    describe("getServiceBySlug", () => {
        it("fetches one service by slug", async () => {
            const service = buildService();
            fetchMock.mockResolvedValue(respond(200, service));

            await expect(getServiceBySlug("crm-sync")).resolves.toEqual(service);
            expect(fetchMock).toHaveBeenCalledWith(`${BACKEND_URL}/services/crm-sync`);
        });

        it("URL-encodes the slug so it can't alter the request path", async () => {
            fetchMock.mockResolvedValue(respond(200, buildService()));

            await getServiceBySlug("a b/c");

            expect(fetchMock).toHaveBeenCalledWith(`${BACKEND_URL}/services/a%20b%2Fc`);
        });

        it("resolves to null on a 404, so 'not found' isn't an error", async () => {
            fetchMock.mockResolvedValue(respond(404));

            await expect(getServiceBySlug("nope")).resolves.toBeNull();
        });

        it("still throws on any other failure", async () => {
            fetchMock.mockResolvedValue(respond(500));

            await expect(getServiceBySlug("crm-sync")).rejects.toThrow("Failed to fetch service");
        });
    });
});
