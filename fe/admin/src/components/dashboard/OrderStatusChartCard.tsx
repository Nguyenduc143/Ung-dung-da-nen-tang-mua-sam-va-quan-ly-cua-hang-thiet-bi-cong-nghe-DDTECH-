import { Card, Empty, Skeleton } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DashboardOrdersByStatus } from '../../types/dashboard';
import { orderStatusLabels } from '../../utils/orderPresentation';

interface OrderStatusChartCardProps {
  data: DashboardOrdersByStatus | null;
  loading: boolean;
}

export function OrderStatusChartCard({ data, loading }: OrderStatusChartCardProps) {
  const chartData = data?.statuses.map((item) => ({
    ...item,
    label: orderStatusLabels[item.status],
  })) ?? [];

  return (
    <Card
      className="dashboard-panel dashboard-status-card"
      bordered={false}
      title="Đơn hàng theo trạng thái"
      extra={data ? `${data.total} đơn` : undefined}
    >
      {loading ? <Skeleton active /> : chartData.length ? (
        <div className="dashboard-chart dashboard-chart--status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`${Number(value)} đơn`, 'Số lượng']} />
              <Bar dataKey="ordersCount" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <Empty description="Chưa có đơn hàng" />}
    </Card>
  );
}
