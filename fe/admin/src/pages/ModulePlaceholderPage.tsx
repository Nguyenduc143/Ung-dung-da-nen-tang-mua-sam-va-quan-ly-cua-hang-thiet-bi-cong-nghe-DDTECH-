import { ClockCircleOutlined } from '@ant-design/icons';
import { Card, Empty, Typography } from 'antd';

const { Paragraph, Title } = Typography;

interface ModulePlaceholderPageProps {
  title: string;
  description: string;
}

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <section aria-labelledby="module-title">
      <div className="page-heading">
        <Title id="module-title" level={2}>{title}</Title>
        <Paragraph>{description}</Paragraph>
      </div>
      <Card className="module-placeholder" bordered={false}>
        <Empty
          image={<ClockCircleOutlined className="placeholder-icon" />}
          description="Chức năng sẽ được triển khai ở bước tài liệu tương ứng."
        />
      </Card>
    </section>
  );
}
