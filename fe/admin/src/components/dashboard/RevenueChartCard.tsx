import { Card, Segmented, Skeleton, Space, Statistic } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DashboardRevenue, RevenuePeriod } from '../../types/dashboard';
import { formatMoney } from '../../utils/orderPresentation';
import { DateRangeFilter, EmptyState, ErrorState } from '../shared';

export type RevenueRange = RevenuePeriod | 'custom';

interface RevenueChartCardProps {
  data: DashboardRevenue | null;
  loading: boolean;
  error: string | null;
  range: RevenueRange;
  customRange: [Dayjs, Dayjs];
  onRangeChange: (range: RevenueRange) => void;
  onCustomRangeChange: (range: [Dayjs, Dayjs]) => void;
}

const compactMoney = (value: number) => new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(value);

export function RevenueChartCard({
  data,
  loading,
  error,
  range,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: RevenueChartCardProps) {
  const chartData = data?.points.map((point) => ({
    ...point,
    displayLabel: data.groupBy === 'MONTH'
      ? dayjs(`${point.label}-01`).format('MM/YYYY')
      : dayjs(point.label).format('DD/MM'),
  })) ?? [];

  return (
    <Card
      className="dashboard-panel dashboard-revenue-card"
      bordered={false}
      title="Doanh thu"
      extra={(
        <Space wrap>
          <Segmented<RevenueRange>
            value={range}
            options={[
              { value: '7d', label: '7 ngày' },
              { value: '30d', label: '30 ngày' },
              { value: '12m', label: '12 tháng' },
              { value: 'custom', label: 'Tùy chọn' },
            ]}
            onChange={onRangeChange}
          />
          {range === 'custom' && (
            <DateRangeFilter
              value={customRange}
              maxDays={366}
              onChange={onCustomRangeChange}
            />
          )}
        </Space>
      )}
    >
      {error && <ErrorState message={error} />}
      {loading ? <Skeleton active /> : data ? (
        <>
          <div className="dashboard-chart-summary">
            <Statistic title="Doanh thu trong kỳ" value={formatMoney.format(data.totalRevenue)} />
            <Statistic title="Đơn đã giao" value={data.ordersCount} suffix="đơn" />
          </div>
          {chartData.length ? (
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tickFormatter={(value: number) => compactMoney(value)} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={65} />
                  <Tooltip formatter={(value) => [formatMoney.format(Number(value)), 'Doanh thu']} labelFormatter={(label) => `Thời gian: ${label}`} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState description="Chưa có dữ liệu doanh thu" />}
        </>
      ) : <EmptyState description="Không có dữ liệu doanh thu" />}
    </Card>
  );
}
