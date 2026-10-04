import * as XLSX from 'xlsx';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 100;
export interface ImportedHolding { symbol: string; shares: number; avgBuyPrice: number }

export function parsePortfolio(bytes: ArrayBuffer): ImportedHolding[] {
  if (!bytes.byteLength || bytes.byteLength > MAX_IMPORT_BYTES) throw new Error('Choose a nonempty file no larger than 2 MB.');
  const workbook = XLSX.read(bytes, { type: 'array', sheets: 0, sheetRows: MAX_IMPORT_ROWS + 4, dense: true, cellFormula: false, cellHTML: false, cellStyles: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet?.['!ref']) throw new Error('Worksheet is empty.');
  const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref']);
  if (range.e.r >= MAX_IMPORT_ROWS + 3 || range.e.c >= 32) throw new Error('Import up to 100 holdings and 32 columns.');
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false });
  const header = rows.slice(0, 3).findIndex(row => row.some(cell => /SYMBOL|TICKER|STOCK|QTY|QUANTITY|SHARES|PRICE|AVG/i.test(String(cell))));
  let symbolIndex = 0, qtyIndex = 1, priceIndex = 2;
  if (header >= 0) {
    const names = rows[header].map(cell => String(cell).toUpperCase());
    const find = (pattern: RegExp, fallback: number) => { const index = names.findIndex(name => pattern.test(name)); return index < 0 ? fallback : index; };
    symbolIndex = find(/SYMBOL|STOCK|TICKER/, 0);
    qtyIndex = find(/QTY|QUANTITY|SHARES/, 1);
    priceIndex = find(/PRICE|AVG|AVERAGE|BUY|COST/, 2);
  }
  const holdings: ImportedHolding[] = [];
  for (const row of rows.slice(header + 1)) {
    if (row.length < 3) continue;
    const symbol = String(row[symbolIndex] || '').trim().toUpperCase();
    const shares = Number(String(row[qtyIndex]).replace(/,/g, ''));
    const avgBuyPrice = Number(String(row[priceIndex]).replace(/,/g, ''));
    if (!/^[A-Z0-9][A-Z0-9&. :^/_-]{0,31}$/.test(symbol) || !Number.isFinite(shares) || !Number.isFinite(avgBuyPrice) || shares <= 0 || avgBuyPrice <= 0) continue;
    holdings.push({ symbol, shares, avgBuyPrice });
  }
  if (!holdings.length) throw new Error('No valid holdings found. Use Symbol, Quantity, and Average Price columns.');
  if (holdings.length > MAX_IMPORT_ROWS) throw new Error('Import up to 100 holdings at a time.');
  return holdings;
}
