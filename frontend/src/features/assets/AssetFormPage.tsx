import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useCreateAsset,
  useAssetTypes,
  useManufacturers,
  useBuildings,
  useRooms,
  useDepartments,
} from '@/api/assets';

// Mirrors the backend's createAssetSchema shape (asset.schema.ts) — kept in
// sync manually since frontend/backend are separate projects; if the backend
// schema changes, update this one too.
const assetFormSchema = z.object({
  assetTag: z.string().min(3, 'Asset tag (UOE Tag Number) is required'),
  serialNumber: z.string().optional(),
  assetTypeId: z.string().min(1, 'Select an asset type'),
  manufacturerId: z.string().optional(),
  model: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  vendor: z.string().optional(),
  cost: z.string().optional(),
  departmentId: z.string().optional(),
  buildingId: z.string().optional(),
  roomId: z.string().optional(),
  campus: z.string().optional(),

  // Computer spec fields — only sent if the selected asset type is a computer
  cpu: z.string().optional(),
  ramGb: z.string().optional(),
  storageGb: z.string().optional(),
  storageType: z.string().optional(),
  os: z.string().optional(),

  // Network device spec fields
  numberOfPorts: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  firmwareVersion: z.string().optional(),

  // Printer spec fields
  printerType: z.string().optional(),
  tonerModel: z.string().optional(),
});
type AssetFormValues = z.infer<typeof assetFormSchema>;

export default function AssetFormPage() {
  const navigate = useNavigate();
  const createAsset = useCreateAsset();
  const { data: assetTypes } = useAssetTypes();
  const { data: manufacturers } = useManufacturers();
  const { data: buildings } = useBuildings();
  const { data: departments } = useDepartments();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');

  const { data: rooms } = useRooms(selectedBuildingId || undefined);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({ resolver: zodResolver(assetFormSchema) });

  const selectedAssetTypeId = watch('assetTypeId');
  const selectedCategory: string | undefined = assetTypes?.find((t: any) => t.id === selectedAssetTypeId)?.category;

  const onSubmit = async (values: AssetFormValues) => {
    setServerError(null);

    const payload: Record<string, unknown> = {
      assetTag: values.assetTag,
      serialNumber: values.serialNumber || undefined,
      assetTypeId: values.assetTypeId,
      manufacturerId: values.manufacturerId || undefined,
      model: values.model || undefined,
      purchaseDate: values.purchaseDate || undefined,
      warrantyExpiry: values.warrantyExpiry || undefined,
      vendor: values.vendor || undefined,
      cost: values.cost ? Number(values.cost) : undefined,
      departmentId: values.departmentId || undefined,
      buildingId: values.buildingId || undefined,
      roomId: values.roomId || undefined,
      campus: values.campus || undefined,
    };

    if (selectedCategory === 'COMPUTER') {
      payload.computerSpec = {
        cpu: values.cpu || undefined,
        ramGb: values.ramGb ? Number(values.ramGb) : undefined,
        storageGb: values.storageGb ? Number(values.storageGb) : undefined,
        storageType: values.storageType || undefined,
        os: values.os || undefined,
      };
    } else if (selectedCategory === 'NETWORK_DEVICE') {
      payload.networkDeviceSpec = {
        numberOfPorts: values.numberOfPorts ? Number(values.numberOfPorts) : undefined,
        ipAddress: values.ipAddress || undefined,
        macAddress: values.macAddress || undefined,
        firmwareVersion: values.firmwareVersion || undefined,
      };
    } else if (selectedCategory === 'PRINTER') {
      payload.printerSpec = {
        printerType: values.printerType || undefined,
        tonerModel: values.tonerModel || undefined,
      };
    }

    try {
      const asset = await createAsset.mutateAsync(payload);
      navigate(`/assets/${asset.id}`);
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Failed to register asset. Check the fields and try again.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>

      <h1 className="text-xl font-semibold">Register Asset</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Asset Tag (UOE Tag Number)" error={errors.assetTag?.message}>
              <Input {...register('assetTag')} placeholder="UOE-ICT-00123" />
            </Field>
            <Field label="Serial Number">
              <Input {...register('serialNumber')} />
            </Field>

            <Field label="Asset Type" error={errors.assetTypeId?.message}>
              <select className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm" {...register('assetTypeId')}>
                <option value="">Select…</option>
                {assetTypes?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Manufacturer">
              <select className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm" {...register('manufacturerId')}>
                <option value="">Select…</option>
                {manufacturers?.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Model">
              <Input {...register('model')} />
            </Field>
            <Field label="Vendor">
              <Input {...register('vendor')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase & Warranty</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Purchase Date">
              <Input type="date" {...register('purchaseDate')} />
            </Field>
            <Field label="Warranty Expiry">
              <Input type="date" {...register('warrantyExpiry')} />
            </Field>
            <Field label="Cost (KES)">
              <Input type="number" step="0.01" {...register('cost')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm" {...register('departmentId')}>
                <option value="">Select…</option>
                {departments?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Campus">
              <Input {...register('campus')} />
            </Field>
            <Field label="Building">
              <select
                className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
                {...register('buildingId')}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
              >
                <option value="">Select…</option>
                {buildings?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room">
              <select className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm" {...register('roomId')} disabled={!selectedBuildingId}>
                <option value="">Select…</option>
                {rooms?.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>

        {selectedCategory === 'COMPUTER' && (
          <Card>
            <CardHeader>
              <CardTitle>Computer Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="CPU">
                <Input {...register('cpu')} placeholder="Intel Core i5 10th Gen" />
              </Field>
              <Field label="RAM (GB)">
                <Input type="number" {...register('ramGb')} />
              </Field>
              <Field label="Storage (GB)">
                <Input type="number" {...register('storageGb')} />
              </Field>
              <Field label="Storage Type">
                <Input {...register('storageType')} placeholder="SSD / HDD / NVMe" />
              </Field>
              <Field label="Operating System">
                <Input {...register('os')} placeholder="Windows 11" />
              </Field>
            </CardContent>
          </Card>
        )}

        {selectedCategory === 'NETWORK_DEVICE' && (
          <Card>
            <CardHeader>
              <CardTitle>Network Device Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Number of Ports">
                <Input type="number" {...register('numberOfPorts')} />
              </Field>
              <Field label="Firmware Version">
                <Input {...register('firmwareVersion')} />
              </Field>
              <Field label="IP Address">
                <Input {...register('ipAddress')} placeholder="192.168.1.1" />
              </Field>
              <Field label="MAC Address">
                <Input {...register('macAddress')} placeholder="AA:BB:CC:DD:EE:FF" />
              </Field>
            </CardContent>
          </Card>
        )}

        {selectedCategory === 'PRINTER' && (
          <Card>
            <CardHeader>
              <CardTitle>Printer Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Printer Type">
                <Input {...register('printerType')} placeholder="Laser / Inkjet" />
              </Field>
              <Field label="Toner Model">
                <Input {...register('tonerModel')} />
              </Field>
            </CardContent>
          </Card>
        )}

        {serverError && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>}

        <div className="flex justify-end gap-2">
          <Link to="/assets">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering…' : 'Register Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
