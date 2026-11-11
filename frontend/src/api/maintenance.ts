import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { MaintenanceRecord, PaginatedResult } from '@/types';

export interface MaintenanceFilters {
  page?: number;
  pageSize?: number;
  assetId?: string;
  technicianId?: string;
  departmentId?: string;
  maintenanceType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useMaintenanceRecords(filters: MaintenanceFilters) {
  return useQuery({
    queryKey: ['maintenance', filters],
    queryFn: async () =>
      (await apiClient.get<PaginatedResult<MaintenanceRecord>>('/api/maintenance', { params: filters })).data,
    placeholderData: (previousData) => previousData,
  });
}

export function useMaintenanceRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => (await apiClient.get<MaintenanceRecord>(`/api/maintenance/${id}`)).data,
    enabled: !!id,
  });
}

export function useProcedureTypes() {
  return useQuery({
    queryKey: ['reference', 'procedure-types'],
    queryFn: async () => (await apiClient.get('/api/reference/procedure-types')).data,
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations — each invalidates the relevant cached queries on success so the
// UI reflects the change immediately without a manual refetch call at the
// call site.
// ---------------------------------------------------------------------------

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await apiClient.post('/api/maintenance', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] }); // asset.status may have flipped to UNDER_MAINTENANCE
    },
  });
}

export function useUpdateMaintenanceRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await apiClient.patch(`/api/maintenance/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useAddProcedures(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (procedures: { procedureTypeId: string; customLabel?: string }[]) =>
      (await apiClient.post(`/api/maintenance/${id}/procedures`, { procedures })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  });
}

export function useAddParts(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (parts: { partName: string; quantity: number; cost?: number }[]) =>
      (await apiClient.post(`/api/maintenance/${id}/parts`, { parts })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  });
}

export function useUploadAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await apiClient.post(`/api/maintenance/${id}/attachments`, formData)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  });
}

export function useSignMaintenanceRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (signatureImagePath: string) =>
      (await apiClient.post(`/api/maintenance/${id}/signatures`, { signatureImagePath })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  });
}
