import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { DashboardSummary } from '@/types';

interface ChartPoint {
  label: string;
  value: number;
}
interface DashboardCharts {
  assetsByDepartment: ChartPoint[];
  assetsByStatus: ChartPoint[];
  assetsByRam: ChartPoint[];
  monthlyMaintenanceTrend: { month: string; count: number }[];
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await apiClient.get<DashboardSummary>('/api/dashboard/summary')).data,
    refetchInterval: 60_000, // dashboard numbers drift as jobs complete — refresh every minute
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => (await apiClient.get<DashboardCharts>('/api/dashboard/charts')).data,
  });
}
