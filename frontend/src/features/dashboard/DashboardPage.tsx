import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDashboardSummary, useDashboardCharts } from '@/api/dashboard';

const SUMMARY_CARDS: { key: string; label: string }[] = [
  { key: 'totalAssets', label: 'Total Assets' },
  { key: 'underMaintenance', label: 'Under Maintenance' },
  { key: 'completedToday', label: 'Completed Today' },
  { key: 'pendingJobs', label: 'Pending Jobs' },
  { key: 'overdueMaintenance', label: 'Overdue Maintenance' },
  { key: 'departments', label: 'Departments' },
  { key: 'technicians', label: 'Technicians' },
];

const PIE_COLORS = ['hsl(193,55%,22%)', 'hsl(193,40%,55%)', 'hsl(32,85%,55%)', 'hsl(152,45%,42%)', 'hsl(0,65%,58%)', 'hsl(215,14%,62%)'];

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of the ICT asset inventory and maintenance workload.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.key}>
            <CardHeader>
              <CardTitle>{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-2xl font-semibold">
                {summaryLoading ? '—' : ((summary as Record<string, number> | undefined)?.[card.key] ?? 0)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {!chartsLoading && charts && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.assetsByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,15%,90%)" />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(193,55%,22%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {!chartsLoading && charts && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.assetsByStatus} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80}>
                    {charts.assetsByStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Maintenance Trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {!chartsLoading && charts && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthlyMaintenanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,15%,90%)" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(193,55%,22%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
