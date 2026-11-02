import {describe, it, expect} from "vitest";
import {
    classesFileSchema,
    kioskClassesQuerySchema,
    kioskKeyMatches,
    toKioskClass,
} from "../../server/utils/kioskClasses";

describe("kioskClassesQuerySchema", () => {
    it("elfogadja a Dart kliens UTC, ezredmásodperces formátumát", () => {
        const result = kioskClassesQuerySchema.safeParse({
            from: "2026-09-07T06:30:00.000Z",
            to: "2026-09-07T07:30:00.000Z",
        });
        expect(result.success).toBe(true);
    });

    it("elfogadja a helyi, offsetes időpontot is", () => {
        const result = kioskClassesQuerySchema.safeParse({
            from: "2026-09-07T08:30:00+02:00",
            to: "2026-09-07T09:30:00+02:00",
        });
        expect(result.success).toBe(true);
    });

    it("visszautasítja a fordított intervallumot", () => {
        const result = kioskClassesQuerySchema.safeParse({
            from: "2026-09-08T00:00:00Z",
            to: "2026-09-07T00:00:00Z",
        });
        expect(result.success).toBe(false);
    });

    it("visszautasítja a 31 napnál hosszabb intervallumot", () => {
        const result = kioskClassesQuerySchema.safeParse({
            from: "2026-09-01T00:00:00Z",
            to: "2026-10-05T00:00:00Z",
        });
        expect(result.success).toBe(false);
    });

    it("visszautasítja a hibás vagy hiányzó dátumot", () => {
        expect(kioskClassesQuerySchema.safeParse({from: "tegnap", to: "ma"}).success).toBe(false);
        expect(kioskClassesQuerySchema.safeParse({}).success).toBe(false);
    });
});

describe("kioskKeyMatches", () => {
    it("egyező kulcsnál igaz", () => {
        expect(kioskKeyMatches("titok-123", "titok-123")).toBe(true);
    });

    it("eltérő, hiányzó vagy üres kulcsnál hamis", () => {
        expect(kioskKeyMatches("rossz", "titok-123")).toBe(false);
        expect(kioskKeyMatches(undefined, "titok-123")).toBe(false);
        expect(kioskKeyMatches("", "titok-123")).toBe(false);
    });

    it("ha a szerveren nincs beállított kulcs, mindig hamis", () => {
        expect(kioskKeyMatches("bármi", "")).toBe(false);
    });
});

describe("toKioskClass", () => {
    it("a kliens által várt mezőnevekre és ISO időpontokra képez", () => {
        const mapped = toKioskClass({
            id: "643ad861aeb0",
            room: "ITK 422 PC labor",
            subject: "Basics of Programming 1",
            kind: "lab",
            startsAt: new Date("2026-09-07T06:30:00Z"),
            endsAt: new Date("2026-09-07T08:00:00Z"),
            groups: ["AAI-MSc"],
            instructors: ["Dr. Földi Sándor"],
            capacity: 28,
        });

        expect(mapped).toEqual({
            id: "643ad861aeb0",
            room: "ITK 422 PC labor",
            subject: "Basics of Programming 1",
            kind: "lab",
            start: "2026-09-07T06:30:00.000Z",
            end: "2026-09-07T08:00:00.000Z",
            groups: ["AAI-MSc"],
            instructors: ["Dr. Földi Sándor"],
            capacity: 28,
        });
    });
});

describe("classesFileSchema", () => {
    const item = {
        id: "643ad861aeb0",
        room: "ITK 422 PC labor",
        subject: "Basics of Programming 1",
        kind: "lab",
        start: "2026-09-07T08:30:00+02:00",
        end: "2026-09-07T10:00:00+02:00",
        groups: ["AAI-MSc"],
        instructors: ["Dr. Földi Sándor"],
        capacity: 28,
    };

    it("elfogadja a konverter kimenetét", () => {
        const result = classesFileSchema.safeParse({
            generatedFrom: "x.xlsx",
            timezone: "Europe/Budapest",
            classes: [item],
        });
        expect(result.success).toBe(true);
    });

    it("hiányzó csoport- és oktató-listát üres listára tölt", () => {
        const {groups, instructors, ...rest} = item;
        const result = classesFileSchema.parse({classes: [rest]});
        expect(result.classes[0]?.groups).toEqual([]);
        expect(result.classes[0]?.instructors).toEqual([]);
        expect(groups).toBeDefined();
        expect(instructors).toBeDefined();
    });

    it("visszautasítja a kezdésnél korábbi véget", () => {
        const result = classesFileSchema.safeParse({
            classes: [{...item, end: "2026-09-07T08:00:00+02:00"}],
        });
        expect(result.success).toBe(false);
    });

    it("visszautasítja az ismeretlen típust", () => {
        const result = classesFileSchema.safeParse({
            classes: [{...item, kind: "seminar"}],
        });
        expect(result.success).toBe(false);
    });

    it("visszautasítja az üres órarendet", () => {
        expect(classesFileSchema.safeParse({classes: []}).success).toBe(false);
    });
});