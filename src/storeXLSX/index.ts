import XLSX from "xlsx";

export const storeXLSX = async <T extends Record<string, any>>(rows: T[], path: string) => {
    const output: string[][] = [];

    const keys = Object.keys(rows[0]);
    output.push(keys);

    for (const row of rows) {
        const outputRow: string[] = [];

        for (const key of keys) {
            outputRow.push(row[key]);
        }

        output.push(outputRow);
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(output);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, path);
};