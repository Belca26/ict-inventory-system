import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge, statusTone } from '@/components/ui/badge';
import { Table, THead, TRow, TH, TD } from '@/components/ui/table';
import { useAssetSearch, type SearchFilters } from '@/api/search';

const CATEGORY_OPTIONS = ['COMPUTER', 'NETWORK_DEVICE', 'PRINTER', 'UPS', 'PROJECTOR', 'SCANNER', 'OTHER'];

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({ page: 1, pageSize: 25 });
  const [hasSearched, setHasSearched] = useState(false);
  const { data, isLoading } = useAssetSearch(filters, hasSearched);

  const runSearch = () => {
    setFilters((f) => ({ ...f, page: 1 }));
    setHasSearched(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across every asset property — RAM, storage, OS, department, status, and more.
        </p>
      </div>

      <Card className="space-y-3 p-4">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tag, serial, model, vendor…"
            className="pl-8"
            value={filters.q ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined }))}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
            value={filters.deviceCategory ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, deviceCategory: e.target.value || undefined }))}
          >
            <option value="">Any device category</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <Input
            type="number"
            placeholder="Min RAM (GB)"
            className="w-36"
            value={filters.ramGbMin ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, ramGbMin: e.target.value ? Number(e.target.value) : undefined }))}
          />

          <Input
            placeholder="OS (e.g. Windows 11)"
            className="w-48"
            value={filters.os ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, os: e.target.value || undefined }))}
          />

          <Button onClick={runSearch}>Search</Button>
        </div>
      </Card>

      {hasSearched && (
        <>
          <Table>
            <THead>
              <TRow>
                <TH>Asset Tag</TH>
                <TH>Type</TH>
                <TH>Model</TH>
                <TH>Department</TH>
                <TH>Status</TH>
              </TRow>
            </THead>
            <tbody>
              {isLoading && (
                <TRow>
                  <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                    Searching…
                  </TD>
                </TRow>
              )}
              {!isLoading && data?.items.length === 0 && (
                <TRow>
                  <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                    No assets match this search.
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
                </TRow>
              ))}
            </tbody>
          </Table>

          {data && (
            <p className="text-sm text-muted-foreground">
              {data.pagination.total} result{data.pagination.total === 1 ? '' : 's'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
