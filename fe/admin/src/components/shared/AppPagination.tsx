import { Pagination } from 'antd';

interface AppPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
}

export function AppPagination({
  current,
  pageSize,
  total,
  onChange,
  itemLabel = 'bản ghi',
  pageSizeOptions = [10, 20, 50, 100],
}: AppPaginationProps) {
  if (total <= 0) return null;
  return (
    <Pagination
      current={current}
      pageSize={pageSize}
      total={total}
      showSizeChanger
      pageSizeOptions={pageSizeOptions}
      showTotal={(count) => `Tổng ${count} ${itemLabel}`}
      onChange={onChange}
    />
  );
}
