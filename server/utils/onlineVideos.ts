export type SemesterTerm = "ősz" | "tavasz";

export interface ParsedSemester {
    key: string;
    startYear: number;
    term: SemesterTerm;
    label: string;
    order: number;
}

const SEMESTER_RE = /^(\d{4})-(\d{2})-(ősz|tavasz)$/;

export function parseSemester(raw: string): ParsedSemester | null {
    const m = SEMESTER_RE.exec(raw.trim());
    if (!m) return null;
    const startYear = Number(m[1]);
    const endYY = Number(m[2]);
    if ((startYear + 1) % 100 !== endYY) return null;
    const term = m[3] as SemesterTerm;
    return {
        key: `${m[1]}-${m[2]}-${term}`,
        startYear,
        term,
        label: `${m[1]}/${m[2]} ${term}`,
        order: startYear * 2 + (term === "tavasz" ? 1 : 0),
    };
}

export function semesterLabel(key: string): string {
    return parseSemester(key)?.label ?? key;
}

export function compareSemestersDesc(a: string, b: string): number {
    const pa = parseSemester(a)?.order ?? -1;
    const pb = parseSemester(b)?.order ?? -1;
    return pb - pa;
}
const YT_ID_RE = /^[\w-]{11}$/;

export function extractYoutubeId(url: string): string | null {
    let u: URL;
    try {
        u = new URL(url.trim());
    } catch {
        return null;
    }
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
        id = u.pathname.split("/")[1] ?? null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (u.pathname === "/watch") id = u.searchParams.get("v");
        else {
            const m = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(u.pathname);
            id = m?.[1] ?? null;
        }
    }
    return id && YT_ID_RE.test(id) ? id : null;
}

export function youtubeThumbnail(youtubeId: string | null): string | null {
    return youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg` : null;
}
const U_STEMS: RegExp[] = [
    /sz\?r/giu,
    /s\?r\?ség/giu,
    /réteg\?/giu,
    /érték\?/giu,
    /m\?vel/giu,
    /egyértelm\?/giu,
    /paraméter\?/giu,
    /állapotter\?/giu,
    /idej\?/giu,
];
const LITERAL_FIXES: [RegExp, string][] = [
    [/jel\?lés/gu, "jelölés"],
];
const KEEP_QUESTION_MARK: RegExp[] = [/structures\?/giu];

const LETTER = /\p{L}/u;

function isLetter(ch: string | undefined): boolean {
    return !!ch && LETTER.test(ch);
}

function isUpperLetter(ch: string | undefined): boolean {
    return isLetter(ch) && ch === ch!.toUpperCase() && ch !== ch!.toLowerCase();
}

export function repairHungarian(input: string): string {
    let s = input;
    for (const [re, rep] of LITERAL_FIXES) s = s.replace(re, rep);

    const keep = new Set<number>();
    for (const re of KEEP_QUESTION_MARK) {
        for (const m of s.matchAll(re)) keep.add(m.index! + m[0].lastIndexOf("?"));
    }
    const uIdx = new Set<number>();
    for (const re of U_STEMS) {
        for (const m of s.matchAll(re)) {
            [...m[0]].forEach((c, j) => c === "?" && uIdx.add(m.index! + j));
        }
    }

    let out = "";
    for (let i = 0; i < s.length; i++) {
        const ch = s[i]!;
        const prev = s[i - 1];
        const next = s[i + 1];
        if (ch !== "?" || keep.has(i) || (!isLetter(prev) && !isLetter(next))) {
            out += ch;
            continue;
        }
        const letter = uIdx.has(i) ? "ű" : "ő";
        const upper = isUpperLetter(next) && (isUpperLetter(prev) || !isLetter(prev)) && isUpperLetter(s[i + 2]);
        out += upper ? letter.toUpperCase() : letter;
    }
    return out;
}

export function collapseWhitespace(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

export const SUBJECT_ALIASES: Record<string, string> = {
    "Java Programozás": "Java programozás",
    "Információ- és Kódelmélet": "Információ- és kódelmélet",
    "Matematikai Analízis 1.": "Matematikai analízis I.",
    "Matematikai Analizis II": "Matematikai analízis II.",
    "Matematikai Analízis II": "Matematikai analízis II.",
    "Matematikai Analízis 3.": "Matematikai analízis III.",
    "Quantitative biology": "Quantitative Biology",
    "quantitative cell biology": "Quantitative cell biology",
    "Mutlimodal SensorFusion and Navigation": "Multimodal SensorFusion and Navigation",
    "Introduction of functional neurobiology": "Introduction to functional neurobiology",
};

export function normalizeSubject(raw: string): string {
    const s = collapseWhitespace(repairHungarian(raw));
    return SUBJECT_ALIASES[s] ?? s;
}

