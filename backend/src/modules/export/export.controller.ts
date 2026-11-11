import { Request, Response, NextFunction } from 'express';
import { rowsToCSV, rowsToXLSX, rowsToPDF } from '../../utils/tabular';
import { REPORT_REGISTRY, normalizeToRows } from './export.service';
import { searchAssets } from '../search/search.service';
import { listMaintenanceRecords } from '../maintenance/maintenance.service';

type Format = 'csv' | 'xlsx' | 'pdf';

function contextFrom(req: Request) {
  return {
    userId: req.user!.sub,
    role: req.user!.role,
    departmentId: req.user!.departmentId,
  };
}

async function sendTabular(res: Response, format: Format, filename: string, title: string, rows: Record<string, any>[]) {
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(rowsToCSV(rows));
  }
  if (format === 'xlsx') {
    const buffer = await rowsToXLSX(rows, title.slice(0, 31)); // Excel sheet name limit
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(buffer);
  }
  if (format === 'pdf') {
    const buffer = await rowsToPDF(title, rows);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    return res.send(buffer);
  }
  res.status(400).json({ error: 'format must be csv, xlsx, or pdf' });
}

function parseFormat(req: Request): Format | null {
  const format = (req.query.format as string)?.toLowerCase();
  return ['csv', 'xlsx', 'pdf'].includes(format) ? (format as Format) : null;
}

export async function exportReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const format = parseFormat(req);
    if (!format) return res.status(400).json({ error: 'Query param "format" must be csv, xlsx, or pdf' });

    const reportKey = req.params.reportKey;
    const reportFn = REPORT_REGISTRY[reportKey];
    if (!reportFn) {
      return res.status(404).json({
        error: `Unknown report "${reportKey}"`,
        availableReports: Object.keys(REPORT_REGISTRY),
      });
    }

    const result = await reportFn(contextFrom(req), req.query as Record<string, string>);
    const rows = normalizeToRows(result);
    await sendTabular(res, format, reportKey, reportKey.replace(/-/g, ' '), rows);
  } catch (err) {
    next(err);
  }
}

export async function exportAssetsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const format = parseFormat(req);
    if (!format) return res.status(400).json({ error: 'Query param "format" must be csv, xlsx, or pdf' });

    // Exports are not paginated the way the UI list view is — pull up to
    // 10,000 rows in one go. If the inventory ever exceeds that, this should
    // move to a streamed/chunked export instead of one in-memory pass.
    const query = { ...req.query, page: 1, pageSize: 10000 };
    const { items } = await searchAssets(query, contextFrom(req));
    await sendTabular(res, format, 'assets', 'Asset Inventory', items);
  } catch (err) {
    next(err);
  }
}

export async function exportMaintenanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const format = parseFormat(req);
    if (!format) return res.status(400).json({ error: 'Query param "format" must be csv, xlsx, or pdf' });

    const query = { ...req.query, page: 1, pageSize: 10000, sortDir: req.query.sortDir || 'desc' };
    const { items } = await listMaintenanceRecords(query, contextFrom(req));
    await sendTabular(res, format, 'maintenance-records', 'Maintenance Records', items);
  } catch (err) {
    next(err);
  }
}
