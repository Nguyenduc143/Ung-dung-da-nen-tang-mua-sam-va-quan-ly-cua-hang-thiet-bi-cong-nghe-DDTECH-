import { describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
import { collectExportPages, excelBlob, exportFilename, exportInventoryTable, inventoryExportTable, invoiceDefinition, lowStockExportTable, pdfBlob, tablePdfDefinition, transactionExportTable } from '../utils/documentExport';
import type { InventoryProduct, InventoryTransaction } from '../types/inventory';
import type { OrderDetailData } from '../types/order';

const product: InventoryProduct = {
  id: 1, name: 'Điện thoại thử nghiệm', slug: 'dien-thoai', sku: '000123', hasVariants: true,
  stock: 15, soldCount: 3, status: 'ACTIVE', updatedAt: '2026-10-08T08:00:00Z',
  variants: [
    { id: 11, productId: 1, sku: '000123-BLACK', variantName: 'Đen / 256GB', stock: 5, soldCount: 1, status: 'ACTIVE', updatedAt: '2026-10-08T08:00:00Z' },
    { id: 12, productId: 1, sku: '000123-WHITE', variantName: 'Trắng / 512GB', stock: 10, soldCount: 2, status: 'INACTIVE', updatedAt: '2026-10-08T08:00:00Z' },
  ],
};

const detail: OrderDetailData = {
  order: {
    id: 1, orderCode: 'DD/001', userId: 2, customer: { id: 2, fullName: 'Khách hàng', email: 'test@example.com', phone: null },
    receiverName: 'Nguyễn Văn An', receiverPhone: '0901234567', shippingAddress: 'Hà Nội', shippingMethod: null,
    promotionId: null, promotionCode: 'SALE10', subtotal: 200000, shippingFee: 30000, discountAmount: 20000, totalAmount: 210000,
    paymentMethod: 'COD', paymentStatus: 'UNPAID', status: 'CANCELLED', note: 'Giao giờ hành chính', cancelReason: 'Khách hủy',
    confirmedAt: null, deliveredAt: null, cancelledAt: null, createdAt: '2026-10-08T08:00:00Z', updatedAt: '2026-10-08T08:00:00Z',
  },
  items: [{ id: 1, productId: null, variantId: null, productName: 'Tên sản phẩm tại lúc mua', productSku: 'OLD-SKU', variantName: 'Xanh / 256GB',
    productImage: null, originalPrice: 120000, price: 100000, quantity: 2, subtotal: 200000, createdAt: '2026-10-08T08:00:00Z' }],
  statusHistory: [],
};

const readBlob = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.onerror = reject; reader.readAsArrayBuffer(blob);
});

describe('xuất chứng từ', () => {
  it('xuất phiên bản, không đếm đôi tồn kho tổng sản phẩm', () => {
    const result = inventoryExportTable([product], 'Tất cả');
    expect(result.rows).toHaveLength(2);
    expect(result.rows.reduce((sum, row) => sum + Number(row[4]), 0)).toBe(15);
    expect(result.rows[0][7]).toBeInstanceOf(Date);
    expect(result.rows[1][6]).toBe('Ngừng bán');
  });

  it('giữ sản phẩm không có phiên bản và tồn bằng 0', () => {
    const result = inventoryExportTable([{ ...product, hasVariants: false, variants: [], stock: 0 }], 'Tất cả');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0][4]).toBe(0);
  });

  it('xuất hàng sắp hết gồm SKU phiên bản và ngưỡng', () => {
    const result = lowStockExportTable([{ product: { id: 1, name: 'A', sku: '01' }, variant: { id: 11, name: 'Đen', sku: '01-B' }, stock: 2 }], 5);
    expect(result.context).toContain('5');
    expect(result.rows[0]).toEqual(['A', '01', 'Đen', '01-B', 2]);
  });

  it('lịch sử giữ số âm và tham chiếu đơn', () => {
    const transaction: InventoryTransaction = { id: 1, product: { id: 1, name: 'A', sku: '01' }, variant: null,
      type: 'SALE', quantity: -2, stockAfter: 8, referenceType: 'ORDER', referenceId: 99, note: null, createdBy: null, createdAt: product.updatedAt };
    const result = transactionExportTable([transaction], 'Loại: bán');
    expect(result.rows[0][5]).toBe(-2);
    expect(result.rows[0][7]).toBe('ORDER #99');
  });

  it('hóa đơn dùng snapshot của đơn, tổng tiền và trạng thái chưa thanh toán/hủy', () => {
    const result = JSON.stringify(invoiceDefinition(detail));
    expect(result).toContain('Tên sản phẩm tại lúc mua');
    expect(result).toContain('OLD-SKU');
    expect(result).toContain('Nguyễn Văn An');
    expect(result).toContain('Chưa thanh toán');
    expect(result).toContain('ĐƠN ĐÃ HỦY');
    expect(result).toContain('210.000');
    expect(result).toContain('không phải hóa đơn VAT');
  });

  it('PDF có header lặp lại và bố cục ngang cho tồn kho', () => {
    const definition = tablePdfDefinition(inventoryExportTable([product], 'Tất cả'));
    expect(definition.pageOrientation).toBe('landscape');
    expect(JSON.stringify(definition)).toContain('"headerRows":1');
    expect(JSON.stringify(definition)).toContain('Đen / 256GB');
  });

  it('lấy đủ các trang và giữ thứ tự', async () => {
    const fetch = vi.fn(async (page: number) => ({ rows: [page], totalPages: 3 }));
    expect(await collectExportPages(fetch)).toEqual([1, 2, 3]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('không xuất file thiếu dữ liệu khi một trang bị lỗi', async () => {
    await expect(collectExportPages(async page => {
      if (page === 2) throw new Error('Mất kết nối');
      return { rows: [1], totalPages: 3 };
    })).rejects.toThrow('Mất kết nối');
  });

  it('từ chối xuất dữ liệu rỗng và loại ký tự đường dẫn khỏi tên file', async () => {
    await expect(exportInventoryTable({ title: 'Kho', context: '', headers: ['SKU'], rows: [] }, 'xlsx')).rejects.toThrow('Không có dữ liệu');
    expect(exportFilename('../DD/001')).toBe('___DD_001');
  });

  it('Excel thực tế giữ số, ngày, SKU số 0 đầu và văn bản giống công thức', async () => {
    const date = new Date('2026-10-08T08:00:00Z');
    const blob = await excelBlob({ title: 'Kho', context: 'Tất cả', headers: ['SKU', 'Tên', 'Tồn', 'Cập nhật'], rows: [['000123', '=HYPERLINK("bad")', 15, date]] });
    const buffer = await readBlob(blob);
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    expect(sheet.getCell('A5').value).toBe('000123');
    expect(sheet.getCell('B5').value).toBe('=HYPERLINK("bad")');
    expect(sheet.getCell('C5').value).toBe(15);
    expect(sheet.getCell('D5').value).toEqual(new Date(date.getTime() - date.getTimezoneOffset() * 60_000));
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 4 });
    expect(sheet.autoFilter).toBeTruthy();
  });

  it('tạo PDF thực tế với font tiếng Việt và nhiều trang', async () => {
    const invoice = invoiceDefinition({ ...detail, items: Array.from({ length: 40 }, (_, i) => ({
      ...detail.items[0], id: i + 1,
      productName: `Sản phẩm ${i + 1}: Laptop cấu hình cao - tên dài để kiểm tra xuống dòng và phân trang`,
    })) });
    const stock = inventoryExportTable(Array.from({ length: 40 }, (_, i) => ({ ...product, id: i + 1 })), 'Tất cả sản phẩm');
    const history = transactionExportTable(Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, product: { id: 1, name: product.name, sku: product.sku }, variant: { id: 11, name: 'Đen / 256GB', sku: '000123-BLACK' },
      type: 'SALE', quantity: -2, stockAfter: 8, referenceType: 'ORDER', referenceId: 99,
      note: 'Ghi chú dài: giao dịch được tạo từ đơn hàng thử nghiệm để kiểm tra bố cục', createdBy: null, createdAt: product.updatedAt,
    })), 'Loại: bán hàng; Từ: không giới hạn; Đến: không giới hạn');
    for (const [name, definition] of [['invoice', invoice], ['inventory', tablePdfDefinition(stock)], ['history', tablePdfDefinition(history)]] as const) {
      const buffer = await readBlob(await pdfBlob(definition));
      expect(new TextDecoder().decode(buffer.slice(0, 5))).toBe('%PDF-');
      expect(buffer.byteLength).toBeGreaterThan(10000);
      // Optional visual QA output, not needed by normal test runs and contains only synthetic data.
      if (process.env.DDTECH_EXPORT_QA_DIR) {
        const { mkdir, writeFile } = await import('node:fs/promises');
        await mkdir(process.env.DDTECH_EXPORT_QA_DIR, { recursive: true });
        await writeFile(`${process.env.DDTECH_EXPORT_QA_DIR}/${name}.pdf`, new Uint8Array(buffer));
      }
    }
  }, 20000);
});
