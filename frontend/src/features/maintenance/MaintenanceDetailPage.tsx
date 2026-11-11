import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useMaintenanceRecord,
  useUpdateMaintenanceRecord,
  useUploadAttachment,
  useSignMaintenanceRecord,
} from '@/api/maintenance';
import { useAuth } from '@/features/auth/AuthContext';

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: record, isLoading } = useMaintenanceRecord(id);
  const { hasRole, user } = useAuth();
  const updateRecord = useUpdateMaintenanceRecord(id!);
  const uploadAttachment = useUploadAttachment(id!);
  const signRecord = useSignMaintenanceRecord(id!);
  const [uploading, setUploading] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!record) return <p className="text-sm text-muted-foreground">Maintenance record not found.</p>;

  const canEdit = hasRole('SYSTEM_ADMIN', 'ICT_TECHNICIAN');
  const canSignAsDeptRep = hasRole('DEPARTMENT_REPRESENTATIVE') && record.status === 'COMPLETED';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAttachment.mutateAsync(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // A signature is a base64 canvas export in the real form flow. Placeholder
  // here submits a text marker — swap for an actual signature-pad component
  // (e.g. react-signature-canvas) when building this out further.
  const handleSign = () => {
    signRecord.mutate(`signed-by-${user?.id}-${new Date().toISOString()}`);
  };

  return (
    <div className="space-y-6">
      <Link to="/maintenance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Maintenance
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {record.maintenanceType} —{' '}
            <Link to={`/assets/${record.asset.id}`} className="asset-tag text-primary hover:underline">
              {record.asset.assetTag}
            </Link>
          </h1>
          <p className="text-sm text-muted-foreground">
            Opened by {record.technician.firstName} {record.technician.lastName} on{' '}
            {new Date(record.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge tone={statusTone(record.status)} className="text-sm">
          {record.status}
        </Badge>
      </div>

      {canEdit && record.status === 'PENDING' && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">Mark this job complete once the work is finished.</p>
            <Button
              onClick={() => updateRecord.mutate({ status: 'COMPLETED', timeFinished: new Date().toISOString() })}
              disabled={updateRecord.isPending}
            >
              {updateRecord.isPending ? 'Saving…' : 'Mark Completed'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Procedures Performed</CardTitle>
          </CardHeader>
          <CardContent>
            {record.procedures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No procedures logged yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {record.procedures.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {p.customLabel || p.procedureType.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parts Used</CardTitle>
          </CardHeader>
          <CardContent>
            {record.parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parts logged yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {record.parts.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>
                      {p.partName} × {p.quantity}
                    </span>
                    {p.cost != null && <span className="font-mono text-muted-foreground">KES {p.cost.toLocaleString()}</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Technician notes: </span>
            {record.technicianNotes || '—'}
          </p>
          <p>
            <span className="font-medium">Recommendations: </span>
            {record.recommendations || '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos, invoices, or reports attached yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {record.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>{a.fileName}</span>
                  <Badge tone="muted">{a.type.replace(/_/g, ' ')}</Badge>
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload photo, invoice, or PDF report'}
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-off</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {record.signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signatures yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {record.signatures.map((s) => (
                <li key={s.id}>
                  {s.signerRole.replace(/_/g, ' ')} — {s.signerUser.firstName} {s.signerUser.lastName} on{' '}
                  {new Date(s.signedAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}

          {(canEdit || canSignAsDeptRep) && (
            <Button variant="outline" onClick={handleSign} disabled={signRecord.isPending}>
              {signRecord.isPending ? 'Signing…' : 'Sign this record'}
            </Button>
          )}
          {hasRole('DEPARTMENT_REPRESENTATIVE') && record.status !== 'COMPLETED' && (
            <p className="text-xs text-muted-foreground">
              You can confirm this job once the technician marks it Completed.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
