import ExcelJS from 'exceljs';

import * as reportRepository from '../repositories/report.repository';
import { AppError } from '../utils/app-error';
import type {
  ExportReportQuery,
  InventoryReportQuery,
  OrderReportQuery,
  ProductReportQuery,
  RevenueReportQuery,
} from '../validators/report.validator';

interface ReportRangeInput {
  from?: string;
  to?: string;
}

interface ReportRange {
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
}

type ExportValue = string | number | null;
type ExportRow = Record<string, ExportValue>;

interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  numberFormat?: string;
}

interface ExportDataset {
  name: string;
  columns: ExportColumn[];
  rows: ExportRow[];
}

const EXPORT_LIMIT = 5_000;
const DAY_MS = 86_400_000;
const pad = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);
const formatDateTime = (value: Date | null) => value ? value.toISOString() : null;

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year!, month! - 1, day!);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month! - 1
    || date.getDate() !== day
  ) {
    throw new AppError(422, `Ngày ${value} không hợp lệ`);
  }
  return date;
};

export const resolveReportRange = (input: ReportRangeInput): ReportRange => {
  const today = new Date();
  const from = input.from ? startOfDay(parseDate(input.from)) : startOfDay(today);
  if (!input.from) from.setDate(from.getDate() - 29);
  const to = input.to ? endOfDay(parseDate(input.to)) : endOfDay(today);
  if (from > to) throw new AppError(422, 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
  const days = Math.floor((startOfDay(to).getTime() - from.getTime()) / DAY_MS) + 1;
  if (days > 366) throw new AppError(422, 'Khoảng báo cáo không được vượt quá 366 ngày');
  return { from, to, fromLabel: formatDate(from), toLabel: formatDate(to) };
};

const buildPeriodLabels = (range: ReportRange, groupBy: 'DAY' | 'MONTH') => {
  const labels: string[] = [];
  const cursor = new Date(range.from);
  if (groupBy === 'MONTH') {
    cursor.setDate(1);
    while (cursor <= range.to) {
      labels.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return labels;
  }
  while (cursor <= range.to) {
    labels.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return labels;
};

export const getRevenue = async (query: RevenueReportQuery) => {
  const range = resolveReportRange(query);
  const records = await reportRepository.getRevenue(range.from, range.to, query.groupBy);
  const byPeriod = new Map(records.map((record) => [record.periodLabel, record]));
  const points = buildPeriodLabels(range, query.groupBy).map((period) => {
    const record = byPeriod.get(period);
    return {
      period,
      revenue: Number(record?.revenue ?? 0),
      ordersCount: Number(record?.ordersCount ?? 0),
      subtotal: Number(record?.subtotal ?? 0),
      shippingFee: Number(record?.shippingFee ?? 0),
      discountAmount: Number(record?.discountAmount ?? 0),
    };
  });
  return {
    revenueDefinition: 'DELIVERED' as const,
    range: { from: range.fromLabel, to: range.toLabel },
    groupBy: query.groupBy,
    summary: {
      revenue: points.reduce((sum, item) => sum + item.revenue, 0),
      ordersCount: points.reduce((sum, item) => sum + item.ordersCount, 0),
      subtotal: points.reduce((sum, item) => sum + item.subtotal, 0),
      shippingFee: points.reduce((sum, item) => sum + item.shippingFee, 0),
      discountAmount: points.reduce((sum, item) => sum + item.discountAmount, 0),
    },
    points,
  };
};

export const getOrders = async (query: OrderReportQuery) => {
  const range = resolveReportRange(query);
  const records = await reportRepository.getOrders(
    range.from,
    range.to,
    query.status,
    query.limit,
    (query.page - 1) * query.limit,
  );
  const total = Number(records[0]?.totalRows ?? 0);
  return {
    range: { from: range.fromLabel, to: range.toLabel },
    orders: records.map(({ totalRows: _totalRows, ...order }) => ({
      ...order,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getProducts = async (query: ProductReportQuery) => {
  const range = resolveReportRange(query);
  const records = await reportRepository.getProducts(
    range.from,
    range.to,
    query.categoryId,
    query.brandId,
    query.limit,
  );
  return {
    revenueDefinition: 'DELIVERED_ITEM_GROSS' as const,
    range: { from: range.fromLabel, to: range.toLabel },
    products: records.map((record) => ({
      ...record,
      quantitySold: Number(record.quantitySold),
      grossRevenue: Number(record.grossRevenue),
      ordersCount: Number(record.ordersCount),
      averagePrice: Number(record.averagePrice),
    })),
  };
};

export const getInventory = async (query: InventoryReportQuery) => {
  const range = resolveReportRange(query);
  const records = await reportRepository.getInventory(
    range.from,
    range.to,
    query.type,
    query.productId,
    query.limit,
    (query.page - 1) * query.limit,
  );
  const total = Number(records[0]?.totalRows ?? 0);
  return {
    range: { from: range.fromLabel, to: range.toLabel },
    transactions: records.map(({ totalRows: _totalRows, ...record }) => record),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

const getExportDataset = async (query: ExportReportQuery): Promise<ExportDataset> => {
  if (query.report === 'revenue') {
    const data = await getRevenue({ from: query.from, to: query.to, groupBy: query.groupBy });
    return {
      name: 'Doanh thu',
      columns: [
        { key: 'period', header: 'Thời gian', width: 16 },
        { key: 'ordersCount', header: 'Số đơn', width: 12 },
        { key: 'subtotal', header: 'Tiền hàng', width: 18, numberFormat: '#,##0' },
        { key: 'shippingFee', header: 'Phí vận chuyển', width: 18, numberFormat: '#,##0' },
        { key: 'discountAmount', header: 'Giảm giá', width: 18, numberFormat: '#,##0' },
        { key: 'revenue', header: 'Doanh thu', width: 20, numberFormat: '#,##0' },
      ],
      rows: data.points,
    };
  }
  const range = resolveReportRange(query);
  if (query.report === 'orders') {
    const records = await reportRepository.getOrders(
      range.from, range.to, query.status, EXPORT_LIMIT, 0,
    );
    return {
      name: 'Đơn hàng',
      columns: [
        { key: 'orderCode', header: 'Mã đơn', width: 20 },
        { key: 'customerName', header: 'Khách hàng', width: 24 },
        { key: 'customerEmail', header: 'Email', width: 28 },
        { key: 'receiverName', header: 'Người nhận', width: 24 },
        { key: 'receiverPhone', header: 'Số điện thoại', width: 16 },
        { key: 'subtotal', header: 'Tiền hàng', width: 18, numberFormat: '#,##0' },
        { key: 'shippingFee', header: 'Phí vận chuyển', width: 18, numberFormat: '#,##0' },
        { key: 'discountAmount', header: 'Giảm giá', width: 18, numberFormat: '#,##0' },
        { key: 'totalAmount', header: 'Tổng thanh toán', width: 20, numberFormat: '#,##0' },
        { key: 'paymentMethod', header: 'PT thanh toán', width: 16 },
        { key: 'paymentStatus', header: 'TT thanh toán', width: 16 },
        { key: 'status', header: 'Trạng thái đơn', width: 18 },
        { key: 'createdAt', header: 'Ngày đặt', width: 24 },
        { key: 'deliveredAt', header: 'Ngày giao', width: 24 },
      ],
      rows: records.map((record) => ({
        orderCode: record.orderCode,
        customerName: record.customerName,
        customerEmail: record.customerEmail,
        receiverName: record.receiverName,
        receiverPhone: record.receiverPhone,
        subtotal: Number(record.subtotal),
        shippingFee: Number(record.shippingFee),
        discountAmount: Number(record.discountAmount),
        totalAmount: Number(record.totalAmount),
        paymentMethod: record.paymentMethod,
        paymentStatus: record.paymentStatus,
        status: record.status,
        createdAt: formatDateTime(record.createdAt),
        deliveredAt: formatDateTime(record.deliveredAt),
      })),
    };
  }
  if (query.report === 'products') {
    const records = await reportRepository.getProducts(
      range.from, range.to, query.categoryId, query.brandId, EXPORT_LIMIT,
    );
    return {
      name: 'Sản phẩm',
      columns: [
        { key: 'productSku', header: 'SKU', width: 20 },
        { key: 'productName', header: 'Sản phẩm', width: 36 },
        { key: 'categoryName', header: 'Danh mục', width: 22 },
        { key: 'brandName', header: 'Thương hiệu', width: 20 },
        { key: 'quantitySold', header: 'Số lượng bán', width: 16 },
        { key: 'ordersCount', header: 'Số đơn', width: 12 },
        { key: 'averagePrice', header: 'Giá bán TB', width: 18, numberFormat: '#,##0' },
        { key: 'grossRevenue', header: 'Doanh thu hàng', width: 20, numberFormat: '#,##0' },
      ],
      rows: records.map((record) => ({
        productSku: record.productSku,
        productName: record.productName,
        categoryName: record.categoryName,
        brandName: record.brandName,
        quantitySold: Number(record.quantitySold),
        ordersCount: Number(record.ordersCount),
        averagePrice: Number(record.averagePrice),
        grossRevenue: Number(record.grossRevenue),
      })),
    };
  }
  const records = await reportRepository.getInventory(
    range.from, range.to, query.type, query.productId, EXPORT_LIMIT, 0,
  );
  return {
    name: 'Tồn kho',
    columns: [
      { key: 'productSku', header: 'SKU sản phẩm', width: 20 },
      { key: 'productName', header: 'Sản phẩm', width: 34 },
      { key: 'variantSku', header: 'SKU biến thể', width: 20 },
      { key: 'variantName', header: 'Biến thể', width: 24 },
      { key: 'type', header: 'Loại giao dịch', width: 18 },
      { key: 'quantity', header: 'Biến động', width: 14 },
      { key: 'stockAfter', header: 'Tồn sau GD', width: 14 },
      { key: 'referenceType', header: 'Loại tham chiếu', width: 18 },
      { key: 'referenceId', header: 'Mã tham chiếu', width: 16 },
      { key: 'createdByName', header: 'Người thực hiện', width: 24 },
      { key: 'note', header: 'Ghi chú', width: 36 },
      { key: 'createdAt', header: 'Thời gian', width: 24 },
    ],
    rows: records.map((record) => ({
      productSku: record.productSku,
      productName: record.productName,
      variantSku: record.variantSku,
      variantName: record.variantName,
      type: record.type,
      quantity: record.quantity,
      stockAfter: record.stockAfter,
      referenceType: record.referenceType,
      referenceId: record.referenceId,
      createdByName: record.createdByName,
      note: record.note,
      createdAt: formatDateTime(record.createdAt),
    })),
  };
};

const escapeCsv = (value: ExportValue) => {
  const safeValue = typeof value === 'string' && /^[=+\-@]/.test(value.trimStart())
    ? `'${value}`
    : value;
  const text = safeValue === null ? '' : String(safeValue);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const createCsv = (dataset: ExportDataset): Buffer => {
  const lines = [
    dataset.columns.map((column) => escapeCsv(column.header)).join(','),
    ...dataset.rows.map((row) => (
      dataset.columns.map((column) => escapeCsv(row[column.key] ?? null)).join(',')
    )),
  ];
  return Buffer.from(`\uFEFF${lines.join('\r\n')}`, 'utf8');
};

const excelColumnName = (columnNumber: number) => {
  let value = columnNumber;
  let name = '';
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
};

const createWorkbook = async (dataset: ExportDataset): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DDTECH';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(dataset.name, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  worksheet.columns = dataset.columns.map((column) => ({
    key: column.key,
    header: column.header,
    width: column.width ?? 18,
    style: column.numberFormat ? { numFmt: column.numberFormat } : undefined,
  }));
  worksheet.addRows(dataset.rows.map((row) => Object.fromEntries(
    dataset.columns.map((column) => {
      const value = row[column.key] ?? null;
      const safeValue = typeof value === 'string' && /^[=+\-@]/.test(value.trimStart())
        ? `'${value}`
        : value;
      return [column.key, safeValue];
    }),
  )));
  worksheet.autoFilter = `A1:${excelColumnName(dataset.columns.length)}1`;
  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 24;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
    row.alignment = { vertical: 'middle' };
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
};

export const exportReport = async (query: ExportReportQuery) => {
  const dataset = await getExportDataset(query);
  const range = resolveReportRange(query);
  const buffer = query.format === 'csv' ? createCsv(dataset) : await createWorkbook(dataset);
  return {
    buffer,
    contentType: query.format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: `ddtech-${query.report}-${range.fromLabel}-${range.toLabel}.${query.format}`,
  };
};
