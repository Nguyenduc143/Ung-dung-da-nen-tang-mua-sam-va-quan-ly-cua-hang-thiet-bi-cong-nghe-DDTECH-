import { App as AntApp, Button, Result } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as promotionApi from '../api/promotionApi';
import { PromotionForm } from '../components/promotions/PromotionForm';
import { ErrorState, FormActions, LoadingState, PageHeader } from '../components/shared';
import type { Promotion, PromotionInput } from '../types/promotion';

export function PromotionFormPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const promotionId = params.id ? Number(params.id) : null;
  const isEditing = promotionId !== null;
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPromotion = useCallback(async () => {
    if (!isEditing) {
      setLoading(false);
      return;
    }
    if (!Number.isInteger(promotionId) || promotionId <= 0) {
      setError('ID khuyến mãi không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const promotions = await promotionApi.listPromotions();
      const currentPromotion = promotions.find((item) => item.id === promotionId);
      if (!currentPromotion) {
        setError('Không tìm thấy mã khuyến mãi.');
        return;
      }
      setPromotion(currentPromotion);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải thông tin khuyến mãi.'));
    } finally {
      setLoading(false);
    }
  }, [isEditing, promotionId]);

  useEffect(() => { void loadPromotion(); }, [loadPromotion]);

  const handleSubmit = async (input: PromotionInput) => {
    setSaving(true);
    try {
      if (promotionId) {
        await promotionApi.updatePromotion(promotionId, input);
        message.success('Đã cập nhật mã khuyến mãi.');
      } else {
        await promotionApi.createPromotion(input);
        message.success('Đã tạo mã khuyến mãi.');
      }
      navigate('/promotions');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu mã khuyến mãi.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Đang tải thông tin khuyến mãi..." />;

  if (error && isEditing) {
    return (
      <Result
        status="error" title="Không thể hiển thị khuyến mãi" subTitle={error}
        extra={[
          <Button key="back" onClick={() => navigate('/promotions')}>Về danh sách</Button>,
          <Button key="retry" type="primary" onClick={() => void loadPromotion()}>Thử lại</Button>,
        ]}
      />
    );
  }

  return (
    <section aria-labelledby="promotion-form-title">
      <PageHeader
        titleId="promotion-form-title"
        eyebrow="CHƯƠNG TRÌNH ƯU ĐÃI"
        title={isEditing ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi'}
        description={isEditing ? `Chỉnh sửa mã ${promotion?.code}.` : 'Thiết lập mã, mức giảm, thời gian và giới hạn sử dụng.'}
        actions={<FormActions saving={saving} form="promotion-form" submitLabel={isEditing ? 'Lưu thay đổi' : 'Tạo khuyến mãi'} onCancel={() => navigate('/promotions')} />}
      />

      {error && <ErrorState message={error} />}
      <PromotionForm promotion={promotion} saving={saving} onSubmit={handleSubmit} />
    </section>
  );
}
