import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Flattens nested objects/dates into a single-level record suitable for a
 * spreadsheet row — e.g. { department: { name: "ICT" } } becomes
 * { "department.name": "ICT" }. Arrays are JSON-stringified rather than
 * expanded, since export rows need one row per top-level record.
 */
export function flattenRow(obj: Record<string, any>, prefix = ''): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      out[path] = '';
    } else if (value instanceof Date) {
      out[path] = value.toISOString();
    } else if (Array.isArray(value)) {
      out[path] = JSON.stringify(value);
    } else if (typeof value === 'object') {
      Object.assign(out, flattenRow(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

function deriveColumns(rows: Record<string, any>[]): string[] {
  const columns = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) columns.add(key);
  }
  return Array.from(columns);
}

export function rowsToCSV(rawRows: Record<string, any>[]): string {
  const rows = rawRows.map((r) => flattenRow(r));
  const columns = deriveColumns(rows);

  const escape = (value: unknown) => {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const lines = [columns.map(escape).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(row[c])).join(','));
  }
  return lines.join('\n');
}

export async function rowsToXLSX(rawRows: Record<string, any>[], sheetName = 'Report'): Promise<Buffer> {
  const rows = rawRows.map((r) => flattenRow(r));
  const columns = deriveColumns(rows);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ICT Inventory Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c, key: c, width: Math.max(c.length + 2, 14) }));
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  for (const row of rows) sheet.addRow(row);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function rowsToPDF(title: string, rawRows: Record<string, any>[]): Promise<Buffer> {
  const rows = rawRows.map((r) => flattenRow(r));
  const columns = deriveColumns(rows);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: columns.length > 6 ? 'landscape' : 'portrait' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { align: 'left' });
    doc.fontSize(9).fillColor('gray').text(`Generated ${new Date().toLocaleString()}`, { align: 'left' });
    doc.moveDown();

    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = usableWidth / Math.max(columns.length, 1);
    const rowHeight = 18;

    const drawRow = (values: string[], y: number, bold: boolean) => {
      doc.fontSize(8).fillColor('black').font(bold ? 'Helvetica-Bold' : 'Helvetica');
      values.forEach((v, i) => {
        doc.text(String(v ?? '').slice(0, 40), doc.page.margins.left + i * colWidth, y, {
          width: colWidth - 4,
          height: rowHeight,
          ellipsis: true,
        });
      });
    };

    let y = doc.y;
    drawRow(columns, y, true);
    y += rowHeight;
    doc.moveTo(doc.page.margins.left, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).stroke();

    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
        doc.addPage({ margin: 36, size: 'A4', layout: columns.length > 6 ? 'landscape' : 'portrait' });
        y = doc.page.margins.top;
        drawRow(columns, y, true);
        y += rowHeight;
      }
      drawRow(columns.map((c) => String(row[c] ?? '')), y, false);
      y += rowHeight;
    }

    doc.end();
  });
}
