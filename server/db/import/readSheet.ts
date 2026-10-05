import * as XLSX from "xlsx";

/**
 * Egy munkalap beolvasása sorok tömbjébe; minden cella string ("" ha üres).
 * - .xls / .xlsx: a SheetJS közvetlenül olvassa (a szöveg Unicode-ként van benne).
 * - .csv: az Excel magyar Windowson Windows-1250 kódolással ment, ezt nekünk kell dekódolni.
 */
export function readSheetRows(data: Uint8Array, fileName: string, sheetName?: string): string[][] {
    const isCsv = fileName.toLowerCase().endsWith(".csv");

    const workbook = isCsv
        ? XLSX.read(new TextDecoder("windows-1250").decode(data), { type: "string", raw: true })
        : XLSX.read(data, { type: "array" });

    const name = sheetName ?? workbook.SheetNames[0];
    const sheet = name ? workbook.Sheets[name] : undefined;
    if (!sheet) {
        throw new Error(`Nincs ilyen munkalap: "${name ?? ""}" (elérhető: ${workbook.SheetNames.join(", ")})`);
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: true,
    });

    return rows.map((row) => row.map((cell) => String(cell ?? "")));
}