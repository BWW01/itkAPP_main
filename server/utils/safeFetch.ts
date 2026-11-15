import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;

/** IPv4 ranges a user-supplied URL must never reach (private, loopback, link-local, ...). */
const BLOCKED_V4: Array<[string, number]> = [
    ["0.0.0.0", 8],       // "this network"
    ["10.0.0.0", 8],      // private
    ["100.64.0.0", 10],   // carrier-grade NAT
    ["127.0.0.0", 8],     // loopback
    ["169.254.0.0", 16],  // link-local, cloud metadata
    ["172.16.0.0", 12],   // private
    ["192.0.0.0", 24],    // IETF protocol assignments
    ["192.168.0.0", 16],  // private
    ["198.18.0.0", 15],   // benchmarking
    ["224.0.0.0", 4],     // multicast
    ["240.0.0.0", 4],     // reserved, broadcast
];

function v4ToInt(ip: string): number {
    return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function inV4Range(ip: string, base: string, bits: number): boolean {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (v4ToInt(ip) & mask) === (v4ToInt(base) & mask);
}

/** Expands an IPv6 address to 8 groups of 16 bits. Handles "::" and an embedded IPv4 tail. */
function v6Groups(ip: string): number[] {
    let address = ip.toLowerCase();
    const v4Tail = address.match(/(\d+\.\d+\.\d+\.\d+)$/);
    if (v4Tail) {
        const n = v4ToInt(v4Tail[1]!);
        address = address.slice(0, -v4Tail[1]!.length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
    }
    const [head, tail] = address.split("::");
    const headParts = head ? head.split(":") : [];
    const tailParts = tail !== undefined && tail !== "" ? tail.split(":") : [];
    const fill = tail !== undefined ? 8 - headParts.length - tailParts.length : 0;
    return [...headParts, ...Array(fill).fill("0"), ...tailParts].map((g) => parseInt(g, 16));
}

/** True if the address must not be fetched on behalf of a user. */
export function isBlockedAddress(ip: string): boolean {
    const version = isIP(ip);
    if (version === 4) {
        return BLOCKED_V4.some(([base, bits]) => inV4Range(ip, base, bits));
    }
    if (version === 6) {
        const g = v6Groups(ip);
        const allZeroPrefix = g.slice(0, 5).every((x) => x === 0);
        if (allZeroPrefix && g[5] === 0xffff) {
            // IPv4-mapped (::ffff:a.b.c.d): check the IPv4 address
            const v4 = `${g[6]! >> 8}.${g[6]! & 0xff}.${g[7]! >> 8}.${g[7]! & 0xff}`;
            return isBlockedAddress(v4);
        }
        if (g.every((x) => x === 0)) return true;                       // ::
        if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
        if ((g[0]! & 0xfe00) === 0xfc00) return true;                   // fc00::/7 unique local
        if ((g[0]! & 0xffc0) === 0xfe80) return true;                   // fe80::/10 link-local
        if ((g[0]! & 0xff00) === 0xff00) return true;                   // ff00::/8 multicast
        return false;
    }
    return true; // not an IP address at all
}

/** Throws if the URL is not https or its host resolves to a blocked address. */
export async function assertPublicUrl(raw: string): Promise<URL> {
    const url = new URL(raw);
    if (url.protocol !== "https:") throw new Error("Only https URLs are allowed");

    const host = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(host)
        ? [host]
        : (await lookup(host, { all: true })).map((a) => a.address);
    if (addresses.length === 0 || addresses.some(isBlockedAddress)) {
        throw new Error(`Blocked address for host ${host}`);
    }
    return url;
}

/**
 * fetch() for user-supplied URLs: every hop (including redirects) must be a
 * public https address. Note: the DNS answer can change between the check and
 * the request (DNS rebinding); the check still stops plain internal URLs.
 */
export async function safeFetch(raw: string, init: RequestInit = {}): Promise<Response> {
    let current = raw;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const url = await assertPublicUrl(current);
        const res = await fetch(url, { ...init, redirect: "manual" });
        const location = res.headers.get("location");
        if (res.status >= 300 && res.status < 400 && location) {
            current = new URL(location, url).toString();
            continue;
        }
        return res;
    }
    throw new Error("Too many redirects");
}