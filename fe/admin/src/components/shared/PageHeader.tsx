import { Typography } from 'antd';
import type { ReactNode } from 'react';

const { Paragraph, Text, Title } = Typography;

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
}

export function PageHeader({ title, description, eyebrow, actions, titleId }: PageHeaderProps) {
  return (
    <div className={`page-heading ${actions ? 'page-heading--actions' : ''}`}>
      <div>
        {eyebrow && <Text className="eyebrow">{eyebrow}</Text>}
        <Title id={titleId} level={2}>{title}</Title>
        {description && <Paragraph>{description}</Paragraph>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
