import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateMaintenanceRecord, useProcedureTypes } from '@/api/maintenance';
import { useAssets } from '@/api/assets';

const jobFormSchema = z.object({
  assetId: z.string().min(1, 'Select an asset'),
  maintenanceType: z.enum(['ROUTINE', 'CORRECTIVE', 'PREVENTIVE', 'EMERGENCY']),
  technicianNotes: z.string().optional(),
  timeStarted: z.string().optional(),
});
type JobFormValues = z.infer<typeof jobFormSchema>;

export default function MaintenanceFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('assetId') ?? '';

  const createRecord = useCreateMaintenanceRecord();
  const { data: procedureTypes } = useProcedureTypes();
  const [assetSearch, setAssetSearch] = useState('');
  const { data: assetResults } = useAssets({ search: assetSearch || undefined, pageSize: 10 });
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<Set<string>>(new Set());
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: { assetId: preselectedAssetId, maintenanceType: 'CORRECTIVE' },
  });

  const selectedAssetId = watch('assetId');
  const selectedAsset = assetResults?.items.find((a) => a.id === selectedAssetId);

  const toggleProcedure = (id: string) => {
    setSelectedProcedureIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onSubmit = async (values: JobFormValues) => {
    setServerError(null);
    try {
      const record = await createRecord.mutateAsync({
        assetId: values.assetId,
        maintenanceType: values.maintenanceType,
        technicianNotes: values.technicianNotes || undefined,
        timeStarted: values.timeStarted || new Date().toISOString(),
        procedures: Array.from(selectedProcedureIds).map((procedureTypeId) => ({ procedureTypeId })),
      });
      navigate(`/maintenance/${record.id}`);
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Failed to open the maintenance job.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/maintenance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Maintenance
      </Link>

      <h1 className="text-xl font-semibold">Open Maintenance Job</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedAsset ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="asset-tag text-sm font-medium">{selectedAsset.assetTag}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setValue('assetId', '')}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search by asset tag, serial, or model…"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
                {assetSearch && (
                  <div className="max-h-48 space-y-1 overflow-auto rounded-md border border-border p-1">
                    {assetResults?.items.length === 0 && (
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">No matching assets.</p>
                    )}
                    {assetResults?.items.map((asset) => (
                      <button
                        type="button"
                        key={asset.id}
                        onClick={() => {
                          setValue('assetId', asset.id);
                          setAssetSearch('');
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="asset-tag">{asset.assetTag}</span>
                        <span className="text-muted-foreground">{asset.model}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {errors.assetId && <p className="text-xs text-destructive">{errors.assetId.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Maintenance Type</label>
              <select className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm" {...register('maintenanceType')}>
                <option value="ROUTINE">Routine</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="PREVENTIVE">Preventive</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Technician Notes</label>
              <textarea
                className="min-h-20 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                {...register('technicianNotes')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Procedures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {procedureTypes
                ?.filter((p: any) => !p.isCustom)
                .map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedProcedureIds.has(p.id)}
                      onChange={() => toggleProcedure(p.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {p.name}
                  </label>
                ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Custom (non-checklist) procedures and parts can be added from the job's detail page after it's created.
            </p>
          </CardContent>
        </Card>

        {serverError && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>}

        <div className="flex justify-end gap-2">
          <Link to="/maintenance">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Opening…' : 'Open Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
