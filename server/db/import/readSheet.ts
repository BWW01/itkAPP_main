import * as XLSX from "xlsx";

export function readSheetRows(data: Uint8Array, fileName: string, sheetName?: string): string[][] {
    const isCsv = fileName.toLowerCase().endsWith(".csv");
    const hasUtf8Bom = data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf;

    const workbook = isCsv
        ? XLSX.read(new TextDecoder(hasUtf8Bom ? "utf-8" : "windows-1250").decode(data), { type: "string", raw: true })
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
