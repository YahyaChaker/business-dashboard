import * as XLSX from 'xlsx';

export async function readExcelData(sheetName: string) {
  try {
    const response = await fetch('/Project Performance Template.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error(`Error reading Excel sheet ${sheetName}:`, error);
    return [];
  }
}
