import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { useAsset } from '@/api/assets';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: asset, isLoading } = useAsset(id);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!asset) return <p className="text-sm text-muted-foreground">Asset not found.</p>;

  return (
    <div className="space-y-6">
      <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="asset-tag text-2xl font-semibold">{asset.assetTag}</h1>
          <p className="text-sm text-muted-foreground">
            {asset.assetType.name} {asset.model ? `— ${asset.model}` : ''}
          </p>
        </div>
        <Badge tone={statusTone(asset.status)} className="text-sm">
          {asset.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Serial Number" value={asset.serialNumber} mono />
            <Row label="Manufacturer" value={asset.manufacturer?.name} />
            <Row label="Department" value={asset.department?.name} />
            <Row label="Purchase Date" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : null} />
            <Row label="Warranty Expiry" value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : null} />
            <Row label="Cost" value={asset.cost != null ? `KES ${asset.cost.toLocaleString()}` : null} />
          </CardContent>
        </Card>

        {asset.computerSpec && (
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="CPU" value={asset.computerSpec.cpu} />
              <Row label="RAM" value={asset.computerSpec.ramGb ? `${asset.computerSpec.ramGb} GB` : null} />
              <Row label="Storage" value={asset.computerSpec.storageGb ? `${asset.computerSpec.storageGb} GB` : null} />
              <Row label="OS" value={asset.computerSpec.os} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Full maintenance record list/timeline renders here — wire to{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /api/maintenance?assetId={'{'}asset.id{'}'}</code>{' '}
            using the same <code className="rounded bg-muted px-1 py-0.5 text-xs">useQuery</code> pattern as{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">useAssets</code> above once the Maintenance
            feature page is built out.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value ?? '—'}</span>
    </div>
  );
}
