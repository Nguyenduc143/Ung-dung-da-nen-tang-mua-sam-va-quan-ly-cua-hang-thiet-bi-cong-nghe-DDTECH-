import { App as AntApp } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersPage } from '../pages/OrdersPage';
import { InventoryPage } from '../pages/InventoryPage';
import type { InventoryProduct } from '../types/inventory';

const mocks = vi.hoisted(() => ({
  listOrders: vi.fn(), getOrder: vi.fn(), listInventory: vi.fn(), listLowStock: vi.fn(), listTransactions: vi.fn(),
  exportInvoice: vi.fn(), exportInventoryTable: vi.fn(),
}));
vi.mock('../api/orderApi', () => ({ listOrders: mocks.listOrders, getOrder: mocks.getOrder }));
vi.mock('../api/inventoryApi', () => ({ listInventory: mocks.listInventory, listLowStock: mocks.listLowStock, listTransactions: mocks.listTransactions }));
vi.mock('../api/axiosClient', () => ({ getApiErrorMessage: (_: unknown, fallback: string) => fallback }));
vi.mock('../utils/documentExport', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/documentExport')>(),
  exportInvoice: mocks.exportInvoice, exportInventoryTable: mocks.exportInventoryTable,
}));

const product: InventoryProduct = { id: 1, name: 'Laptop', slug: 'laptop', sku: 'LP01', stock: 12, soldCount: 3,
  hasVariants: false, variants: [], status: 'ACTIVE', updatedAt: '2026-10-08T08:00:00Z' };
const wrap = (page: React.ReactNode) => render(<AntApp><MemoryRouter>{page}</MemoryRouter></AntApp>);

describe('nút xuất file admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exportInvoice.mockResolvedValue(undefined); mocks.exportInventoryTable.mockResolvedValue(undefined);
    mocks.listOrders.mockResolvedValue({ orders: [{ id: 1, orderCode: 'DD001', customer: { fullName: 'Nguyễn Văn An', email: 'test@example.com' },
      receiverName: 'Nguyễn Văn An', receiverPhone: '0901234567', totalAmount: 100000, paymentMethod: 'COD', paymentStatus: 'UNPAID', status: 'PENDING', createdAt: product.updatedAt }], pagination: { total: 1 } });
    mocks.getOrder.mockResolvedValue({ order: { id: 1, orderCode: 'DD001' }, items: [] });
    mocks.listInventory.mockImplementation(async ({ page }: { page: number }) => ({ products: [{ ...product, id: page, name: `Laptop ${page}` }], pagination: { totalPages: 2, total: 2 } }));
    mocks.listLowStock.mockResolvedValue({ items: [{ product: { id: 1, name: 'Laptop', sku: 'LP01' }, variant: null, stock: 2 }], threshold: 5 });
    mocks.listTransactions.mockResolvedValue({ transactions: [], pagination: { totalPages: 0, total: 0 } });
  });

  it('xuất hóa đơn từ dòng đơn hàng bằng dữ liệu chi tiết mới nhất', async () => {
    wrap(<OrdersPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Hóa đơn/ }));
    await waitFor(() => expect(mocks.getOrder).toHaveBeenCalledWith(1));
    await waitFor(() => expect(mocks.exportInvoice).toHaveBeenCalledWith({ order: { id: 1, orderCode: 'DD001' }, items: [] }));
  });

  it('xuất đủ các trang tồn kho với bộ lọc đã chọn', async () => {
    wrap(<InventoryPage />);
    await screen.findByText('Laptop 1');
    fireEvent.change(screen.getByPlaceholderText('Tìm tên hoặc SKU'), { target: { value: 'Laptop' } });
    fireEvent.click(screen.getByRole('button', { name: /Xuất Excel/ }));
    await waitFor(() => expect(mocks.exportInventoryTable).toHaveBeenCalled());
    expect(mocks.listInventory).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 100, search: 'Laptop' }));
    expect(mocks.exportInventoryTable).toHaveBeenCalledWith(expect.objectContaining({ rows: [
      expect.arrayContaining(['Laptop 1']), expect.arrayContaining(['Laptop 2']),
    ] }), 'xlsx');
  });

  it('nút PDF xuất tab sắp hết thay vì danh sách tồn kho', async () => {
    wrap(<InventoryPage />);
    await screen.findByText('Laptop 1');
    fireEvent.click(screen.getByRole('tab', { name: /Sắp hết/ }));
    fireEvent.click(screen.getByRole('button', { name: /Xuất PDF/ }));
    await waitFor(() => expect(mocks.exportInventoryTable).toHaveBeenCalledWith(expect.objectContaining({
      title: 'BÁO CÁO HÀNG SẮP HẾT', rows: [['Laptop', 'LP01', '', '', 2]],
    }), 'pdf'));
  });

  it('tab lịch sử rỗng thông báo và không tạo file rỗng', async () => {
    wrap(<InventoryPage />);
    await screen.findByText('Laptop 1');
    fireEvent.click(screen.getByRole('tab', { name: /Lịch sử/ }));
    fireEvent.click(screen.getByRole('button', { name: /Xuất Excel/ }));
    await screen.findByText('Không có dữ liệu phù hợp để xuất.');
    expect(mocks.exportInventoryTable).not.toHaveBeenCalled();
  });
});
