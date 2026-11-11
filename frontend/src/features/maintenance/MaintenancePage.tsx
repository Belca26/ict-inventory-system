import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, statusTone } from '@/components/ui/badge';
import { Table, THead, TRow, TH, TD } from '@/components/ui/table';
import { useMaintenanceRecords, type MaintenanceFilters } from '@/api/maintenance';
import { useAuth } from '@/features/auth/AuthContext';

const STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'CANCELLED'];
const TYPE_OPTIONS = ['ROUTINE', 'CORRECTIVE', 'PREVENTIVE', 'EMERGENCY'];

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const [filters, setFilters] = useState<MaintenanceFilters>({ page: 1, pageSize: 25 });
  const { data, isLoading } = useMaintenanceRecords(filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Maintenance Records</h1>
          <p className="text-sm text-muted-foreground">{data?.pagination.total ?? '—'} records</p>
        </div>
        {hasRole('SYSTEM_ADMIN', 'ICT_TECHNICIAN') && (
          <Link to="/maintenance/new">
            <Button>Open Maintenance Job</Button>
          </Link>
        )}
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, page: 1, status: e.target.value || undefined }))}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.maintenanceType ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, page: 1, maintenanceType: e.target.value || undefined }))}
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, page: 1, dateFrom: e.target.value || undefined }))}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            type="date"
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, page: 1, dateTo: e.target.value || undefined }))}
          />
        </div>
      </Card>

      <Table>
        <THead>
          <TRow>
            <TH>Asset</TH>
            <TH>Type</TH>
            <TH>Technician</TH>
            <TH>Status</TH>
            <TH>Opened</TH>
            <TH>Labour Hours</TH>
          </TRow>
        </THead>
        <tbody>
          {isLoading && (
            <TRow>
              <TD colSpan={6} className="py-8 text-center text-muted-foreground">
                Loading…
              </TD>
            </TRow>
          )}
          {!isLoading && data?.items.length === 0 && (
            <TRow>
              <TD colSpan={6} className="py-8 text-center text-muted-foreground">
                No maintenance records match these filters.
              </TD>
            </TRow>
          )}
          {data?.items.map((record) => (
            <TRow key={record.id}>
              <TD>
                <Link to={`/maintenance/${record.id}`} className="asset-tag font-medium text-primary hover:underline">
                  {record.asset.assetTag}
                </Link>
              </TD>
              <TD>{record.maintenanceType}</TD>
              <TD>
                {record.technician.firstName} {record.technician.lastName}
              </TD>
              <TD>
                <Badge tone={statusTone(record.status)}>{record.status}</Badge>
              </TD>
              <TD className="font-mono text-xs">{new Date(record.createdAt).toLocaleDateString()}</TD>
              <TD>{record.labourHours ?? '—'}</TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page === data.pagination.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
