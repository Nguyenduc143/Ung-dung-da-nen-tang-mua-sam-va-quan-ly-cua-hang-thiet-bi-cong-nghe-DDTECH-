import { Table, type TableProps } from 'antd';

import { EmptyState } from './EmptyState';

interface DataTableProps<RecordType extends object> extends TableProps<RecordType> {
  emptyMessage?: string;
  hasError?: boolean;
}

export function DataTable<RecordType extends object>({
  emptyMessage = 'Chưa có dữ liệu phù hợp',
  hasError = false,
  locale,
  ...props
}: DataTableProps<RecordType>) {
  return (
    <Table<RecordType>
      {...props}
      locale={{
        ...locale,
        emptyText: locale?.emptyText ?? (
          <EmptyState compact description={hasError ? 'Không có dữ liệu để hiển thị' : emptyMessage} />
        ),
      }}
    />
  );
}
