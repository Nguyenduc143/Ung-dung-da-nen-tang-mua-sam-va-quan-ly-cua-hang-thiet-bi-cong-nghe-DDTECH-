import {
  DollarOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Empty, Skeleton, Statistic } from 'antd';
import type { ReactNode } from 'react';

import type { DashboardSummary } from '../../types/dashboard';
import { formatMoney } from '../../utils/orderPresentation';

interface DashboardSummaryCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onNavigate: (path: string) => void;
}

interface SummaryCardData {
  key: string;
  label: string;
  value: number;
  displayValue?: string;
  icon: ReactNode;
  tone: string;
  path: string;
}

export function DashboardSummaryCards({
  summary,
  loading,
  onNavigate,
}: DashboardSummaryCardsProps) {
  const cards: SummaryCardData[] = summary ? [
    { key: 'totalRevenue', label: 'Tổng doanh thu', value: summary.totalRevenue, displayValue: formatMoney.format(summary.totalRevenue), icon: <DollarOutlined />, tone: 'blue', path: '/orders' },
    { key: 'ordersCount', label: 'Tổng đơn hàng', value: summary.ordersCount, icon: <ShoppingCartOutlined />, tone: 'purple', path: '/orders' },
    { key: 'customerCount', label: 'Khách hàng', value: summary.customerCount, icon: <TeamOutlined />, tone: 'cyan', path: '/users' },
    { key: 'productCount', label: 'Sản phẩm', value: summary.productCount, icon: <ShoppingOutlined />, tone: 'green', path: '/products' },
    { key: 'todayRevenue', label: 'Doanh thu hôm nay', value: summary.todayRevenue, displayValue: formatMoney.format(summary.todayRevenue), icon: <InboxOutlined />, tone: 'orange', path: '/orders' },
    { key: 'pendingOrders', label: 'Đơn chờ xác nhận', value: summary.pendingOrders, icon: <WarningOutlined />, tone: 'red', path: '/orders' },
  ] : [];

  if (loading) {
    return (
      <div className="dashboard-summary-grid">
        {Array.from({ length: 6 }, (_, index) => <Card key={index} className="dashboard-stat-card" bordered={false}><Skeleton active paragraph={false} /></Card>)}
      </div>
    );
  }

  if (!summary) {
    return <Card className="dashboard-stat-card dashboard-stat-card--empty" bordered={false}><Empty description="Không có dữ liệu tổng quan" /></Card>;
  }

  return (
    <div className="dashboard-summary-grid">
      {cards.map((card) => (
        <Card
          key={card.key}
          className="dashboard-stat-card"
          bordered={false}
          hoverable
          role="button"
          tabIndex={0}
          onClick={() => onNavigate(card.path)}
          onKeyDown={(event) => { if (event.key === 'Enter') onNavigate(card.path); }}
        >
          <div className={`dashboard-stat-icon dashboard-stat-icon--${card.tone}`}>{card.icon}</div>
          <Statistic title={card.label} value={card.displayValue ?? card.value} />
        </Card>
      ))}
    </div>
  );
}
