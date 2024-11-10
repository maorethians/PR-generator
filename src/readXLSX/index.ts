import XLSX from "xlsx";

export const readXLSX = <T>(path: string): T[] => {
    const fileDetail = XLSX.readFile(path);
    const sheet = fileDetail.Sheets[fileDetail.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
};