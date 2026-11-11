import { flattenRow, rowsToCSV, rowsToXLSX, rowsToPDF } from '../tabular';
import ExcelJS from 'exceljs';

describe('flattenRow', () => {
  it('flattens nested objects with dot-notation keys', () => {
    const result = flattenRow({ id: 1, department: { name: 'ICT' } });
    expect(result).toEqual({ id: 1, 'department.name': 'ICT' });
  });

  it('converts dates to ISO strings', () => {
    const date = new Date('2026-01-15T00:00:00.000Z');
    const result = flattenRow({ warrantyExpiry: date });
    expect(result.warrantyExpiry).toBe('2026-01-15T00:00:00.000Z');
  });

  it('converts null/undefined to empty string', () => {
    const result = flattenRow({ a: null, b: undefined });
    expect(result).toEqual({ a: '', b: '' });
  });

  it('JSON-stringifies arrays instead of expanding them', () => {
    const result = flattenRow({ tags: ['a', 'b'] });
    expect(result.tags).toBe('["a","b"]');
  });
});

describe('rowsToCSV', () => {
  it('produces a header row plus one row per record', () => {
    const csv = rowsToCSV([{ name: 'Desktop 1', ramGb: 8 }, { name: 'Desktop 2', ramGb: 16 }]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('name,ramGb');
  });

  it('quotes and escapes values containing commas or quotes', () => {
    const csv = rowsToCSV([{ note: 'Replaced RAM, cleaned dust, said "all good"' }]);
    expect(csv).toContain('"Replaced RAM, cleaned dust, said ""all good"""');
  });

  it('handles an empty row set without throwing', () => {
    expect(() => rowsToCSV([])).not.toThrow();
  });
});

describe('rowsToXLSX', () => {
  it('produces a readable workbook with a header row and correct data', async () => {
    const buffer = await rowsToXLSX([{ assetTag: 'UOE-001', status: 'ACTIVE' }], 'Assets');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet('Assets');

    expect(sheet).toBeDefined();
    expect(sheet!.getRow(1).getCell(1).value).toBe('assetTag');
    expect(sheet!.getRow(2).getCell(1).value).toBe('UOE-001');
  });
});

describe('rowsToPDF', () => {
  it('produces a non-empty PDF buffer starting with the PDF magic bytes', async () => {
    const buffer = await rowsToPDF('Test Report', [{ assetTag: 'UOE-001', status: 'ACTIVE' }]);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('handles an empty row set without throwing', async () => {
    await expect(rowsToPDF('Empty Report', [])).resolves.toBeInstanceOf(Buffer);
  });
});
