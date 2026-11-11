import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Asset, PaginatedResult } from '@/types';

export interface AssetFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  assetTypeId?: string;
  departmentId?: string;
}

export function useAssets(filters: AssetFilters) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => (await apiClient.get<PaginatedResult<Asset>>('/api/assets', { params: filters })).data,
    placeholderData: (previousData) => previousData, // keeps the table visible while paging instead of flashing empty
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => (await apiClient.get<Asset>(`/api/assets/${id}`)).data,
    enabled: !!id,
  });
}

export function useAssetTypes() {
  return useQuery({
    queryKey: ['reference', 'asset-types'],
    queryFn: async () => (await apiClient.get('/api/reference/asset-types')).data,
    staleTime: 5 * 60_000, // reference data changes rarely
  });
}

export function useManufacturers() {
  return useQuery({
    queryKey: ['reference', 'manufacturers'],
    queryFn: async () => (await apiClient.get('/api/reference/manufacturers')).data,
    staleTime: 5 * 60_000,
  });
}

export function useBuildings() {
  return useQuery({
    queryKey: ['reference', 'buildings'],
    queryFn: async () => (await apiClient.get('/api/reference/buildings')).data,
    staleTime: 5 * 60_000,
  });
}

export function useRooms(buildingId: string | undefined) {
  return useQuery({
    queryKey: ['reference', 'rooms', buildingId],
    queryFn: async () => (await apiClient.get('/api/reference/rooms', { params: { buildingId } })).data,
    enabled: !!buildingId,
    staleTime: 5 * 60_000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['reference', 'departments'],
    queryFn: async () => (await apiClient.get('/api/departments')).data,
    staleTime: 5 * 60_000,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await apiClient.post('/api/assets', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });
}
