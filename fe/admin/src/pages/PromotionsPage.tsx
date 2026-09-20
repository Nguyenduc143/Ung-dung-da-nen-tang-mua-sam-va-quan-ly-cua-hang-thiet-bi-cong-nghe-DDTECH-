import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Input,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as promotionApi from '../api/promotionApi';
import type { Promotion } from '../types/promotion';
import { currencyFormatter as moneyFormatter } from '../utils/formatters';
import {
  formatPromotionDiscount,
  getPromotionViewState,
  promotionStateColors,
  promotionStateLabels,
  type PromotionViewState,
} from '../utils/promotionPresentation';

const { Paragraph, Text, Title } = Typography;
type StateFilter = PromotionViewState | 'ALL';

export function PromotionsPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPromotions(await promotionApi.listPromotions());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách khuyến mãi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPromotions(); }, [loadPromotions]);

  const filteredPromotions = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return promotions.filter((promotion) => {
      const matchesSearch = !keyword || [promotion.code, promotion.name, promotion.description ?? '']
        .some((value) => value.toLocaleLowerCase('vi').includes(keyword));
      const matchesState = stateFilter === 'ALL' || getPromotionViewState(promotion) === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [promotions, search, stateFilter]);

  const handleDeactivate = async (promotion: Promotion) => {
    setDeletingId(promotion.id);
    try {
      await promotionApi.deletePromotion(promotion.id);
      message.success('Đã ngừng hoạt động mã khuyến mãi.');
      await loadPromotions();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể ngừng hoạt động mã khuyến mãi.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<Promotion> = [
    {
      title: 'Khuyến mãi', key: 'promotion', width: 280,
      render: (_, record) => (
        <div className="promotion-name-cell">
          <div className="promotion-code-badge">{record.code}</div>
          <div className="table-primary-cell"><strong>{record.name}</strong><span>{record.description || 'Chưa có mô tả'}</span></div>
        </div>
      ),
    },
    {
      title: 'Mức giảm', key: 'discount', width: 160,
      render: (_, record) => (
        <div className="table-primary-cell">
          <strong className="promotion-discount-value">{formatPromotionDiscount(record)}</strong>
          <span>{record.discountType === 'PERCENT' && record.maxDiscount !== null ? `Tối đa ${moneyFormatter.format(record.maxDiscount)}` : record.discountType === 'PERCENT' ? 'Không giới hạn mức giảm' : 'Giảm cố định'}</span>
        </div>
      ),
    },
    {
      title: 'Đơn tối thiểu', dataIndex: 'minOrderValue', key: 'minOrderValue', width: 145,
      render: (value: number) => moneyFormatter.format(value),
      sorter: (a, b) => a.minOrderValue - b.minOrderValue,
    },
    {
      title: 'Lượt sử dụng', key: 'usage', width: 175,
      render: (_, record) => {
        if (record.usageLimit === null) {
          return <div className="table-primary-cell"><strong>{record.usedCount} lượt</strong><span>Không giới hạn tổng</span></div>;
        }
        const percent = Math.min(100, Math.round(record.usedCount / record.usageLimit * 100));
        return (
          <div className="promotion-usage-cell">
            <span>{record.usedCount}/{record.usageLimit}</span>
            <Progress percent={percent} size="small" showInfo={false} status={percent >= 100 ? 'exception' : 'normal'} />
          </div>
        );
      },
    },
    {
      title: 'Thời gian', key: 'dates', width: 195,
      render: (_, record) => (
        <div className="table-primary-cell">
          <strong>{dayjs(record.startDate).format('DD/MM/YYYY HH:mm')}</strong>
          <span>đến {dayjs(record.endDate).format('DD/MM/YYYY HH:mm')}</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái', key: 'state', width: 145,
      render: (_, record) => {
        const viewState = getPromotionViewState(record);
        return <Tag color={promotionStateColors[viewState]}>{promotionStateLabels[viewState]}</Tag>;
      },
    },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', width: 105,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/promotions/${record.id}/edit`)} />
          </Tooltip>
          <Popconfirm
            title="Ngừng hoạt động mã này?"
            description="Mã sẽ không thể được áp dụng cho đơn hàng mới."
            okText="Ngừng hoạt động"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            disabled={record.status === 'INACTIVE'}
            onConfirm={() => handleDeactivate(record)}
          >
            <Tooltip title={record.status === 'INACTIVE' ? 'Mã đã ngừng hoạt động' : 'Ngừng hoạt động'}>
              <Button danger type="text" disabled={record.status === 'INACTIVE'} icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section aria-labelledby="promotions-title">
      <div className="page-heading page-heading--actions">
        <div>
          <Text className="eyebrow">CHƯƠNG TRÌNH ƯU ĐÃI</Text>
          <Title id="promotions-title" level={2}>Quản lý khuyến mãi</Title>
          <Paragraph>Tạo mã giảm giá, theo dõi thời hạn và kiểm soát giới hạn sử dụng.</Paragraph>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/promotions/create')}>Tạo khuyến mãi</Button>
      </div>

      {error && <Alert className="content-alert" type="error" showIcon message={error} action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadPromotions()}>Thử lại</Button>} />}

      <Card className="management-card" bordered={false}>
        <div className="promotion-toolbar">
          <Input
            allowClear value={search} prefix={<SearchOutlined />}
            placeholder="Tìm theo mã, tên hoặc mô tả"
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
          <Select<StateFilter>
            value={stateFilter}
            onChange={(value) => { setStateFilter(value); setPage(1); }}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              ...Object.entries(promotionStateLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
          <div className="result-count"><TagsOutlined /> {filteredPromotions.length} khuyến mãi</div>
        </div>

        <Table<Promotion>
          rowKey="id" columns={columns} dataSource={filteredPromotions} loading={loading} scroll={{ x: 1260 }}
          onRow={(record) => ({ onDoubleClick: () => navigate(`/promotions/${record.id}/edit`) })}
          pagination={{
            current: page, pageSize, total: filteredPromotions.length, showSizeChanger: true,
            pageSizeOptions: [10, 20, 50], showTotal: (total) => `Tổng ${total} khuyến mãi`,
            onChange: (nextPage, nextPageSize) => { setPage(nextPageSize === pageSize ? nextPage : 1); setPageSize(nextPageSize); },
          }}
          locale={{ emptyText: error ? 'Không có dữ liệu để hiển thị' : 'Chưa có khuyến mãi phù hợp' }}
        />
      </Card>
    </section>
  );
}
