import {
  CheckCircleFilled,
  LayoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';

import { useAuthStore } from '../stores/authStore';

const { Paragraph, Text, Title } = Typography;

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <section aria-labelledby="dashboard-title">
      <div className="page-heading">
        <Text className="eyebrow">TRUNG TÂM ĐIỀU HÀNH</Text>
        <Title id="dashboard-title" level={2}>Xin chào, {user?.fullName}</Title>
        <Paragraph>Khung quản trị đã sẵn sàng để kết nối các màn hình nghiệp vụ.</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card bordered={false} className="dashboard-card">
            <Space direction="vertical" size={14}>
              <Tag icon={<CheckCircleFilled />} color="success">Bước 04 hoàn tất</Tag>
              <Title level={3}>Protected Route &amp; Admin Layout</Title>
              <ul className="check-list">
                <li><SafetyCertificateOutlined /> Mọi route quản trị đều yêu cầu ADMIN</li>
                <li><LayoutOutlined /> Sidebar, header, breadcrumb và vùng nội dung dùng chung</li>
                <li><LayoutOutlined /> Sidebar tự thích nghi và hỗ trợ thu gọn</li>
              </ul>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card bordered={false} className="dashboard-card account-card">
            <Text className="eyebrow">PHIÊN HIỆN TẠI</Text>
            <Title level={3}>{user?.fullName}</Title>
            <Paragraph>{user?.email}</Paragraph>
            <Space>
              <Tag color="blue">{user?.role}</Tag>
              <Tag color="green">{user?.status}</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </section>
  );
}
