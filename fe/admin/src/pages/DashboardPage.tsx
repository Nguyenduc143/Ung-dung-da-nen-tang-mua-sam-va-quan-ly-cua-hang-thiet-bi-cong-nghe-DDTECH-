import { ReloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as dashboardApi from '../api/dashboardApi';
import { DashboardDataTables } from '../components/dashboard/DashboardDataTables';
import { DashboardSummaryCards } from '../components/dashboard/DashboardSummaryCards';
import { OrderStatusChartCard } from '../components/dashboard/OrderStatusChartCard';
import { RevenueChartCard, type RevenueRange } from '../components/dashboard/RevenueChartCard';
import { ErrorState, PageHeader } from '../components/shared';
import { useAuthStore } from '../stores/authStore';
import type {
  DashboardOrdersByStatus,
  DashboardRecentOrder,
  DashboardRevenue,
  DashboardSummary,
  DashboardTopProduct,
  RevenueQuery,
} from '../types/dashboard';
import type { LowStockItem } from '../types/inventory';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<DashboardOrdersByStatus | null>(null);
  const [topProducts, setTopProducts] = useState<DashboardTopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<DashboardRecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [revenueRange, setRevenueRange] = useState<RevenueRange>('7d');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [revenue, setRevenue] = useState<DashboardRevenue | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const revenueQuery = useMemo<RevenueQuery>(() => (
    revenueRange === 'custom'
      ? { from: customRange[0].format('YYYY-MM-DD'), to: customRange[1].format('YYYY-MM-DD') }
      : { period: revenueRange }
  ), [customRange, revenueRange]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [summaryData, statusData, productData, orderData, stockData] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getOrdersByStatus(),
        dashboardApi.getTopProducts(8),
        dashboardApi.getRecentOrders(8),
        dashboardApi.getLowStock(5),
      ]);
      setSummary(summaryData);
      setOrdersByStatus(statusData);
      setTopProducts(productData.products);
      setRecentOrders(orderData.orders);
      setLowStockItems(stockData.items);
    } catch (requestError) {
      setOverviewError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu tổng quan.'));
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadRevenue = useCallback(async () => {
    setRevenueLoading(true);
    setRevenueError(null);
    setRevenue(null);
    try {
      setRevenue(await dashboardApi.getRevenue(revenueQuery));
    } catch (requestError) {
      setRevenueError(getApiErrorMessage(requestError, 'Không thể tải thống kê doanh thu.'));
    } finally {
      setRevenueLoading(false);
    }
  }, [revenueQuery]);

  useEffect(() => { void loadOverview(); }, [loadOverview]);
  useEffect(() => { void loadRevenue(); }, [loadRevenue]);

  const refreshDashboard = () => {
    void Promise.all([loadOverview(), loadRevenue()]);
  };

  return (
    <section aria-labelledby="dashboard-title">
      <PageHeader
        titleId="dashboard-title"
        eyebrow="TRUNG TÂM ĐIỀU HÀNH"
        title={`Xin chào, ${user?.fullName ?? ''}`}
        description="Theo dõi doanh thu, đơn hàng và các hoạt động cần xử lý tại DDTECH."
        actions={<Button icon={<ReloadOutlined />} loading={overviewLoading || revenueLoading} onClick={refreshDashboard}>Làm mới dữ liệu</Button>}
      />

      {overviewError && <ErrorState message={overviewError} onRetry={() => void loadOverview()} retrying={overviewLoading} />}

      <DashboardSummaryCards summary={summary} loading={overviewLoading} onNavigate={navigate} />

      <div className="dashboard-charts-grid">
        <RevenueChartCard
          data={revenue}
          loading={revenueLoading}
          error={revenueError}
          range={revenueRange}
          customRange={customRange}
          onRangeChange={setRevenueRange}
          onCustomRangeChange={setCustomRange}
        />
        <OrderStatusChartCard data={ordersByStatus} loading={overviewLoading} />
      </div>

      <DashboardDataTables
        topProducts={topProducts}
        recentOrders={recentOrders}
        lowStockItems={lowStockItems}
        loading={overviewLoading}
        onNavigate={navigate}
      />
    </section>
  );
}
