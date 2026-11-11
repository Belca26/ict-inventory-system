import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Asset, PaginatedResult } from '@/types';

export interface SearchFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  deviceCategory?: string;
  ramGbMin?: number;
  os?: string;
  departmentId?: string;
  status?: string;
}

export function useAssetSearch(filters: SearchFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['search', 'assets', filters],
    queryFn: async () =>
      (await apiClient.get<PaginatedResult<Asset>>('/api/search/assets', { params: filters })).data,
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
