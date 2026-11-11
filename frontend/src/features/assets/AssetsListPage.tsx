import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge, statusTone } from '@/components/ui/badge';
import { Table, THead, TRow, TH, TD } from '@/components/ui/table';
import { useAssets, useAssetTypes, useDepartments, type AssetFilters } from '@/api/assets';
import { useAuth } from '@/features/auth/AuthContext';

const STATUS_OPTIONS = ['ACTIVE', 'FAULTY', 'UNDER_MAINTENANCE', 'RETIRED', 'LOST', 'DISPOSED'];

export default function AssetsListPage() {
  const { hasRole } = useAuth();
  const [filters, setFilters] = useState<AssetFilters>({ page: 1, pageSize: 25 });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useAssets(filters);
  const { data: assetTypes } = useAssetTypes();
  const { data: departments } = useDepartments();

  const applySearch = () => setFilters((f) => ({ ...f, page: 1, search: searchInput || undefined }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Assets</h1>
          <p className="text-sm text-muted-foreground">{data?.pagination.total ?? '—'} assets in inventory</p>
        </div>
        {hasRole('SYSTEM_ADMIN', 'ICT_TECHNICIAN') && (
          <Link to="/assets/new">
            <Button>Register Asset</Button>
          </Link>
        )}
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tag, serial, or model…"
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>

          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, page: 1, status: e.target.value || undefined }))}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.assetTypeId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, page: 1, assetTypeId: e.target.value || undefined }))}
          >
            <option value="">All asset types</option>
            {assetTypes?.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.departmentId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, page: 1, departmentId: e.target.value || undefined }))}
          >
            <option value="">All departments</option>
            {departments?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={applySearch}>
            Apply
          </Button>
        </div>
      </Card>

      <Table>
        <THead>
          <TRow>
            <TH>Asset Tag</TH>
            <TH>Type</TH>
            <TH>Model</TH>
            <TH>Department</TH>
            <TH>Status</TH>
            <TH>Warranty Expiry</TH>
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
                No assets match these filters.
              </TD>
            </TRow>
          )}
          {data?.items.map((asset) => (
            <TRow key={asset.id}>
              <TD>
                <Link to={`/assets/${asset.id}`} className="asset-tag font-medium text-primary hover:underline">
                  {asset.assetTag}
                </Link>
              </TD>
              <TD>{asset.assetType.name}</TD>
              <TD>{asset.model ?? '—'}</TD>
              <TD>{asset.department?.name ?? '—'}</TD>
              <TD>
                <Badge tone={statusTone(asset.status)}>{asset.status.replace(/_/g, ' ')}</Badge>
              </TD>
              <TD className="font-mono text-xs">
                {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '—'}
              </TD>
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
