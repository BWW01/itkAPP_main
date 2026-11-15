import { describe, expect, it } from "vitest";
import { assertPublicUrl, isBlockedAddress } from "../../server/utils/safeFetch";

describe("isBlockedAddress", () => {
    it.each([
        "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.10",
        "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
        "::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1",
        "::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:7f00:1",
        "not-an-ip",
    ])("blocks %s", (ip) => {
        expect(isBlockedAddress(ip)).toBe(true);
    });

    it.each([
        "8.8.8.8", "1.1.1.1", "172.15.255.255", "172.32.0.1", "193.6.10.1",
        "2a00:1450:4001:80b::200e", "::ffff:8.8.8.8",
    ])("allows %s", (ip) => {
        expect(isBlockedAddress(ip)).toBe(false);
    });
});

describe("assertPublicUrl", () => {
    it("rejects plain http", async () => {
        await expect(assertPublicUrl("http://example.com/cal.ics")).rejects.toThrow();
    });

    it("rejects IP literals in private ranges", async () => {
        await expect(assertPublicUrl("https://127.0.0.1/cal.ics")).rejects.toThrow();
        await expect(assertPublicUrl("https://[::1]/cal.ics")).rejects.toThrow();
        await expect(assertPublicUrl("https://169.254.169.254/latest/meta-data")).rejects.toThrow();
    });

    it("rejects hosts that resolve to loopback", async () => {
        await expect(assertPublicUrl("https://localhost/cal.ics")).rejects.toThrow();
    });
});