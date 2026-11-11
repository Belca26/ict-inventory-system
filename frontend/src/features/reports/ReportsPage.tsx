import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';

interface ReportDef {
  key: string;
  label: string;
  description: string;
}

const REPORT_GROUPS: { group: string; reports: ReportDef[] }[] = [
  {
    group: 'Inventory',
    reports: [
      { key: 'inventory-by-type', label: 'By Asset Type', description: 'Count of desktops, laptops, printers, switches, etc.' },
      { key: 'inventory-by-department', label: 'By Department', description: 'Asset count and total value per department' },
      { key: 'inventory-by-building', label: 'By Building', description: 'Asset count per building' },
    ],
  },
  {
    group: 'Hardware',
    reports: [
      { key: 'hardware-ram-distribution', label: 'RAM Distribution', description: 'Computers grouped by RAM size' },
      { key: 'hardware-storage-distribution', label: 'Storage Distribution', description: 'Computers grouped by storage size/type' },
      { key: 'hardware-processor-distribution', label: 'Processor Distribution', description: 'Computers grouped by CPU' },
    ],
  },
  {
    group: 'Maintenance',
    reports: [
      { key: 'maintenance-summary', label: 'Summary (this month)', description: 'Maintenance jobs count for the period' },
      { key: 'maintenance-most-repaired', label: 'Most Repaired Assets', description: 'Assets serviced 3+ times' },
      { key: 'maintenance-overdue', label: 'Overdue Maintenance', description: 'Assets past their scheduled maintenance date' },
      { key: 'maintenance-average-repair-time', label: 'Average Repair Time', description: 'Average labour hours per completed job' },
      { key: 'maintenance-technician-performance', label: 'Technician Performance', description: 'Completed/pending/cancelled counts per technician' },
    ],
  },
  {
    group: 'Replacement',
    reports: [
      { key: 'replacement-warranty-expiring', label: 'Warranty Expiring Soon', description: 'Assets with warranty expiring within 90 days' },
      { key: 'replacement-aging', label: 'Aging Assets', description: 'Assets older than 5 years' },
      { key: 'replacement-recommendations', label: 'Replacement Recommendations', description: 'Aging AND frequently repaired assets' },
    ],
  },
  {
    group: 'Software & Network',
    reports: [
      { key: 'software-os-distribution', label: 'OS Distribution', description: 'Computers grouped by operating system' },
      { key: 'network-inventory', label: 'Network Device Inventory', description: 'Switches, routers, and APs — type, firmware, IP usage' },
    ],
  },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (reportKey: string, format: 'csv' | 'xlsx' | 'pdf') => {
    setDownloading(`${reportKey}-${format}`);
    try {
      const res = await apiClient.get(`/api/export/reports/${reportKey}`, {
        params: { format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportKey}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Every report is downloadable as CSV, Excel, or PDF. Also see the{' '}
          <a href="/" className="text-primary hover:underline">
            Dashboard
          </a>{' '}
          for live charts of the same data.
        </p>
      </div>

      {REPORT_GROUPS.map((section) => (
        <Card key={section.group}>
          <CardHeader>
            <CardTitle>{section.group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.reports.map((report) => (
              <div key={report.key} className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{report.label}</p>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
                <div className="flex gap-1.5">
                  {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
                    <Button
                      key={format}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(report.key, format)}
                      disabled={downloading === `${report.key}-${format}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Full Data Exports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm">Complete asset inventory (all filters, up to 10,000 rows)</p>
            <div className="flex gap-1.5">
              {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setDownloading(`assets-${format}`);
                    try {
                      const res = await apiClient.get('/api/export/assets', { params: { format }, responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `assets.${format}`;
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } finally {
                      setDownloading(null);
                    }
                  }}
                  disabled={downloading === `assets-${format}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
