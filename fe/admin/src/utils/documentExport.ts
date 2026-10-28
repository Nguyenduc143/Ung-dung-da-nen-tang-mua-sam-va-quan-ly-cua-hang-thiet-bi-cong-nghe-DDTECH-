import dayjs from 'dayjs';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { InventoryProduct, InventoryTransaction, LowStockItem } from '../types/inventory';
import type { OrderDetailData } from '../types/order';
import { formatMoney, orderStatusLabels, paymentMethodLabels, paymentStatusLabels } from './orderPresentation';

export type ExportValue = string | number | Date | null;
export interface ExportTable {
  title: string;
  context: string;
  headers: string[];
  rows: ExportValue[][];
}

export const exportFilename = (name: string) => name.replace(/[^\p{L}\p{N}_-]/gu, '_').slice(0, 100);
const dateText = (value: string | Date) => dayjs(value).format('DD/MM/YYYY HH:mm');
const cellText = (value: ExportValue) => value instanceof Date ? dateText(value) : value === null ? '' : String(value);
const asDate = (value: string): Date | null => dayjs(value).isValid() ? dayjs(value).toDate() : null;
const productStatus = (value: string) => value === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán';

export function inventoryExportTable(products: InventoryProduct[], context: string): ExportTable {
  return {
    title: 'BÁO CÁO TỒN KHO', context,
    headers: ['Sản phẩm', 'SKU sản phẩm', 'Phiên bản / cấu hình', 'SKU phiên bản', 'Tồn kho', 'Đã bán', 'Trạng thái', 'Cập nhật'],
    // Chỉ xuất từng phiên bản khi có phiên bản, không cộng thêm dòng tổng sản phẩm gây đếm đôi.
    rows: products.flatMap((p): ExportValue[][] => p.hasVariants && p.variants.length ? p.variants.map(v => [
      p.name, p.sku, v.variantName, v.sku, v.stock, v.soldCount, productStatus(v.status), asDate(v.updatedAt),
    ]) : [[p.name, p.sku, '', '', p.stock, p.soldCount, productStatus(p.status), asDate(p.updatedAt)]]),
  };
}

export function lowStockExportTable(items: LowStockItem[], threshold: number): ExportTable {
  return {
    title: 'BÁO CÁO HÀNG SẮP HẾT', context: `Ngưỡng cảnh báo: tồn kho <= ${threshold}`,
    headers: ['Sản phẩm', 'SKU sản phẩm', 'Phiên bản / cấu hình', 'SKU phiên bản', 'Tồn kho'],
    rows: items.map(i => [i.product.name, i.product.sku, i.variant?.name ?? '', i.variant?.sku ?? '', i.stock]),
  };
}

const transactionLabels: Record<string, string> = {
  IMPORT: 'Nhập kho', SALE: 'Bán hàng', RETURN: 'Hoàn hàng', ADJUSTMENT: 'Điều chỉnh', CANCEL_ORDER: 'Hủy đơn',
};
export function transactionExportTable(items: InventoryTransaction[], context: string): ExportTable {
  return {
    title: 'LỊCH SỬ TỒN KHO', context,
    headers: ['Mã', 'Sản phẩm', 'SKU', 'Phiên bản', 'Loại', 'Thay đổi', 'Tồn sau', 'Tham chiếu', 'Ghi chú', 'Người tạo', 'Thời gian'],
    rows: items.map(i => [i.id, i.product.name, i.variant?.sku ?? i.product.sku, i.variant?.name ?? '',
      transactionLabels[i.type] ?? i.type, i.quantity, i.stockAfter,
      i.referenceType ? `${i.referenceType}${i.referenceId ? ` #${i.referenceId}` : ''}` : '',
      i.note ?? '', i.createdBy?.fullName ?? 'Hệ thống', asDate(i.createdAt)]),
  };
}

function basePdf(title: string, landscape = false): TDocumentDefinitions {
  return {
    pageSize: 'A4', pageOrientation: landscape ? 'landscape' : 'portrait', pageMargins: [28, 32, 28, 40],
    info: { title, author: 'DDTECH' }, defaultStyle: { font: 'Roboto', fontSize: 9, color: '#1e293b' },
    styles: { title: { fontSize: 19, bold: true, color: '#1d4ed8', margin: [0, 0, 0, 8] },
      heading: { bold: true, fontSize: 11, margin: [0, 12, 0, 6] }, muted: { color: '#64748b', fontSize: 8 } },
    footer: (current, total) => ({ text: `DDTECH - Trang ${current}/${total}`, alignment: 'center', fontSize: 8, color: '#64748b' }),
    content: [],
  };
}

export function invoiceDefinition({ order: o, items }: OrderDetailData): TDocumentDefinitions {
  const doc = basePdf(`Hóa đơn ${o.orderCode}`);
  doc.content = [
    { text: 'DDTECH', style: 'title' },
    { text: 'HÓA ĐƠN BÁN HÀNG', fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
    { text: `Mã đơn: ${o.orderCode}\nNgày đặt: ${dateText(o.createdAt)}\nTrạng thái đơn: ${orderStatusLabels[o.status]}` },
    { text: 'THÔNG TIN GIAO NHẬN', style: 'heading' },
    { text: `Người nhận: ${o.receiverName}\nĐiện thoại: ${o.receiverPhone}\nĐịa chỉ: ${o.shippingAddress}` },
    { text: 'CHI TIẾT SẢN PHẨM', style: 'heading' },
    { table: { headerRows: 1, dontBreakRows: true, widths: [22, '*', 65, 28, 75], body: [
      ['STT', 'Sản phẩm / SKU / cấu hình', 'Đơn giá', 'SL', 'Thành tiền'].map(text => ({ text, bold: true, fillColor: '#eff6ff' })),
      ...items.map((i, index): TableCell[] => [String(index + 1), { text: `${i.productName}\n${i.productSku}${i.variantName ? `\n${i.variantName}` : ''}` },
        { text: formatMoney.format(i.price), alignment: 'right' }, { text: String(i.quantity), alignment: 'center' },
        { text: formatMoney.format(i.subtotal), alignment: 'right' }]),
    ] }, layout: 'lightHorizontalLines', margin: [0, 0, 0, 12] },
    ...(o.note ? [{ text: `Ghi chú: ${o.note}`, margin: [0, 8, 0, 8] } as Content] : []),
    ...(o.status === 'CANCELLED' ? [{ text: `ĐƠN ĐÃ HỦY: ${o.cancelReason ?? ''}`, bold: true, color: '#dc2626', margin: [0, 8, 0, 8] } as Content] : []),
    // Keep settlement and the document disclaimer together, avoiding a nearly empty final page.
    { unbreakable: true, stack: [
    { table: { widths: ['*', 110], body: [
      ['Tạm tính', formatMoney.format(o.subtotal)], ['Phí vận chuyển', formatMoney.format(o.shippingFee)],
      ['Giảm giá', `-${formatMoney.format(o.discountAmount)}`],
      [{ text: 'TỔNG THANH TOÁN', bold: true }, { text: formatMoney.format(o.totalAmount), bold: true }],
    ] }, layout: 'noBorders' },
    { text: `Phương thức: ${paymentMethodLabels[o.paymentMethod]}\nThanh toán: ${paymentStatusLabels[o.paymentStatus]}`, margin: [0, 12, 0, 0] },
    ...(o.promotionCode ? [{ text: `Mã khuyến mãi: ${o.promotionCode}` }] : []),
    { text: 'Chứng từ đơn hàng nội bộ, không phải hóa đơn VAT.', style: 'muted', margin: [0, 16, 0, 0] },
    ] },
  ];
  return doc;
}

export function tablePdfDefinition(data: ExportTable): TDocumentDefinitions {
  const doc = basePdf(data.title, true);
  doc.content = [
    { text: `DDTECH - ${data.title}`, style: 'title' },
    { text: `${data.context}\nXuất lúc: ${dateText(new Date())} - ${data.rows.length} dòng - Múi giờ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`, style: 'muted', margin: [0, 0, 0, 12] },
    { table: { headerRows: 1, dontBreakRows: true, widths: data.headers.map((_, i) => i === 0 && data.headers.length < 10 ? 150 : '*'), body: [
      data.headers.map(text => ({ text, bold: true, fillColor: '#eff6ff' })),
      ...data.rows.map(row => row.map((value): TableCell => ({ text: cellText(value), alignment: typeof value === 'number' ? 'right' : 'left' }))),
    ] }, fontSize: data.headers.length > 8 ? 7 : 8, layout: 'lightHorizontalLines' },
  ];
  return doc;
}

export async function pdfBlob(definition: TDocumentDefinitions): Promise<Blob> {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts'),
  ]);
  return new Promise(resolve => pdfMake.createPdf(definition, undefined, undefined, fonts).getBlob(resolve));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor);
  anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function exportInvoice(detail: OrderDetailData) {
  downloadBlob(await pdfBlob(invoiceDefinition(detail)), `Hoa_don_${exportFilename(detail.order.orderCode)}.pdf`);
}

export async function excelBlob(data: ExportTable): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DDTECH'; workbook.created = new Date();
  const sheet = workbook.addWorksheet('Du lieu', { views: [{ state: 'frozen', ySplit: 4 }] });
  sheet.mergeCells(1, 1, 1, data.headers.length); sheet.getCell('A1').value = data.title;
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1D4ED8' } };
  sheet.mergeCells(2, 1, 2, data.headers.length); sheet.getCell('A2').value = `${data.context} | Xuất lúc: ${dateText(new Date())} | Múi giờ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  sheet.getRow(2).height = 32; sheet.getCell('A2').alignment = { wrapText: true, vertical: 'middle' };
  sheet.getRow(4).values = data.headers;
  sheet.getRow(4).height = 32;
  sheet.getRow(4).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  data.rows.forEach(values => {
    const row = sheet.addRow(values);
    row.height = 44;
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (cell.value instanceof Date) {
        // Excel dates have no timezone: store local wall-clock time, matching the admin UI/PDF.
        cell.value = new Date(cell.value.getTime() - cell.value.getTimezoneOffset() * 60_000);
        cell.numFmt = 'dd/mm/yyyy hh:mm';
      }
      else if (typeof cell.value === 'number') cell.numFmt = '#,##0';
      // Strings stay literal text, including values beginning with =, +, - or @.
    });
  });
  data.headers.forEach((header, i) => { sheet.getColumn(i + 1).width = /Sản phẩm|Ghi chú|Phiên bản/.test(header) ? 42 : /Thời gian|Cập nhật/.test(header) ? 23 : 20; });
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: Math.max(4, sheet.rowCount), column: data.headers.length } };
  sheet.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:4' };
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportInventoryTable(data: ExportTable, format: 'pdf' | 'xlsx') {
  if (!data.rows.length) throw new Error('Không có dữ liệu phù hợp để xuất.');
  const blob = format === 'pdf' ? await pdfBlob(tablePdfDefinition(data)) : await excelBlob(data);
  downloadBlob(blob, `${exportFilename(data.title)}_${dayjs().format('YYYYMMDD_HHmmss')}.${format}`);
}

// Fetch every matching page through existing authenticated APIs, never silently export just one page.
export async function collectExportPages<T>(fetchPage: (page: number) => Promise<{ rows: T[]; totalPages: number }>): Promise<T[]> {
  const rows: T[] = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const result = await fetchPage(page);
    if (page === 1) pages = Math.max(1, result.totalPages);
    rows.push(...result.rows);
  }
  return rows;
}
